import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { eventId, instructorId, role = 'main' } = req.body;

    if (!eventId || !instructorId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and Instructor ID are required'
      });
    }

    // Check if event exists
    const event = await prisma.events.findUnique({
      where: { id: parseInt(eventId) }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if instructor exists
    const instructor = await prisma.instructors.findUnique({
      where: { id: parseInt(instructorId) }
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    // Check if instructor is already assigned to this event
    const existingAssignment = await prisma.event_instructors.findUnique({
      where: {
        eventId_instructorId: {
          eventId: parseInt(eventId),
          instructorId: parseInt(instructorId)
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Instructor is already assigned to this event'
      });
    }

    // Create the assignment
    const assignment = await prisma.event_instructors.create({
      data: {
        eventId: parseInt(eventId),
        instructorId: parseInt(instructorId),
        role
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            instructorType: true,
            expertise: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            start: true,
            end: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Instructor assigned to event successfully',
      data: assignment
    });

  } catch (error) {
    console.error('Error assigning instructor to event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign instructor to event',
      error: error.message
    });
  }
}