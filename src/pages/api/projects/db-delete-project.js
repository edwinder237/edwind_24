import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { NotFoundError, ValidationError, AdminRequiredError } from '../../../lib/errors/index.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';

export default createHandler({
  POST: async (req, res) => {
    // Only admins can permanently delete projects
    if (!req.orgContext.isAdmin) {
      throw new AdminRequiredError('Only administrators can permanently delete projects');
    }

    const { projectCUID } = req.body;

    if (!projectCUID) {
      throw new ValidationError('Project ID is required');
    }

    // Verify the project belongs to the user's organization
    const project = await scopedFindUnique(req.orgContext, 'projects', {
      where: { id: projectCUID }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Soft delete: mark project and child records as deleted (data retained for audit)
    const now = new Date();
    const deletedBy = req.orgContext.userId;

    await prisma.$transaction(async (tx) => {
      // Soft-delete child events
      await tx.events.updateMany({
        where: { projectId: projectCUID, deletedAt: null },
        data: { deletedAt: now, deletedBy },
      });

      // Mark project as deleted
      await tx.projects.update({
        where: { id: projectCUID },
        data: { deletedAt: now, deletedBy, projectStatus: 'deleted' },
      });
    });

    res.status(200).json({ success: true, message: 'Project archived successfully' });
  }
});
