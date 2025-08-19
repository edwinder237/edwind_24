import prisma from "../../../lib/prisma";
import { connect } from "net";

export default async function handler(req, res) {
    try {

      const { newEvent, events, projectId } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }
      
      const event = {
        title: newEvent.title,
        description: newEvent.description,
        eventType: newEvent.eventType || "other",
        start: newEvent.start,
        end: newEvent.end,
        allDay: newEvent.allDay,
        color: newEvent.color,
        textColor: newEvent.textColor,
        backgroundColor: "#4285F4",
        borderColor: "#000000",
        editable: true,
        eventStatus: "Active",
        extendedProps: { location: "Conference Room A", priority: "High" },
        project: {connect: {id: parseInt(projectId)}},
        ...(newEvent.courseId && { course: {connect: {id: parseInt(newEvent.courseId)}} }),
        ...(newEvent.supportActivityId && { supportActivity: {connect: {id: parseInt(newEvent.supportActivityId)}} })
      };
       await prisma.events.create({
        data: event,

      });
      
  
      res.status(200).json(`${newEvent.title} Event created and saved to database`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  
  
  
  
  
  
