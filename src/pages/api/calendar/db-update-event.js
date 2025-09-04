import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { event, eventId } = req.body;
    
    // Clean the event data to only include database fields
    const updateData = {
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      start: event.start ? new Date(event.start) : undefined,
      end: event.end ? new Date(event.end) : undefined,
      allDay: event.allDay,
      color: event.color,
      textColor: event.textColor,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      editable: event.editable,
      eventStatus: event.eventStatus,
      extendedProps: event.extendedProps,
      courseId: event.courseId || null,
      supportActivityId: event.supportActivityId || null
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Use transaction to update both event and groups
    const result = await prisma.$transaction(async (tx) => {
      // Update the event
      const updatedEvent = await tx.events.update({
        where: {
          id: parseInt(eventId), 
        },
        data: updateData,
      });

      // Handle group assignments if selectedGroups is provided
      if (event.selectedGroups !== undefined) {
        // First, delete existing group assignments
        await tx.event_groups.deleteMany({
          where: {
            eventsId: parseInt(eventId)
          }
        });

        // Then create new group assignments
        if (event.selectedGroups.length > 0) {
          const groupAssignments = event.selectedGroups
            .filter(groupId => {
              // Filter out invalid group IDs
              const parsed = parseInt(groupId);
              return !isNaN(parsed) && parsed > 0;
            })
            .map(groupId => ({
              eventsId: parseInt(eventId),
              groupId: parseInt(groupId)
            }));

          // Only create if there are valid group assignments
          if (groupAssignments.length > 0) {
            await tx.event_groups.createMany({
              data: groupAssignments
            });
          }
        }
      }

      return updatedEvent;
    });

    res.status(200).json({ 
      success: true, 
      message: "Event and group assignments updated successfully",
      updatedEvent: result
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message 
    });
  }
}
