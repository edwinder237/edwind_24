import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import prisma from '../../../lib/prisma';
import { errorHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { projectId } = req.query;

    // Use organization context for multi-tenant scoping
    const subOrgIds = orgContext.subOrganizationIds;

    // Build base where clause with multi-tenant scoping
    const baseWhere = {
      sub_organizationId: {
        in: subOrgIds
      },
      isActive: true
    };

    // Fetch all filter options in parallel, scoped to user's accessible sub-organizations
    const [courses, participants, instructors, trainingRecipients, topics, projects, assessments] = await Promise.all([
      // Courses - scoped by sub_organizationId
      prisma.courses.findMany({
        where: baseWhere,
        select: {
          id: true,
          title: true,
          duration: true,
          course_topics: {
            include: {
              topic: true
            }
          }
        },
        orderBy: {
          title: 'asc'
        }
      }),

      // Participants - scoped by sub_organization field and optionally project
      prisma.participants.findMany({
        where: {
          ...(projectId ? {
            projects: {
              some: {
                projectId: parseInt(projectId)
              }
            }
          } : {}),
          sub_organization: {
            in: subOrgIds
          }
        },
        include: {
          role: true,
          training_recipient: true
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      }),

      // Instructors - scoped by sub_organizationId
      prisma.instructors.findMany({
        where: {
          sub_organizationId: {
            in: subOrgIds
          },
          status: 'active'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          expertise: true,
          instructorType: true
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      }),

      // Training Recipients - scoped by sub_organizationId
      prisma.training_recipients.findMany({
        where: {
          sub_organizationId: {
            in: subOrgIds
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          industry: true
        },
        orderBy: {
          name: 'asc'
        }
      }),

      // Topics - scoped by sub_organizationId
      prisma.topics.findMany({
        where: {
          sub_organizationId: {
            in: subOrgIds
          },
          isActive: true
        },
        select: {
          id: true,
          title: true,
          description: true,
          color: true,
          icon: true
        },
        orderBy: {
          title: 'asc'
        }
      }),

      // Projects - scoped by sub_organizationId
      prisma.projects.findMany({
        where: {
          sub_organizationId: {
            in: subOrgIds
          }
        },
        select: {
          id: true,
          title: true,
          summary: true,
          projectStatus: true
        },
        orderBy: {
          title: 'asc'
        }
      }),

      // Assessments - scoped through course's sub_organizationId
      prisma.course_assessments.findMany({
        where: {
          isActive: true,
          course: {
            sub_organizationId: {
              in: subOrgIds
            },
            isActive: true
          }
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              cuid: true
            }
          }
        },
        orderBy: {
          title: 'asc'
        }
      })
    ]);

    // Transform data for frontend
    const filterOptions = {
      courses: courses.map(course => ({
        id: course.id,
        name: course.title,
        duration: course.duration,
        topics: course.course_topics.map(ct => ct.topic.title)
      })),

      participants: participants.map(participant => ({
        id: participant.id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        department: participant.derpartement,
        company: participant.training_recipient?.name || 'Unknown',
        role: participant.role?.title || 'No Role',
        trainingRecipient: participant.training_recipient?.name || 'Unknown'
      })),

      instructors: instructors.map(instructor => ({
        id: instructor.id,
        name: `${instructor.firstName} ${instructor.lastName}`,
        specialization: instructor.expertise?.join(', ') || 'General',
        instructorType: instructor.instructorType
      })),

      trainingRecipients: trainingRecipients.map(recipient => ({
        id: recipient.id,
        name: recipient.name,
        description: recipient.description,
        industry: recipient.industry
      })),

      topics: topics.map(topic => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        color: topic.color,
        icon: topic.icon
      })),

      projects: projects.map(project => ({
        id: project.id,
        name: project.title || `Project ${project.id}`,
        summary: project.summary,
        status: project.projectStatus
      })),

      assessments: assessments.map(assessment => ({
        id: assessment.id,
        name: assessment.title,
        course: assessment.course.title,
        courseId: assessment.course.id,
        maxScore: assessment.maxScore,
        passingScore: assessment.passingScore,
        type: assessment.title.toLowerCase().includes('quiz') ? 'Quiz' :
              assessment.title.toLowerCase().includes('exam') ? 'Exam' :
              assessment.title.toLowerCase().includes('practical') ? 'Practical' : 'Assessment'
      })),

      // Updated status options based on attendance
      statusOptions: [
        'Scheduled',
        'Completed',
        'Not Completed',
        'Not Started'
      ],

      // Extract unique companies from training recipients
      companies: [...new Set(trainingRecipients.map(tr => tr.name))].sort()
    };

    res.status(200).json({
      success: true,
      data: filterOptions
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    return errorHandler(error, req, res);
  }
}

export default withOrgScope(handler);
