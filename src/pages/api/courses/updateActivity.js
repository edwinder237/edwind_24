import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, title, summary, activityType, duration, content, contentUrl } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Activity ID is required' });
    }

    // Check if activity exists first
    const existingActivity = await prisma.activities.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Build update data object, only including provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (activityType !== undefined) updateData.activityType = activityType;
    if (duration !== undefined) updateData.duration = parseInt(duration) || 0;
    if (content !== undefined) updateData.content = content;
    if (contentUrl !== undefined) updateData.contentUrl = contentUrl;

    // Update the activity in the database
    const updatedActivity = await prisma.activities.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      activity: updatedActivity
    });

  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update activity',
      error: error.message 
    });
  }
}