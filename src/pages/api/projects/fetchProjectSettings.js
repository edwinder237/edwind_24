import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  try {
    const projectIdInt = parseInt(projectId);
    
    // Get project with its settings and basic related data
    const project = await prisma.projects.findUnique({
      where: {
        id: projectIdInt,
      },
      include: {
        // Include project settings
        project_settings: true,
        
        // Include organization
        sub_organization: {
          select: {
            id: true,
            title: true,
            description: true,
            organizationId: true,
          }
        },
        
        // Include training recipient
        training_recipient: {
          select: {
            id: true,
            name: true,
            description: true,
            contactPerson: true,
            email: true,
            phone: true,
            address: true,
            website: true,
            industry: true,
          }
        },
        
        // Include project instructors
        project_instructors: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                bio: true,
                profileImage: true,
                status: true,
              }
            }
          }
        },
        
        // Include project topics
        project_topics: {
          include: {
            topic: {
              select: {
                id: true,
                title: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
              }
            }
          }
        },
        
        // Include project curriculums
        project_curriculums: {
          include: {
            curriculum: {
              select: {
                id: true,
                cuid: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          }
        },
        
        // Include basic counts
        _count: {
          select: {
            participants: true,
            events: true,
            groups: true,
            training_plans: true,
          }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }
    
    // Get available roles for the organization
    const availableRoles = await prisma.sub_organization_participant_role.findMany({
      where: {
        sub_organizationId: project.sub_organizationId,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
      orderBy: {
        title: 'asc'
      }
    });
    
    // Get training plans for the project
    const trainingPlans = await prisma.training_plans.findMany({
      where: {
        projectId: projectIdInt
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        totalDays: true,
        curriculumId: true,
        _count: {
          select: {
            days: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });
    
    // Get available training recipients for the organization
    const availableTrainingRecipients = await prisma.training_recipients.findMany({
      where: {
        sub_organizationId: project.sub_organizationId
      },
      select: {
        id: true,
        name: true,
        description: true,
        contactPerson: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        industry: true,
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Get available topics for the organization
    const availableTopics = await prisma.topics.findMany({
      where: {
        sub_organizationId: project.sub_organizationId,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        color: true,
        icon: true,
        isActive: true,
      },
      orderBy: {
        title: 'asc'
      }
    });
    
    // Get available curriculums for the organization
    const availableCurriculums = await prisma.curriculums.findMany({
      select: {
        id: true,
        cuid: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        title: 'asc'
      }
    });
    
    // Get available instructors for the organization
    const availableInstructors = await prisma.instructors.findMany({
      where: {
        sub_organizationId: project.sub_organizationId,
        status: 'active'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        bio: true,
        profileImage: true,
        status: true,
      },
      orderBy: {
        firstName: 'asc'
      }
    });
    
    // Format the response
    const settingsData = {
      success: true,
      data: {
        // Project info
        project: {
          id: project.id,
          title: project.title,
          summary: project.summary,
          status: project.projectStatus,
          startDate: project.startDate,
          endDate: project.endDate,
          trainingRecipientId: project.trainingRecipientId,
          sub_organizationId: project.sub_organizationId,
          tags: project.tags,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          organization: project.sub_organization,
          training_recipient: project.training_recipient,
          counts: project._count
        },
        
        // Project settings
        settings: project.project_settings || {
          startDate: project.startDate,
          endDate: project.endDate,
          startOfDayTime: "09:00",
          endOfDayTime: "17:00",
          lunchTime: "12:00-13:00",
          timezone: "UTC",
          workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
        },
        
        // Available roles
        availableRoles: availableRoles,
        
        // Available training recipients
        availableTrainingRecipients: availableTrainingRecipients,
        
        // Available topics
        availableTopics: availableTopics,
        
        // Available curriculums
        availableCurriculums: availableCurriculums,
        
        // Available instructors
        availableInstructors: availableInstructors.map(instructor => ({
          id: instructor.id,
          firstName: instructor.firstName,
          lastName: instructor.lastName,
          fullName: `${instructor.firstName} ${instructor.lastName}`,
          email: instructor.email,
          phone: instructor.phone,
          bio: instructor.bio,
          profileImage: instructor.profileImage,
          status: instructor.status,
        })),
        
        // Training plans
        trainingPlans: trainingPlans.map(plan => ({
          id: plan.id,
          title: plan.title,
          description: plan.description,
          status: plan.status,
          totalDays: plan.totalDays,
          dayCount: plan._count.days,
          curriculumId: plan.curriculumId
        })),
        
        // Project instructors
        projectInstructors: project.project_instructors?.map(pi => ({
          id: pi.id,
          instructorId: pi.instructorId,
          instructorType: pi.instructorType,
          role: pi.role,
          status: pi.status,
          assignedAt: pi.assignedAt,
          instructor: {
            id: pi.instructor.id,
            firstName: pi.instructor.firstName,
            lastName: pi.instructor.lastName,
            fullName: `${pi.instructor.firstName} ${pi.instructor.lastName}`,
            email: pi.instructor.email,
            phone: pi.instructor.phone,
            bio: pi.instructor.bio,
            profileImage: pi.instructor.profileImage,
            status: pi.instructor.status,
          }
        })) || [],
        
        // Project topics
        projectTopics: project.project_topics?.map(pt => ({
          id: pt.id,
          topicId: pt.topicId,
          projectId: pt.projectId,
          assignedAt: pt.assignedAt,
          topic: {
            id: pt.topic.id,
            title: pt.topic.title,
            description: pt.topic.description,
            color: pt.topic.color,
            icon: pt.topic.icon,
            isActive: pt.topic.isActive,
          }
        })) || [],
        
        // Project curriculums
        projectCurriculums: project.project_curriculums?.map(pc => ({
          id: pc.id,
          curriculumId: pc.curriculumId,
          projectId: pc.projectId,
          assignedAt: pc.assignedAt,
          curriculum: {
            id: pc.curriculum.id,
            cuid: pc.curriculum.cuid,
            title: pc.curriculum.title,
            description: pc.curriculum.description,
            createdAt: pc.curriculum.createdAt,
            updatedAt: pc.curriculum.updatedAt,
          }
        })) || [],
        
        // Summary
        summary: {
          participantCount: project._count.participants,
          eventCount: project._count.events,
          groupCount: project._count.groups,
          trainingPlanCount: project._count.training_plans,
          roleCount: availableRoles.length,
          instructorCount: project.project_instructors?.length || 0,
          topicCount: project.project_topics?.length || 0,
          curriculumCount: project.project_curriculums?.length || 0
        }
      },
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json(settingsData);
    
  } catch (error) {
    console.error('Error fetching project settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch project settings',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}