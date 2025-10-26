import prisma from "../../../lib/prisma";

/**
 * Bulk API endpoint for adding multiple participants and groups to an event
 * This replaces multiple individual API calls for better performance
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId, participants = [], groups = [] } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    const results = {
      addedParticipants: [],
      addedGroups: [],
      errors: []
    };

    // Add individual participants
    for (const participant of participants) {
      try {
        // Check if participant is already in the event
        const existingAttendee = await prisma.event_attendees.findFirst({
          where: {
            eventsId: parseInt(eventId),
            enrolleeId: participant.id
          }
        });

        if (!existingAttendee) {
          const newAttendee = await prisma.event_attendees.create({
            data: {
              eventsId: parseInt(eventId),
              enrolleeId: participant.id,
              attendance_status: 'scheduled',
              attendanceType: 'individual'
            }
          });
          results.addedParticipants.push(newAttendee);
        }
      } catch (error) {
        console.error(`Error adding participant ${participant.id}:`, error);
        results.errors.push({
          type: 'participant',
          id: participant.id,
          error: error.message
        });
      }
    }

    // Add groups
    for (const group of groups) {
      try {
        // Check if group is already added to the event
        const existingEventGroup = await prisma.event_groups.findFirst({
          where: {
            eventsId: parseInt(eventId),
            groupId: group.id
          }
        });

        if (!existingEventGroup) {
          const newEventGroup = await prisma.event_groups.create({
            data: {
              eventsId: parseInt(eventId),
              groupId: group.id
            }
          });
          results.addedGroups.push(newEventGroup);

          // Add all group participants as attendees
          const groupParticipants = await prisma.group_participants.findMany({
            where: {
              groupId: group.id,
              participant: {
                status: {
                  not: 'removed'
                }
              }
            },
            include: {
              participant: true
            }
          });

          for (const groupParticipant of groupParticipants) {
            try {
              // Check if participant is already in the event
              const existingAttendee = await prisma.event_attendees.findFirst({
                where: {
                  eventsId: parseInt(eventId),
                  enrolleeId: groupParticipant.participant.id
                }
              });

              if (!existingAttendee) {
                await prisma.event_attendees.create({
                  data: {
                    eventsId: parseInt(eventId),
                    enrolleeId: groupParticipant.participant.id,
                    attendance_status: 'scheduled',
                    attendanceType: 'group'
                  }
                });
              }
            } catch (error) {
              console.error(`Error adding group participant ${groupParticipant.participant.id}:`, error);
              results.errors.push({
                type: 'group_participant',
                groupId: group.id,
                participantId: groupParticipant.participant.id,
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error adding group ${group.id}:`, error);
        results.errors.push({
          type: 'group',
          id: group.id,
          error: error.message
        });
      }
    }

    // Note: sync-event-attendees procedure not available in current schema
    // Data consistency is maintained through the explicit checks above

    res.status(200).json({
      success: true,
      data: results,
      message: `Added ${results.addedParticipants.length} participants and ${results.addedGroups.length} groups to event`
    });

  } catch (error) {
    console.error('Error in bulk add operation:', error);
    res.status(500).json({ 
      error: 'Failed to add participants and groups to event', 
      details: error.message 
    });
  }
}