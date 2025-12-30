import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      id,
      title,
      description,
      maxScore,
      passingScore,
      isActive,
      assessmentOrder,
      allowRetakes,
      maxAttempts,
      scoreStrategy,
      updatedBy = 'system' // Should get from session/auth
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required'
      });
    }

    // Check if assessment exists
    const existingAssessment = await prisma.course_assessments.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAssessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Validate passing score if provided
    const finalMaxScore = maxScore !== undefined ? parseFloat(maxScore) : existingAssessment.maxScore;
    const finalPassingScore = passingScore !== undefined ? parseFloat(passingScore) : existingAssessment.passingScore;

    if (finalPassingScore > finalMaxScore) {
      return res.status(400).json({
        success: false,
        message: 'Passing score cannot be greater than max score'
      });
    }

    // Validate scoreStrategy if provided
    if (scoreStrategy) {
      const validStrategies = ['latest', 'highest', 'average', 'first'];
      if (!validStrategies.includes(scoreStrategy)) {
        return res.status(400).json({
          success: false,
          message: `Invalid score strategy. Must be one of: ${validStrategies.join(', ')}`
        });
      }
    }

    // Build update data object
    const updateData = { updatedBy };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (maxScore !== undefined) updateData.maxScore = parseFloat(maxScore);
    if (passingScore !== undefined) updateData.passingScore = parseFloat(passingScore);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (assessmentOrder !== undefined) updateData.assessmentOrder = assessmentOrder ? parseInt(assessmentOrder) : null;
    if (allowRetakes !== undefined) updateData.allowRetakes = allowRetakes;
    if (maxAttempts !== undefined) updateData.maxAttempts = maxAttempts ? parseInt(maxAttempts) : null;
    if (scoreStrategy !== undefined) updateData.scoreStrategy = scoreStrategy;

    // Update the assessment
    const updatedAssessment = await prisma.course_assessments.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            cuid: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      assessment: updatedAssessment
    });

  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assessment',
      error: error.message
    });
  }
}
