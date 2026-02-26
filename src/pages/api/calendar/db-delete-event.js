import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    try {
      // Convert eventId to integer if it's a string
      const id = parseInt(eventId);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      await prisma.events.delete({
        where: {
          id: id
        }
      });
      
      res.status(200).json({ message: "Event deleted and removed from database", success: true });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    } finally {
    }
  }

  
  
  
  
  
  
