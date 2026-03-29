import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { orgContext } = req;

    const tools = await prisma.organization_tools.findMany({
      where: {
        sub_organizationId: { in: orgContext.subOrganizationIds },
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    return res.json(tools);
  },
  POST: async (req, res) => {
    const { orgContext } = req;
    const { name, toolType, toolUrl, toolDescription, icon, sub_organizationId } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    // Use provided sub_organizationId or fall back to first available
    const targetSubOrgId = sub_organizationId || orgContext.subOrganizationIds[0];

    if (!orgContext.subOrganizationIds.includes(targetSubOrgId)) {
      return res.status(403).json({ error: 'Invalid sub-organization' });
    }

    try {
      const tool = await prisma.organization_tools.create({
        data: {
          name: name.trim(),
          toolType: toolType || null,
          toolUrl: toolUrl || null,
          toolDescription: toolDescription || null,
          icon: icon || null,
          sub_organizationId: targetSubOrgId,
          createdBy: orgContext.userId
        }
      });
      return res.status(201).json(tool);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'A tool with this name already exists in this organization' });
      }
      console.error('Error creating organization tool:', error);
      return res.status(500).json({ error: 'Failed to create organization tool' });
    }
  }
});
