import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { event, eventId } = req.body;
    
    // Clean the event data to only include database fields
    // Note: 'location' is stored in extendedProps since it's not a direct DB column
    const extendedProps = {
      ...(event.extendedProps || {}),
      ...(event.location !== undefined && { location: event.location })
    };

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
      extendedProps: Object.keys(extendedProps).length > 0 ? extendedProps : undefined,
      timezone: event.timezone,
      // Only include courseId/supportActivityId/roomId if explicitly provided in the update
      // This prevents accidentally unlinking courses/rooms when updating other fields
      ...(event.courseId !== undefined && { courseId: event.courseId }),
      ...(event.supportActivityId !== undefined && { supportActivityId: event.supportActivityId }),
      ...(event.roomId !== undefined && { roomId: event.roomId })
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

      // Handle instructor assignment if instructor is provided
      if (event.instructor !== undefined) {
        const instructorId = event.instructor?.id ? parseInt(event.instructor.id) : null;

        // Delete existing instructor assignments for this event
        await tx.event_instructors.deleteMany({
          where: {
            eventId: parseInt(eventId)
          }
        });

        // Create new instructor assignment if an instructor is selected
        if (instructorId) {
          await tx.event_instructors.create({
            data: {
              eventId: parseInt(eventId),
              instructorId: instructorId,
              role: 'lead' // First/only instructor is considered lead
            }
          });
        }
      }

      // Handle group assignments if selectedGroups is provided
      if (event.selectedGroups !== undefined) {
        // Get current group assignments before deleting them
        const currentGroupAssignments = await tx.event_groups.findMany({
          where: {
            eventsId: parseInt(eventId)
          },
          select: {
            groupId: true
          }
        });

        const currentGroupIds = currentGroupAssignments.map(eg => eg.groupId);
        const newGroupIds = event.selectedGroups.map(id => parseInt(id)).filter(id => !isNaN(id));
        
        // Find which groups are being removed
        const groupsToRemove = currentGroupIds.filter(currentId => !newGroupIds.includes(currentId));
        
        // Find which groups are being added
        const groupsToAdd = newGroupIds.filter(newId => !currentGroupIds.includes(newId));

        // Remove attendees from groups that are being removed
        if (groupsToRemove.length > 0) {
          for (const removedGroupId of groupsToRemove) {
            // Get participants from the group being removed
            const groupParticipants = await tx.group_participants.findMany({
              where: {
                groupId: removedGroupId
              },
              select: {
                participantId: true
              }
            });

            if (groupParticipants.length > 0) {
              const participantIds = groupParticipants.map(gp => gp.participantId);
              
              // Remove attendees that match the participants from this group
              await tx.event_attendees.deleteMany({
                where: {
                  eventsId: parseInt(eventId),
                  enrolleeId: {
                    in: participantIds
                  }
                }
              });
            }
          }
        }

        // Update group assignments
        await tx.event_groups.deleteMany({
          where: {
            eventsId: parseInt(eventId)
          }
        });

        // Create new group assignments
        if (newGroupIds.length > 0) {
          const groupAssignments = newGroupIds.map(groupId => ({
            eventsId: parseInt(eventId),
            groupId: groupId
          }));

          await tx.event_groups.createMany({
            data: groupAssignments
          });

          // Add attendees from newly assigned groups
          for (const groupId of groupsToAdd) {
            // Get all participants from this group
            const groupParticipants = await tx.group_participants.findMany({
              where: {
                groupId: groupId
              },
              select: {
                participantId: true
              }
            });

            // Create event attendees for each group participant
            if (groupParticipants.length > 0) {
              const attendeeData = groupParticipants.map(gp => ({
                eventsId: parseInt(eventId),
                enrolleeId: gp.participantId,
                attendance_status: "scheduled",
                createdBy: updatedEvent.updatedby || updatedEvent.createdBy,
                updatedby: updatedEvent.updatedby || updatedEvent.createdBy
              }));

              // Use upsert to avoid duplicate attendees
              for (const attendee of attendeeData) {
                await tx.event_attendees.upsert({
                  where: {
                    eventsId_enrolleeId: {
                      eventsId: attendee.eventsId,
                      enrolleeId: attendee.enrolleeId
                    }
                  },
                  update: {
                    attendance_status: attendee.attendance_status,
                    updatedby: attendee.updatedby,
                    lastUpdated: new Date()
                  },
                  create: attendee
                });
              }
            }
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
