import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId, sub_organizationId } = req.query;

    if (!sub_organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'sub_organizationId is required' 
      });
    }

    const orgId = parseInt(sub_organizationId);
    
    // Build base where clause
    const baseWhere = {
      sub_organizationId: orgId,
      isActive: true
    };

    if (projectId) {
      baseWhere.projects = {
        some: {
          id: parseInt(projectId)
        }
      };
    }

    // Fetch all filter options in parallel
    const [courses, participants, instructors, trainingRecipients, topics, projects, assessments] = await Promise.all([
      // Courses
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

      // Participants (through project if specified)
      prisma.participants.findMany({
        where: {
          ...(projectId ? {
            projects: {
              some: {
                projectId: parseInt(projectId)
              }
            }
          } : {}),
          sub_organization: orgId
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

      // Instructors
      prisma.instructors.findMany({
        where: {
          sub_organizationId: orgId,
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

      // Training Recipients
      prisma.training_recipients.findMany({
        where: {
          sub_organizationId: orgId
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

      // Topics
      prisma.topics.findMany({
        where: {
          sub_organizationId: orgId,
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

      // Projects
      prisma.projects.findMany({
        where: {
          sub_organizationId: orgId
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

      // Assessments
      prisma.course_assessments.findMany({
        where: {
          isActive: true,
          course: {
            sub_organizationId: orgId,
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
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}