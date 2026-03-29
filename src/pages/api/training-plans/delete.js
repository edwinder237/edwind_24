import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  DELETE: async (req, res) => {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Training plan ID is required' });
    }

    try {
      // Delete training plan (cascades to days and modules due to onDelete: Cascade)
      await prisma.training_plans.delete({
        where: {
          id: parseInt(id)
        }
      });

      res.status(200).json({
        success: true,
        message: 'Training plan deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting training plan:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Training plan not found'
        });
      }

      throw error;
    }
  }
});