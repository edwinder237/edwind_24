import prisma from "../../../lib/prisma";
import { transformCourseWithCompletion } from "../../../utils/courseCompletionCalculator";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { groupId } = req.query;

    // Validate required fields
    if (!groupId) {
      return res.status(400).json({ 
        error: 'Missing required parameter', 
        details: 'groupId is required'
      });
    }

    // Check if group exists
    const group = await prisma.groups.findUnique({
      where: { id: parseInt(groupId) },
      include: { 
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get the project ID for filtering events
    const projectId = group.project.id;
    
    // Get all participants in this group to check event attendance
    const groupParticipants = await prisma.group_participants.findMany({
      where: { groupId: parseInt(groupId) },
      select: { participantId: true }
    });
    
    const groupParticipantIds = groupParticipants.map(gp => gp.participantId);

    // Fetch all curriculums assigned to this group
    const groupCurriculums = await prisma.group_curriculums.findMany({
      where: {
        groupId: parseInt(groupId),
        isActive: true
      },
      include: {
        curriculum: {
          include: {
            curriculum_courses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    summary: true,
                    events: {
                      where: {
                        projectId: projectId
                      },
                      select: {
                        id: true,
                        title: true,
                        event_groups: {
                          where: {
                            groupId: parseInt(groupId)
                          },
                          select: {
                            id: true
                          }
                        },
                        event_attendees: {
                          select: {
                            enrolleeId: true,
                            attendance_status: true,
                            enrollee: {
                              select: {
                                id: true,
                                participant: {
                                  select: {
                                    id: true
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
            }
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    // Transform the data for frontend consumption
    const transformedCurriculums = groupCurriculums.map(gc => {
      const courses = gc.curriculum.curriculum_courses.map(cc => {
        // Use the extracted function to transform course with completion data
        return transformCourseWithCompletion(cc.course, groupParticipantIds);
      });
      
      return {
        assignmentId: gc.id,
        assignedAt: gc.assignedAt,
        assignedBy: gc.assignedBy,
        isActive: gc.isActive,
        curriculum: {
          id: gc.curriculum.id,
          title: gc.curriculum.title,
          description: gc.curriculum.description,
          courseCount: gc.curriculum.curriculum_courses.length,
          courses: courses
        }
      };
    });

    res.status(200).json({
      success: true,
      group: {
        id: group.id,
        groupName: group.groupName,
        project: group.project
      },
      curriculums: transformedCurriculums,
      count: transformedCurriculums.length
    });
  }
});