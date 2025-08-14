import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      title,
      summary,
      content,
      contentUrl,
      duration,
      activityType = 'exercise',
      activityCategory = 'practice',
      activityStatus = 'draft',
      moduleId,
      ActivityOrder = 1
    } = req.body;

    if (!title || !moduleId) {
      return res.status(400).json({ 
        success: false,
        message: 'Activity title and module ID are required' 
      });
    }

    // Create the activity
    const activity = await prisma.activities.create({
      data: {
        title,
        summary: summary || null,
        content: content || null,
        contentUrl: contentUrl || '',
        duration: duration ? parseInt(duration) : null,
        activityType,
        activityCategory,
        activityStatus,
        moduleId: parseInt(moduleId),
        ActivityOrder: ActivityOrder ? parseInt(ActivityOrder) : 1,
        published: false,
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      activity
    });

  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create activity',
      error: error.message 
    });
  }
}