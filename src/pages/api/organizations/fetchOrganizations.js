import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const organizations = await prisma.organizations.findMany({
      where: {
        published: true,
        status: 'active'
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        info: true,
        logo_url: true
      },
      orderBy: {
        title: 'asc'
      }
    });

    res.status(200).json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}