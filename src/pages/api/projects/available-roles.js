import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Get the project to find the sub_organizationId
    const project = await prisma.projects.findUnique({
      where: { id: parseInt(projectId) },
      select: { sub_organizationId: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch all active roles for the organization
    const availableRoles = await prisma.sub_organization_participant_role.findMany({
      where: {
        sub_organizationId: project.sub_organizationId,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true
      },
      orderBy: {
        title: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      roles: availableRoles
    });

  } catch (error) {
    console.error('Error fetching available roles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch available roles',
      details: error.message 
    });
  }
}