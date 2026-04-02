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

    // Use a transaction to delete all related records and then the project
    await prisma.$transaction(async (tx) => {
      await tx.group_participants.deleteMany({
        where: { group: { projectId: projectCUID } }
      });

      await tx.event_groups.deleteMany({
        where: { event: { projectId: projectCUID } }
      });

      await tx.event_attendees.deleteMany({
        where: { event: { projectId: projectCUID } }
      });

      await tx.groups.deleteMany({
        where: { projectId: projectCUID }
      });

      await tx.courses_enrollee_progress.deleteMany({
        where: { enrollee: { projectId: projectCUID } }
      });

      await tx.project_participants.deleteMany({
        where: { projectId: projectCUID }
      });

      await tx.project_curriculums.deleteMany({
        where: { projectId: projectCUID }
      });

      await tx.events.deleteMany({
        where: { projectId: projectCUID }
      });

      await tx.daily_focus.deleteMany({
        where: { projectId: projectCUID }
      });

      await tx.projects.delete({
        where: { id: projectCUID },
      });
    });

    res.status(200).json({ success: true, message: 'Project and all related data removed from database' });
  }
});
