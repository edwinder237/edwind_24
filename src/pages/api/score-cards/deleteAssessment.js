import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({ scope: 'org', DELETE: async (req, res) => {
  const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID is required'
      });
    }

    // Check if assessment exists
    const assessment = await prisma.course_assessments.findUnique({
      where: { id: parseInt(id) },
      include: {
        participant_scores: {
          select: { id: true }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if there are any participant scores
    if (assessment.participant_scores.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete assessment. ${assessment.participant_scores.length} participant score(s) exist. Consider deactivating instead.`,
        hasScores: true,
        scoreCount: assessment.participant_scores.length
      });
    }

    // Delete the assessment (will cascade to configs)
    await prisma.course_assessments.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully'
    });
}
});
