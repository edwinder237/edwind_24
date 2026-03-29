import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Fetch event attendees with their participant data and tool accesses
    const eventAttendees = await prisma.event_attendees.findMany({
      where: {
        eventsId: parseInt(eventId),
        enrollee: {
          status: {
            not: 'removed'
          }
        }
      },
      include: {
        enrollee: {
          include: {
            participant: {
              include: {
                toolAccesses: {
                  where: {
                    isActive: true
                  }
                },
                role: true
              }
            }
          }
        }
      }
    });

    if (!eventAttendees || eventAttendees.length === 0) {
      return res.status(200).json({
        success: true,
        participants: [],
        message: 'No participants found for this event'
      });
    }

    // Transform the data to match EmailAccessDialog expected format
    // The dialog expects: { id, participant: { firstName, lastName, email, toolAccesses: [...] } }
    const participants = eventAttendees
      .filter(attendee => attendee.enrollee?.participant)
      .map(attendee => ({
        id: attendee.id,
        enrolleeId: attendee.enrolleeId,
        attendance_status: attendee.attendance_status,
        participant: {
          id: attendee.enrollee.participant.id,
          firstName: attendee.enrollee.participant.firstName,
          lastName: attendee.enrollee.participant.lastName,
          email: attendee.enrollee.participant.email,
          profileImg: attendee.enrollee.participant.profileImg,
          role: attendee.enrollee.participant.role,
          toolAccesses: attendee.enrollee.participant.toolAccesses || []
        }
      }));

    res.status(200).json({
      success: true,
      participants,
      count: participants.length
    });
  }
});
