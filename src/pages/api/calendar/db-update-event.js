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

    await prisma.events.update({
      where: {
        id: parseInt(eventId), 
      },
      data: updateData,
    });

    res.status(200).json({ 
      success: true, 
      message: "Event updated and saved to database",
      updatedEvent: updateData
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message 
    });
  }
}
