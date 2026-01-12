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

      // Get courses from events the participant is assigned to (with module progress and attendance)
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
          course: {
            include: {
              modules: {
                select: {
                  id: true,
                  _count: {
                    select: { activities: true }
                  }
                }
              }
            }
          },
          event_module_progress: {
            where: { completed: true }
          },
          event_attendees: {
            where: {
              enrollee: {
                participant: { id: participantId }
              }
            },
            select: {
              attendance_status: true
            }
          }
        }
      })
    ]);

    // Debug logging
    console.log('Learning activities debug:', {
      participantId,
      projectId,
      participantDbId: participant.id,
      allParticipantProgressCount: allParticipantProgress.length,
      eventCoursesCount: eventCourses.length
    });

    // Combine and deduplicate courses
    const courseMap = new Map();

    // Add enrolled courses with progress from courses_enrollee_progress
    allParticipantProgress.forEach((courseProgress) => {
      const course = courseProgress.course;
      console.log('Found enrollee progress:', {
        courseId: course.id,
        courseTitle: course.title,
        completed: courseProgress.completed,
        enrolleeId: courseProgress.enrolleeId
      });
      courseMap.set(course.id, {
        id: course.id,
        title: course.title,
        completed: courseProgress.completed || false,
        score: null,
        duration: course.estimatedDuration ? `${course.estimatedDuration} min` : '60 min',
        date: courseProgress.lastUpdated ? new Date(courseProgress.lastUpdated).toISOString().split('T')[0] : null,
        source: 'enrolled'
      });
    });

    // Add event courses (check if there's progress data from event_module_progress)
    eventCourses.forEach((event) => {
      if (event.course) {
        // Look for any existing progress for this participant and course
        const existingProgress = allParticipantProgress.find(ep => ep.courseId === event.course.id);

        // Check if participant attended this event (present or late counts as attended)
        const attendanceStatus = event.event_attendees?.[0]?.attendance_status;
        const hasAttended = attendanceStatus === 'present' || attendanceStatus === 'late';

        // Only count modules that have activities (modules with 0 activities don't count)
        const modulesWithActivities = event.course.modules?.filter(m => m._count?.activities > 0) || [];
        const totalModules = modulesWithActivities.length;

        // Count completed modules (only those with activities)
        const moduleIdsWithActivities = modulesWithActivities.map(m => m.id);
        const completedModulesInEvent = event.event_module_progress?.filter(mp =>
          moduleIdsWithActivities.includes(mp.moduleId)
        ).length || 0;

        // If course has no modules with activities, consider it complete ONLY if participant attended
        const hasNoActivitiesToComplete = totalModules === 0;
        const isCompleteNoActivities = hasNoActivitiesToComplete && hasAttended;

        console.log('Event course check:', {
          eventId: event.id,
          courseId: event.course.id,
          courseTitle: event.course.title,
          totalModulesRaw: event.course.modules?.length || 0,
          totalModulesWithActivities: totalModules,
          completedModulesInEvent,
          hasNoActivitiesToComplete,
          attendanceStatus,
          hasAttended,
          existingProgressCompleted: existingProgress?.completed
        });

        const isCompletedFromModules = totalModules > 0 && completedModulesInEvent >= totalModules;
        // Course is complete if: already marked complete, all modules done, OR (no activities AND attended)
        const isCompleted = existingProgress?.completed || isCompletedFromModules || isCompleteNoActivities;

        // Calculate progress percentage - 100% only if no activities AND attended
        const progressPercentage = isCompleteNoActivities ? 100 : (totalModules > 0 ? (completedModulesInEvent / totalModules) * 100 : 0);

        // Update existing entry or create new one
        if (courseMap.has(event.course.id)) {
          // Update if module progress shows better completion
          const existing = courseMap.get(event.course.id);
          if (!existing.completed && isCompletedFromModules) {
            existing.completed = true;
          }
          // Update progress if we have module data
          if (totalModules > 0) {
            existing.completedModules = completedModulesInEvent;
            existing.totalModules = totalModules;
            existing.progressPercentage = progressPercentage;
          }
        } else {
          courseMap.set(event.course.id, {
            id: event.course.id,
            title: event.course.title,
            completed: isCompleted,
            completedModules: completedModulesInEvent,
            totalModules: totalModules,
            progressPercentage: progressPercentage,
            score: null,
            duration: event.course.estimatedDuration ? `${event.course.estimatedDuration} min` : '60 min',
            date: existingProgress?.lastUpdated
              ? new Date(existingProgress.lastUpdated).toISOString().split('T')[0]
              : null,
            source: 'event'
          });
        }
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