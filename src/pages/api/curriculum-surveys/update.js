import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  PUT: async (req, res) => {
    const {
      id,
      title,
      description,
      surveyType,
      provider,
      providerConfig,
      isRequired,
      triggerCourseId,
      customTriggerDays,
      status,
      displayOrder,
      updatedBy
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Survey ID is required'
      });
    }

    // Check if survey exists
    const existingSurvey = await prisma.curriculum_surveys.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSurvey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Build update data object with only provided fields
    const updateData = {
      updatedBy: updatedBy || null
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (surveyType !== undefined) updateData.surveyType = surveyType;
    if (provider !== undefined) updateData.provider = provider;
    if (providerConfig !== undefined) updateData.providerConfig = providerConfig;
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (triggerCourseId !== undefined) updateData.triggerCourseId = triggerCourseId ? parseInt(triggerCourseId) : null;
    if (customTriggerDays !== undefined) updateData.customTriggerDays = customTriggerDays ? parseInt(customTriggerDays) : null;
    if (status !== undefined) updateData.status = status;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);

    const survey = await prisma.curriculum_surveys.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        triggerCourse: {
          select: { id: true, title: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Survey updated successfully',
      survey
    });
  }
});
