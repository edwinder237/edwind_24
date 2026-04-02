import { ConsoleSqlOutlined } from "@ant-design/icons";
import { createHandler } from '../../../lib/api/createHandler';
import prisma from "../../../lib/prisma";
import { requireResourceCapacity, checkResourceCapacity } from "../../../lib/features/featureMiddleware";
import { RESOURCES } from "../../../lib/features/featureAccess";

const handler = createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { newProject } = req.body;
  //delete newProject.id;

  // Check monthly project quota if subscription context is available
  if (req.subscription && req.resourceUsage) {
    const monthlyCapacity = await checkResourceCapacity(req, RESOURCES.PROJECTS_PER_MONTH, 1);
    if (!monthlyCapacity.hasCapacity) {
      return res.status(403).json({
        error: 'Resource limit exceeded',
        resource: 'projects_per_month',
        message: `You have reached your monthly project creation limit`,
        current: monthlyCapacity.current,
        limit: monthlyCapacity.limit,
        available: monthlyCapacity.available,
        upgradeUrl: '/upgrade'
      });
    }
  }

  // First, check if the user exists, if not create a default user or use system user
  let userExists = await prisma.user.findUnique({
    where: { id: newProject.createdBy }
  });

  if (!userExists) {
    // Try to find any existing user to use as default
    const anyUser = await prisma.user.findFirst();
    
    if (!anyUser) {
      // Create a default system user if no users exist
      userExists = await prisma.user.create({
        data: {
          id: newProject.createdBy,
          email: 'system@example.com',
          password: 'system', // This should be hashed in production
          firstName: 'System',
          lastName: 'User',
          sub_organizationId: 1, // Default organization
          info: {}
        }
      });
    } else {
      // Use the first available user
      newProject.createdBy = anyUser.id;
    }
  }

  const projectData = {
    cuid: newProject.cuid,
    title: newProject.title,
    summary: newProject.summary,
    duration: newProject.duration || 30,
    tags: newProject.tags,
    projectType: newProject.projectType,
    projectCategory: newProject.projectCategory || "CategoryB",
    projectStatus: newProject.projectStatus || "In Progress",
    backgroundImg: newProject.backgroundImg || "image_url.jpg",
    color: newProject.color || "#3498db",
    language: newProject.language,
    location: newProject.location,
    published: newProject.published,
    lastUpdated: new Date(),
    updatedby: newProject.createdBy,
    CreatedBy: newProject.createdBy, // Note: using CreatedBy (capital C) as per schema
    sub_organizationId: newProject.sub_organizationId,
    ...(newProject.trainingRecipientId && {
      trainingRecipientId: newProject.trainingRecipientId
    })
  };

  try {
    // Create the project first
    const createdProject = await prisma.projects.create({
      data: projectData,
    });

    // If startDate and endDate are provided, create project_settings
    if (newProject.startDate || newProject.endDate) {
      await prisma.project_settings.create({
        data: {
          projectId: createdProject.id,
          startDate: newProject.startDate ? new Date(newProject.startDate) : null,
          endDate: newProject.endDate ? new Date(newProject.endDate) : null,
          startOfDayTime: "09:00",
          endOfDayTime: "17:00", 
          lunchTime: "12:00-13:00",
          timezone: newProject.timezone || "UTC",
          workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          createdBy: newProject.createdBy
        }
      });
    }

    // If curriculumId is provided, handle curriculum linking
    if (newProject.curriculumId) {
      let curriculumIdToLink = newProject.curriculumId;

      // If the default curriculum was selected, clone it with a project-specific name
      if (newProject.isDefaultCurriculum) {
        const projectTitle = (newProject.title || 'Untitled Project').substring(0, 200);
        const curriculumTitle = `${projectTitle} - Curriculum`;

        const defaultCurriculum = await prisma.curriculums.findUnique({
          where: { id: newProject.curriculumId },
          include: {
            curriculum_courses: true,
            supportActivities: true
          }
        });

        if (defaultCurriculum) {
          const newCurriculum = await prisma.curriculums.create({
            data: {
              title: curriculumTitle,
              description: defaultCurriculum.description,
              isDefault: false,
              sub_organizationId: newProject.sub_organizationId
            }
          });

          if (defaultCurriculum.curriculum_courses.length > 0) {
            await prisma.curriculum_courses.createMany({
              data: defaultCurriculum.curriculum_courses.map(cc => ({
                curriculumId: newCurriculum.id,
                courseId: cc.courseId
              }))
            });
          }

          if (defaultCurriculum.supportActivities.length > 0) {
            await prisma.supportActivities.createMany({
              data: defaultCurriculum.supportActivities.map(sa => ({
                title: sa.title,
                description: sa.description,
                duration: sa.duration,
                materials: sa.materials,
                curriculumId: newCurriculum.id
              }))
            });
          }

          curriculumIdToLink = newCurriculum.id;
        }
      }

      await prisma.project_curriculums.create({
        data: {
          projectId: createdProject.id,
          curriculumId: curriculumIdToLink
        }
      });
    }

    // If instructorId is provided, create project_instructors relationship
    if (newProject.instructorId) {
      await prisma.project_instructors.create({
        data: {
          projectId: createdProject.id,
          instructorId: parseInt(newProject.instructorId),
          instructorType: 'main'
        }
      });
    }

    res.status(200).json({
      message: "Project created and saved to database",
      projectId: createdProject.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  }
});

// Wrap with resource capacity check for projects
export default requireResourceCapacity(RESOURCES.PROJECTS, 1)(handler);
