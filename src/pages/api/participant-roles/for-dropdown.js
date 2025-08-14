import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    // Note: For now, we'll fetch all active participant roles. In a real app, you'd filter by sub_organizationId
    // based on the authenticated user's organization
    
    // Fetch active participant roles for dropdown
    const participantRoles = await prisma.sub_organization_participant_role.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true
      },
      orderBy: {
        title: 'asc'
      }
    });

    res.status(200).json(participantRoles);
  } catch (error) {
    console.error('Error fetching participant roles for dropdown:', error);
    res.status(500).json({ error: 'Failed to fetch participant roles' });
  } finally {
    await prisma.$disconnect();
  }
}