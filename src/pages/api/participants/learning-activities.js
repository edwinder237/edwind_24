import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { participantId, projectId } = req.query;

    if (!participantId || !projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Participant ID and Project ID are required' 
      });
    }

    // Get participant's enrolled courses in the project
    const participant = await prisma.project_participants.findFirst({
      where: {
        projectId: parseInt(projectId),
        participant: { id: participantId }, // Use relation to find by participants.id
        status: {
          not: 'removed'
        }
      },
      include: {
        courses_enrollee_progress: {
          include: {
            course: true
          }
        }
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this project'
      });
    }

    // Get all course progress for this participant (not just from project_participants relation)
    const [allParticipantProgress, eventCourses] = await Promise.all([
      // Get all course progress for this participant across the system
      prisma.courses_enrollee_progress.findMany({
        where: {
          enrollee: {
            participant: { id: participantId }
          }
        },
        include: {
          course: true
        }
      }),
      
      // Get courses from events the participant is assigned to
      prisma.events.findMany({
        where: {
          projectId: parseInt(projectId),
          courseId: { not: null },
          OR: [
            {
              event_attendees: {
                some: {
                  enrollee: {
                    participant: { id: participantId }
                  }
                }
              }
            },
            {
              event_groups: {
                some: {
                  groups: {
                    participants: {
                      some: {
                        participant: {
                          participant: { id: participantId }
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        },
        include: {
          course: true
        }
      })
    ]);

    // Combine and deduplicate courses
    const courseMap = new Map();
    
    // Add enrolled courses with progress
    allParticipantProgress.forEach((courseProgress) => {
      const course = courseProgress.course;
      courseMap.set(course.id, {
        id: course.id,
        title: course.title,
        completed: courseProgress.completed || false,
        score: courseProgress.averageScore || null,
        duration: course.estimatedDuration ? `${course.estimatedDuration} min` : '60 min',
        date: courseProgress.completedAt ? new Date(courseProgress.completedAt).toISOString().split('T')[0] : null,
        source: 'enrolled'
      });
    });
    
    // Add event courses (check if there's progress data)
    eventCourses.forEach((event) => {
      if (event.course && !courseMap.has(event.course.id)) {
        // Look for any existing progress for this participant and course
        const existingProgress = allParticipantProgress.find(ep => ep.courseId === event.course.id);
        
        courseMap.set(event.course.id, {
          id: event.course.id,
          title: event.course.title,
          completed: existingProgress ? existingProgress.completed : false,
          score: existingProgress ? existingProgress.averageScore : null,
          duration: event.course.estimatedDuration ? `${event.course.estimatedDuration} min` : '60 min',
          date: existingProgress && existingProgress.completedAt 
            ? new Date(existingProgress.completedAt).toISOString().split('T')[0] 
            : null,
          source: 'event'
        });
      }
    });

    const activities = Array.from(courseMap.values());


    res.status(200).json({
      success: true,
      activities: activities
    });

  } catch (error) {
    console.error('Error fetching learning activities:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch learning activities',
      error: error.message 
    });
  }
}