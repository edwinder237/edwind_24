/**
 * ============================================
 * POST /api/projects/fetchGroupsDetails
 * ============================================
 *
 * Returns detailed group data with participants and curriculum progress.
 * FIXED: Previously leaked group data across organizations.
 *
 * Body:
 * - projectId (required): Project ID to fetch groups for
 *
 * Response:
 * [
 *   {
 *     id: number,
 *     groupName: string,
 *     participants: [...],
 *     group_curriculums: [...]
 *   }
 * ]
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

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

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.body;
  const { orgContext } = req;

  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  // Verify project ownership
  const projectOwnership = await scopedFindUnique(orgContext, 'projects', {
    where: { id: parseInt(projectId) }
  });

  if (!projectOwnership) {
    throw new NotFoundError('Project not found');
  }

  try {

    // OPTIMIZED: Fast query without progress calculation
    const groups = await prisma.groups.findMany({
      where: {
        projectId: parseInt(projectId),
      },
      select: {
        id: true,
        groupName: true,
        chipColor: true,
        projectId: true,
        participants: {
          select: {
            id: true,
            participantId: true,
            participant: {
              select: {
                id: true,
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
          select: {
            id: true,
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

    // Return groups WITHOUT expensive progress calculations
    const optimizedGroups = groups.map(group => ({
      ...group,
      progress: null, // Will be calculated lazily when expanded
      participants: group.participants.map(p => ({
        ...p,
        participant: {
          ...p.participant,
          participant: {
            ...p.participant.participant,
            progress: null // Will be calculated lazily when expanded
          }
        }
      })),
      // Ensure all required fields have default values
      id: group.id || null,
      groupName: group.groupName || '',
      chipColor: group.chipColor || '#1976d2',
      projectId: group.projectId || parseInt(projectId)
    }));

    res.status(200).json(optimizedGroups);
  } catch (error) {
    console.error('[fetchGroupsDetails] Error:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));