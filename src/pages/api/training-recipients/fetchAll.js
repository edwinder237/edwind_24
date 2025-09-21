import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const trainingRecipients = await prisma.training_recipients.findMany({
      include: {
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        },
        projects: {
          select: {
            id: true,
            title: true
          }
        },
        participants: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add computed fields and parse location JSON
    const enrichedRecipients = trainingRecipients.map(recipient => {
      let parsedLocation = null;
      if (recipient.location) {
        try {
          parsedLocation = typeof recipient.location === 'string' 
            ? JSON.parse(recipient.location) 
            : recipient.location;
        } catch (error) {
          console.error(`Error parsing location JSON for recipient ${recipient.id}:`, error);
        }
      }

      return {
        ...recipient,
        location: parsedLocation,
        projectCount: recipient.projects.length,
        participantCount: recipient.participants.length
      };
    });

    res.status(200).json(enrichedRecipients);
  } catch (error) {
    console.error('Error fetching all training recipients:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}