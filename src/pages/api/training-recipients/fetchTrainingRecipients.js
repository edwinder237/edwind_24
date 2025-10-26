import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sub_organizationId } = req.query;

    if (!sub_organizationId) {
      return res.status(400).json({ error: 'sub_organizationId is required' });
    }

    const trainingRecipients = await prisma.training_recipients.findMany({
      where: {
        sub_organizationId: parseInt(sub_organizationId),
        status: 'active' // Only fetch active recipients
      },
      include: {
        _count: {
          select: {
            projects: true,
            participants: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.status(200).json(trainingRecipients);
  } catch (error) {
    console.error('Error fetching training recipients:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}