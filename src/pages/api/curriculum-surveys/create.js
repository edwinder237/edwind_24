import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      curriculumId,
      title,
      description,
      surveyType = 'post_training',
      provider,
      providerConfig,
      isRequired = true,
      triggerCourseId,
      customTriggerDays,
      createdBy
    } = req.body;

    // Validation
    if (!curriculumId || !title || !provider || !providerConfig) {
      return res.status(400).json({
        success: false,
        message: 'Curriculum ID, title, provider, and providerConfig are required'
      });
    }

    // Validate providerConfig has formUrl
    if (!providerConfig.formUrl) {
      return res.status(400).json({
        success: false,
        message: 'Provider configuration must include formUrl'
      });
    }

    // Get next display order
    const maxOrderSurvey = await prisma.curriculum_surveys.findFirst({
      where: { curriculumId: parseInt(curriculumId) },
      orderBy: { displayOrder: 'desc' }
    });
    const displayOrder = (maxOrderSurvey?.displayOrder || 0) + 1;

    const survey = await prisma.curriculum_surveys.create({
      data: {
        curriculumId: parseInt(curriculumId),
        title: title.trim(),
        description: description?.trim() || null,
        surveyType,
        provider,
        providerConfig,
        isRequired,
        triggerCourseId: triggerCourseId ? parseInt(triggerCourseId) : null,
        customTriggerDays: customTriggerDays ? parseInt(customTriggerDays) : null,
        displayOrder,
        createdBy: createdBy || 'system'
      },
      include: {
        triggerCourse: {
          select: { id: true, title: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Survey created successfully',
      survey
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create survey',
      error: error.message
    });
  }
}
