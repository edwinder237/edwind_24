import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const trainingRecipients = await prisma.training_recipients.findMany({
      // Removed status filter - fetch all recipients (active and archived)
      // Frontend will handle filtering based on user preference
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
        project_participants: {
          where: {
            status: 'active' // Only count active enrollments
          },
          select: {
            id: true,
            participantId: true
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

      // Count unique participants from active enrollments
      const uniqueParticipants = new Set(
        recipient.project_participants.map(pp => pp.participantId)
      );

      return {
        ...recipient,
        location: parsedLocation,
        projectCount: recipient.projects.length,
        participantCount: uniqueParticipants.size, // Count unique participants
        _count: {
          projects: recipient.projects.length,
          participants: uniqueParticipants.size
        }
      };
    });

    res.status(200).json(enrichedRecipients);
  } catch (error) {
    console.error('Error fetching all training recipients:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}