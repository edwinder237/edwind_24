/**
 * ============================================
 * DELETE /api/instructors/deleteInstructor
 * ============================================
 *
 * Deletes an instructor by ID.
 * Only deletes instructors belonging to the user's organization.
 */

import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique, scopedDelete } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
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

  } catch (error) {
    console.error('Error deleting instructor:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
