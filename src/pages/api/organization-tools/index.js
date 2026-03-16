import { withOrgScope } from '../../../lib/middleware/withOrgScope';
import prisma from '../../../lib/prisma';

export default withOrgScope(async (req, res) => {
  const { orgContext } = req;

  // GET - List all active organization tools for user's sub-organizations
  if (req.method === 'GET') {
    try {
      const tools = await prisma.organization_tools.findMany({
        where: {
          sub_organizationId: { in: orgContext.subOrganizationIds },
          isActive: true
        },
        orderBy: { name: 'asc' }
      });
      return res.json(tools);
    } catch (error) {
      console.error('Error fetching organization tools:', error);
      return res.status(500).json({ error: 'Failed to fetch organization tools' });
    }
  }

  // POST - Create a new organization tool template
  if (req.method === 'POST') {
    try {
      const { name, toolType, toolUrl, toolDescription, icon, sub_organizationId } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: 'Tool name is required' });
      }

      // Use provided sub_organizationId or fall back to first available
      const targetSubOrgId = sub_organizationId || orgContext.subOrganizationIds[0];

      if (!orgContext.subOrganizationIds.includes(targetSubOrgId)) {
        return res.status(403).json({ error: 'Invalid sub-organization' });
      }

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

  return res.status(405).json({ error: 'Method not allowed' });
});
