import { createHandler } from '../../../../lib/api/createHandler';
import prisma from '../../../../lib/prisma';

export default createHandler({
  scope: 'admin',
  GET: async (req, res) => {
    const roles = await prisma.system_roles.findMany({
      where: { isActive: true },
      orderBy: { hierarchyLevel: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        hierarchyLevel: true,
        _count: {
          select: {
            role_permissions: true
          }
        }
      }
    });

    const formattedRoles = roles.map(role => ({
      id: role.id,
      slug: role.slug,
      name: role.name,
      description: role.description,
      hierarchyLevel: role.hierarchyLevel,
      permissionCount: role._count.role_permissions
    }));

    return res.status(200).json({ roles: formattedRoles });
  }
});
