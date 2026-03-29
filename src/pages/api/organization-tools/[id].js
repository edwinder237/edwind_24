import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { orgContext, query } = req;
    const { id } = query;
    const toolId = parseInt(id, 10);

    if (isNaN(toolId)) {
      return res.status(400).json({ error: 'Invalid tool ID' });
    }

    // Verify tool belongs to user's sub-organizations
    const tool = await prisma.organization_tools.findFirst({
      where: {
        id: toolId,
        sub_organizationId: { in: orgContext.subOrganizationIds }
      }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    return res.json(tool);
  },
  PUT: async (req, res) => {
    const { orgContext, query } = req;
    const { id } = query;
    const toolId = parseInt(id, 10);

    if (isNaN(toolId)) {
      return res.status(400).json({ error: 'Invalid tool ID' });
    }

    // Verify tool belongs to user's sub-organizations
    const tool = await prisma.organization_tools.findFirst({
      where: {
        id: toolId,
        sub_organizationId: { in: orgContext.subOrganizationIds }
      }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    const { name, toolType, toolUrl, toolDescription, icon } = req.body;

    if (name !== undefined && !name?.trim()) {
      return res.status(400).json({ error: 'Tool name cannot be empty' });
    }

    try {
      const updated = await prisma.organization_tools.update({
        where: { id: toolId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(toolType !== undefined && { toolType: toolType || null }),
          ...(toolUrl !== undefined && { toolUrl: toolUrl || null }),
          ...(toolDescription !== undefined && { toolDescription: toolDescription || null }),
          ...(icon !== undefined && { icon: icon || null }),
          updatedBy: orgContext.userId
        }
      });
      return res.json(updated);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'A tool with this name already exists in this organization' });
      }
      console.error('Error updating organization tool:', error);
      return res.status(500).json({ error: 'Failed to update organization tool' });
    }
  },
  DELETE: async (req, res) => {
    const { orgContext, query } = req;
    const { id } = query;
    const toolId = parseInt(id, 10);

    if (isNaN(toolId)) {
      return res.status(400).json({ error: 'Invalid tool ID' });
    }

    // Verify tool belongs to user's sub-organizations
    const tool = await prisma.organization_tools.findFirst({
      where: {
        id: toolId,
        sub_organizationId: { in: orgContext.subOrganizationIds }
      }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    await prisma.organization_tools.update({
      where: { id: toolId },
      data: {
        isActive: false,
        updatedBy: orgContext.userId
      }
    });
    return res.json({ message: 'Tool deleted successfully' });
  }
});
