import prisma from '../../../lib/prisma';
const { getProgressCache, getCacheDuration } = require('../../../utils/progressCache');

// Use shared cache instance
const progressCache = getProgressCache();
const CACHE_DURATION = getCacheDuration();

// Helper function to calculate individual participant progress
async function calculateIndividualParticipantProgress(participantId, projectParticipantId, groupId, projectId) {
  try {
    // Ensure we have valid parameters
    if (!groupId || !participantId) {
      console.warn('Missing required parameters for progress calculation');
      return { totalActivities: 0, completedActivities: 0, overallProgress: 0 };
    }

    // Get curriculums assigned to this group
    const groupCurriculumData = await prisma.group_curriculums.findMany({
      where: {
        groupId: groupId,
        isActive: true
      },
      include: {
        curriculum: {
          include: {
            curriculum_courses: {
              include: {
                course: {
                  include: {
                    events: {
                      where: {
                        projectId: parseInt(projectId)
                      },
                      include: {
                        event_attendees: {
                          where: {
                            enrolleeId: projectParticipantId, // Use project_participants.id (integer)
                            attendance_status: "present"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (groupCurriculumData.length === 0) {
      return 0; // No curriculums assigned
    }

    // Use Sets to track unique events and avoid double-counting overlapping courses
    const uniqueEventIds = new Set();
    const attendedEventIds = new Set();

    // Process all curriculum events for this participant
    for (const groupCurriculum of groupCurriculumData) {
      for (const curriculumCourse of groupCurriculum.curriculum.curriculum_courses) {
        for (const event of curriculumCourse.course.events) {
          // Only count each event once, even if it appears in multiple curriculums
          if (!uniqueEventIds.has(event.id)) {
            uniqueEventIds.add(event.id);
            const attendeeCount = event.event_attendees.length;
            if (attendeeCount > 0) {
              attendedEventIds.add(event.id);
            }
          }
        }
      }
    }

    const totalEvents = uniqueEventIds.size;
    const attendedEvents = attendedEventIds.size;

    if (totalEvents === 0) {
      return 0;
    }

    const progress = Math.round((attendedEvents / totalEvents) * 100);
    return progress;

  } catch (error) {
    console.error('Error calculating individual participant progress:', participantId, error);
    return 0;
  }
}

// Helper function to calculate curriculum progress for a group
async function calculateGroupCurriculumProgress(groupId, projectId) {
  try {
    // Get all group participants first
    const groupParticipants = await prisma.group_participants.findMany({
      where: { groupId: groupId },
      select: { participantId: true }
    });

    const participantIds = groupParticipants.map(gp => gp.participantId);
    if (participantIds.length === 0) {
      return 0; // No participants in group
    }

    // Get curriculums and their courses in one optimized query  
    const groupCurriculumData = await prisma.group_curriculums.findMany({
      where: {
        groupId: groupId,
        isActive: true
      },
      include: {
        curriculum: {
          include: {
            curriculum_courses: {
              include: {
                course: {
                  include: {
                    events: {
                      where: {
                        projectId: parseInt(projectId)
                      },
                      include: {
                        event_attendees: {
                          where: {
                            enrolleeId: { in: participantIds },
                            attendance_status: "present"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (groupCurriculumData.length === 0) {
      return 0; // No curriculums assigned
    }

    // Use Map to track unique events and avoid double-counting overlapping courses
    const uniqueEvents = new Map(); // eventId -> event data with attendance

    // Process all data in memory for better performance
    for (const groupCurriculum of groupCurriculumData) {
      for (const curriculumCourse of groupCurriculum.curriculum.curriculum_courses) {
        for (const event of curriculumCourse.course.events) {
          // Only count each event once, even if it appears in multiple curriculums
          if (!uniqueEvents.has(event.id)) {
            const presentCount = event.event_attendees.length;
            const totalParticipants = participantIds.length;
            
            uniqueEvents.set(event.id, {
              title: event.title,
              presentCount,
              totalParticipants,
              attendancePercentage: totalParticipants > 0 ? Math.round((presentCount/totalParticipants)*100) : 0
            });
          }
        }
      }
    }

    // Calculate totals from unique events
    let totalPossibleAttendance = 0;
    let actualAttendance = 0;
    
    for (const [eventId, eventData] of uniqueEvents) {
      totalPossibleAttendance += eventData.totalParticipants;
      actualAttendance += eventData.presentCount;
    }

    if (totalPossibleAttendance === 0) {
      return 0;
    }

    const progress = Math.round((actualAttendance / totalPossibleAttendance) * 100);
    return progress;

  } catch (error) {
    console.error('Error calculating curriculum progress for group:', groupId, error);
    return 0;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { groupId, projectId } = req.body;

  try {
    if (!groupId || !projectId) {
      return res.status(400).json({ error: 'Group ID and Project ID are required' });
    }

    // Check cache first
    const cacheKey = `${groupId}-${projectId}`;
    const cached = progressCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('Returning cached progress for group:', groupId);
      return res.status(200).json(cached.data);
    }

    console.log('Calculating fresh progress for group:', groupId);

    // Get group with participants
    const group = await prisma.groups.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        participants: {
          include: {
            participant: {
              include: {
                participant: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Calculate group progress
    const groupProgress = await calculateGroupCurriculumProgress(parseInt(groupId), projectId);
    
    // Calculate individual participant progress
    const participantsWithProgress = await Promise.all(
      group.participants.map(async (participantRelation) => {
        try {
          const participantId = participantRelation.participant.participant.id; // UUID
          const projectParticipantId = participantRelation.participant.id; // Integer ID
          const individualProgress = await calculateIndividualParticipantProgress(participantId, projectParticipantId, parseInt(groupId), projectId);
          
          return {
            participantId: projectParticipantId,
            progress: individualProgress || 0
          };
        } catch (error) {
          console.error(`Error calculating progress for participant:`, error);
          return {
            participantId: participantRelation.participant.id,
            progress: 0
          };
        }
      })
    );

    const result = {
      groupId: parseInt(groupId),
      groupProgress: groupProgress || 0,
      participantProgress: participantsWithProgress
    };

    // Cache the result
    progressCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (progressCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of progressCache.entries()) {
        if ((now - value.timestamp) > CACHE_DURATION) {
          progressCache.delete(key);
        }
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('[calculate-progress] Error:', error);
    res.status(500).json({ 
      error: "Internal Server Error",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
}