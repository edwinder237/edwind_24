import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to calculate individual participant progress
async function calculateIndividualParticipantProgress(participantId, projectParticipantId, groupId, projectId) {
  try {
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
  
  const { projectId } = req.body;

  try {
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const groups = await prisma.groups.findMany({
      where: {
        projectId: parseInt(projectId),
      },
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
                    email: true,
                    derpartement: true,
                    roleId: true,
                    profileImg: true,
                    role: {
                      select: {
                        id: true,
                        title: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        group_curriculums: {
          where: {
            isActive: true
          },
          include: {
            curriculum: {
              select: {
                id: true,
                title: true,
                description: true,
              }
            }
          }
        }
      },
    });

    // Calculate curriculum progress for each group and individual participants
    const groupsWithProgress = await Promise.all(
      groups.map(async (group) => {
        try {
          const progress = await calculateGroupCurriculumProgress(group.id, projectId);
          
          // Calculate individual progress for each participant
          const participantsWithProgress = await Promise.all(
            group.participants.map(async (participantRelation) => {
              try {
                const participantId = participantRelation.participant.participant.id; // UUID
                const projectParticipantId = participantRelation.participant.id; // Integer ID from project_participants table
                const individualProgress = await calculateIndividualParticipantProgress(participantId, projectParticipantId, group.id, projectId);
                
                return {
                  ...participantRelation,
                  participant: {
                    ...participantRelation.participant,
                    participant: {
                      ...participantRelation.participant.participant,
                      progress: individualProgress || 0
                    }
                  }
                };
              } catch (error) {
                console.error(`Error calculating progress for participant:`, error);
                return {
                  ...participantRelation,
                  participant: {
                    ...participantRelation.participant,
                    participant: {
                      ...participantRelation.participant.participant,
                      progress: 0
                    }
                  }
                };
              }
            })
          );

          return {
            ...group,
            progress: progress || 0, // Ensure progress is never undefined
            participants: participantsWithProgress, // Use participants with individual progress
            // Ensure all required fields have default values
            id: group.id || null,
            groupName: group.groupName || '',
            chipColor: group.chipColor || '#default',
            projectId: group.projectId || parseInt(projectId)
          };
        } catch (error) {
          console.error(`Error processing group ${group.id}:`, error);
          return {
            ...group,
            progress: 0, // Default to 0 on error
            id: group.id || null,
            groupName: group.groupName || '',
            chipColor: group.chipColor || '#default',
            projectId: group.projectId || parseInt(projectId)
          };
        }
      })
    );

    res.status(200).json(groupsWithProgress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
