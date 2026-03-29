import { createHandler } from '../../../../lib/api/createHandler';
import prisma from '../../../../lib/prisma';

export default createHandler({
  scope: 'admin',
  GET: async (req, res) => {
    const permissions = await prisma.permissions.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { resource: 'asc' }, { name: 'asc' }]
    });

    const byCategory = {};
    for (const perm of permissions) {
      if (!byCategory[perm.category]) {
        byCategory[perm.category] = [];
      }
      byCategory[perm.category].push({
        id: perm.id,
        key: perm.key,
        name: perm.name,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope
      });
    }

    const categoryLabels = {
      projects: 'Projects',
      courses: 'Courses & Curriculums',
      events: 'Events & Schedule',
      participants: 'Participants',
      assessments: 'Assessments',
      timeline: 'Timeline',
      kirkpatrick: 'Kirkpatrick Evaluations',
      reports: 'Reports & Certificates',
      resources: 'Resources',
      user_management: 'User Management',
      settings: 'Settings'
    };

    return res.status(200).json({
      permissions,
      byCategory,
      categoryLabels,
      total: permissions.length
    });
  }
});
