import { PrismaClient } from "@prisma/client";



const prisma = new PrismaClient();

export default async function handler(req, res) {
    try {

      const { newEvent,events } = req.body;

      const id = events[0].projectId;


      delete newEvent.id;
      const event = {
        title: newEvent.title,
        description: newEvent.description,
        eventType: "course",
        projectId: id, // Replace with the actual project ID
        courseId: 1, // Replace with the actual course ID
        start: newEvent.start, // Replace with the actual start date and time
        end: newEvent.end, // Replace with the actual end date and time
        allDay: newEvent.allDay, // Replace with the actual value
        color: newEvent.color, // Replace with the actual color value
        textColor: newEvent.textColor, // Replace with the actual text color value
        backgroundColor: "#4285F4", // Replace with the actual background color value
        borderColor: "#000000", // Replace with the actual border color value
        editable: true, // Replace with the actual value
        eventStatus: "Active", // Replace with the actual status
        extendedProps: { location: "Conference Room A", priority: "High" } // Replace with the actual extendedProps
      };
       await prisma.events.create({
        data: event
      });
      
  
      res.status(200).json(`${newEvent.title} Event created and saved to database`);
      console.log(`${newEvent.title} Event created and saved to database`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await prisma.$disconnect();
    }
  }

  
  
  
  
  
  
