import prisma from "../../../lib/prisma";
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.cookies.workos_user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await workos.userManagement.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { participantId, oldGroupIds = [], newGroupId = null } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    let updatesApplied = 0;
    const errors = [];

    try {
      // Step 1: Find all events that the participant should no longer attend
      // These are events where:
      // - Participant was added via 'group' attendanceType
      // - The event has groups from oldGroupIds but NOT newGroupId
      
      if (oldGroupIds.length > 0) {
        // Get events that have the old groups but NOT the new group
        const eventsToRemoveFrom = await prisma.events.findMany({
          where: {
            event_groups: {
              some: {
                groupId: {
                  in: oldGroupIds.map(id => parseInt(id))
                }
              }
            },
            // If there's a new group, exclude events that also have the new group
            ...(newGroupId && {
              NOT: {
                event_groups: {
                  some: {
                    groupId: parseInt(newGroupId)
                  }
                }
              }
            })
          },
          include: {
            event_groups: true
          }
        });

        // Remove participant from these events (only if they were added via group)
        for (const event of eventsToRemoveFrom) {
          try {
            const deleteResult = await prisma.event_attendees.deleteMany({
              where: {
                eventsId: event.id,
                enrolleeId: parseInt(participantId),
                attendanceType: 'group'
              }
            });
            
            if (deleteResult.count > 0) {
              updatesApplied++;
            }
          } catch (error) {
            errors.push({
              action: 'remove',
              eventId: event.id,
              error: error.message
            });
          }
        }
      }

      // Step 2: Add participant to events with the new group
      if (newGroupId) {
        // Get events that have the new group
        const eventsToAddTo = await prisma.events.findMany({
          where: {
            event_groups: {
              some: {
                groupId: parseInt(newGroupId)
              }
            }
          }
        });

        // Add participant to these events if not already present
        for (const event of eventsToAddTo) {
          try {
            // Check if already attending (either as group or individual)
            const existingAttendee = await prisma.event_attendees.findFirst({
              where: {
                eventsId: event.id,
                enrolleeId: parseInt(participantId)
              }
            });

            if (!existingAttendee) {
              await prisma.event_attendees.create({
                data: {
                  eventsId: event.id,
                  enrolleeId: parseInt(participantId),
                  attendanceType: 'group',
                  attendance_status: 'scheduled',
                  createdBy: user.id,
                  updatedby: user.id
                }
              });
              updatesApplied++;
            }
          } catch (error) {
            errors.push({
              action: 'add',
              eventId: event.id,
              error: error.message
            });
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: `Event attendees synchronized successfully`,
        updatesApplied,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Error in sync operation:', error);
      return res.status(500).json({
        error: 'Failed to sync event attendees',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Error syncing event attendees:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}