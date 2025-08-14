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

    // Add computed fields
    const enrichedRecipients = trainingRecipients.map(recipient => ({
      ...recipient,
      projectCount: recipient.projects.length,
      participantCount: recipient.participants.length
    }));

    res.status(200).json(enrichedRecipients);
  } catch (error) {
    console.error('Error fetching all training recipients:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}