import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sub_organizationId } = req.query;

    if (!sub_organizationId) {
      return res.status(400).json({ error: 'sub_organizationId is required' });
    }

    // Fetch all events for projects belonging to the sub-organization
    const events = await prisma.events.findMany({
      where: {
        project: {
          training_recipient: {
            sub_organizationId: parseInt(sub_organizationId)
          }
        }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            training_recipient: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        event_attendees: {
          include: {
            enrollee: {
              select: {
                id: true,
                participant: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        event_groups: {
          include: {
            groups: {
              select: {
                id: true,
                groupName: true,
                chipColor: true
              }
            }
          }
        }
      },
      orderBy: {
        start: 'asc'
      }
    });

    // Transform events to FullCalendar format
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: event.backgroundColor || '#4287f5',
      borderColor: event.borderColor || event.backgroundColor || '#4287f5',
      textColor: event.textColor || '#ffffff',
      editable: event.editable !== false, // Default to true if not specified
      eventType: event.eventType,
      eventStatus: event.eventStatus,
      extendedProps: {
        ...event.extendedProps,
        project: event.project,
        course: event.course,
        attendeeCount: event.event_attendees?.length || 0,
        groupCount: event.event_groups?.length || 0,
        groups: event.event_groups?.map(eg => eg.groups) || []
      }
    }));

    res.status(200).json({
      success: true,
      events: transformedEvents,
      count: transformedEvents.length
    });

  } catch (error) {
    console.error('Error fetching events by sub-organization:', error);
    res.status(500).json({ 
      error: "Internal Server Error",
      message: "Failed to fetch events for sub-organization"
    });
  }
}