import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      id,
      firstName,
      lastName,
      email,
      phone,
      bio,
      expertise,
      instructorType,
      status,
      profileImage,
      qualifications,
      hourlyRate,
      availability,
      updatedBy
    } = req.body;

    if (!id || !updatedBy) {
      return res.status(400).json({
        success: false,
        message: 'Instructor ID and updated by are required'
      });
    }

    // Check if instructor exists
    const existingInstructor = await prisma.instructors.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingInstructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    // If email is being updated, check if it's already taken by another instructor
    if (email && email !== existingInstructor.email) {
      const emailExists = await prisma.instructors.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'An instructor with this email already exists'
        });
      }
    }

    const updateData = {
      updatedBy,
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (instructorType !== undefined) updateData.instructorType = instructorType;
    if (status !== undefined) updateData.status = status;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (qualifications !== undefined) updateData.qualifications = qualifications;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;
    if (availability !== undefined) updateData.availability = availability;

    const instructor = await prisma.instructors.update({
      where: { id: parseInt(id) },
      data: updateData,
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

    res.status(200).json({
      success: true,
      message: 'Instructor updated successfully',
      data: instructor
    });

  } catch (error) {
    console.error('Error updating instructor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update instructor',
      error: error.message
    });
  }
}