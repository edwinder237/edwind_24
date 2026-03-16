import { withOrgScope } from '../../../lib/middleware/withOrgScope';
import prisma from '../../../lib/prisma';

export default withOrgScope(async (req, res) => {
  const { orgContext } = req;
  const { id } = req.query;
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

  // GET - Return single tool
  if (req.method === 'GET') {
    return res.json(tool);
  }

  // PUT - Update tool
  if (req.method === 'PUT') {
    try {
      const { name, toolType, toolUrl, toolDescription, icon } = req.body;

      if (name !== undefined && !name?.trim()) {
        return res.status(400).json({ error: 'Tool name cannot be empty' });
      }

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
  }

  // DELETE - Soft delete
  if (req.method === 'DELETE') {
    try {
      await prisma.organization_tools.update({
        where: { id: toolId },
        data: {
          isActive: false,
          updatedBy: orgContext.userId
        }
      });
      return res.json({ message: 'Tool deleted successfully' });
    } catch (error) {
      console.error('Error deleting organization tool:', error);
      return res.status(500).json({ error: 'Failed to delete organization tool' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
