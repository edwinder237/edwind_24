import { PrismaClient } from "@prisma/client";
import { connect } from "net";



const prisma = new PrismaClient();

export default async function handler(req, res) {
    try {

      const { newEvent,events } = req.body;
      
      //const id = events[0].projectId;
      
     // delete newEvent.id;
     console.log(newEvent)
      const event = {
        title: newEvent.title,
        description: newEvent.description,
        eventType: "other",
       // projectId: 3, 
       // courseId: 1, 
        start: newEvent.start, // Replace with the actual start date and time
        end: newEvent.end, // Replace with the actual end date and time
        allDay: newEvent.allDay, // Replace with the actual value
        color: newEvent.color, // Replace with the actual color value
        textColor: newEvent.textColor, // Replace with the actual text color value
        backgroundColor: "#4285F4", // Replace with the actual background color value
        borderColor: "#000000", // Replace with the actual border color value
        editable: true, // Replace with the actual value
        eventStatus: "Active", // Replace with the actual status
        extendedProps: { location: "Conference Room A", priority: "High" }, // Replace with the actual extendedProps
        project: {connect: {id:3}},
        //course: {connect:{id:1}}
      };
      console.log(event)
       await prisma.events.create({
        data: event,

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

  
  
  
  
  
  
