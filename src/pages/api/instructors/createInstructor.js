import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      bio,
      expertise,
      instructorType = 'main',
      status = 'active',
      profileImage,
      qualifications,
      hourlyRate,
      availability,
      sub_organizationId,
      createdBy
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !sub_organizationId || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, sub-organization ID, and created by are required'
      });
    }

    // Check if instructor with email already exists
    const existingInstructor = await prisma.instructors.findUnique({
      where: { email }
    });

    if (existingInstructor) {
      return res.status(400).json({
        success: false,
        message: 'An instructor with this email already exists'
      });
    }

    const instructor = await prisma.instructors.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        bio,
        expertise: expertise || [],
        instructorType,
        status,
        profileImage,
        qualifications,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        availability,
        sub_organizationId: parseInt(sub_organizationId),
        createdBy,
        updatedBy: createdBy
      },
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
      }
    });

    res.status(201).json({
      success: true,
      message: 'Instructor created successfully',
      data: instructor,
      instructor: instructor // Keep both for backward compatibility
    });

  } catch (error) {
    console.error('Error creating instructor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create instructor',
      error: error.message
    });
  }
}