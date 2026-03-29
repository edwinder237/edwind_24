/**
 * ============================================
 * DELETE /api/instructors/deleteInstructor
 * ============================================
 *
 * Deletes an instructor by ID.
 * Only deletes instructors belonging to the user's organization.
 */

import { createHandler } from '../../../lib/api/createHandler';
import { scopedFindUnique, scopedDelete } from '../../../lib/prisma/scopedQueries.js';
import { ValidationError, NotFoundError } from '../../../lib/errors/index.js';

export default createHandler({
  scope: 'org',
  DELETE: async (req, res) => {
    const { orgContext } = req;
    const { id } = req.query;

    if (!id) {
      throw new ValidationError('Instructor ID is required');
    }

    // Verify instructor exists and belongs to user's organization
    const existingInstructor = await scopedFindUnique(orgContext, 'instructors', {
      where: { id: parseInt(id) }
    });

    if (!existingInstructor) {
      throw new NotFoundError('Instructor not found');
    }

    // Delete the instructor
    await scopedDelete(orgContext, 'instructors', {
      id: parseInt(id)
    });

    res.status(200).json({
      success: true,
      message: 'Instructor deleted successfully'
    });
  }
});
