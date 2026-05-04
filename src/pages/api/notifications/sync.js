import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

export default createHandler({
  POST: async (req, res) => {
    const now = new Date();

    // Find non-completed projects with their settings (org-scoped via req.db)
    const projects = await req.db.projects.findMany({
      where: {
        projectStatus: { notIn: ['completed', 'archived', 'cancelled'] },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        endDate: true,
        sub_organizationId: true,
        project_settings: {
          select: { endDate: true },
        },
      },
    });

    // Filter to overdue: check project_settings.endDate first, fallback to project.endDate
    const overdueProjects = projects.filter((p) => {
      const endDate = p.project_settings?.endDate || p.endDate;
      return endDate && new Date(endDate) < now;
    });

    if (overdueProjects.length === 0) {
      return res.status(200).json({ created: 0 });
    }

    // Build notification records with dedupeKeys
    const notifications = overdueProjects.map((p) => {
      const endDate = p.project_settings?.endDate || p.endDate;
      const daysOverdue = Math.floor((now - new Date(endDate)) / 86400000);
      return {
        type: 'PROJECT_OVERDUE',
        title: 'Project Overdue',
        message: `"${p.title}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} past its end date and not yet completed.`,
        referenceId: String(p.id),
        referenceType: 'project',
        sub_organizationId: p.sub_organizationId,
        dedupeKey: `PROJECT_OVERDUE:${p.id}`,
      };
    });

    // Bulk insert, skipping duplicates (idempotent)
    const result = await prisma.notifications.createMany({
      data: notifications,
      skipDuplicates: true,
    });

    return res.status(200).json({ created: result.count });
  },
});
