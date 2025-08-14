import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Title is required' 
      });
    }

    const curriculum = await prisma.curriculums.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Curriculum created successfully',
      curriculum
    });

  } catch (error) {
    console.error('Error creating curriculum:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create curriculum',
      error: error.message 
    });
  }
}