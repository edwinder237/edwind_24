import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sub_organizationId, instructorType, status } = req.query;

    const whereClause = {};
    
    if (sub_organizationId) {
      whereClause.sub_organizationId = parseInt(sub_organizationId);
    }
    
    if (instructorType) {
      whereClause.instructorType = instructorType;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const instructors = await prisma.instructors.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        bio: true,
        expertise: true,
        instructorType: true,
        status: true,
        profileImage: true,
        qualifications: true,
        hourlyRate: true,
        availability: true,
        sub_organizationId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    res.status(200).json(instructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch instructors',
      error: error.message 
    });
  }
}