import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handlePost(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req, res) {
  try {
    // Note: For now, we'll fetch all participant roles. In a real app, you'd filter by sub_organizationId
    // based on the authenticated user's organization
    
    // Fetch all participant roles
    const participantRoles = await prisma.sub_organization_participant_role.findMany({
      include: {
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        }
      },
      where: {
        isActive: true
      },
      orderBy: {
        title: 'asc'
      }
    });

    // Transform data for response
    const rolesWithDetails = participantRoles.map(role => ({
      id: role.id,
      title: role.title,
      description: role.description,
      isActive: role.isActive,
      organization: role.sub_organization.title,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      createdBy: role.createdBy,
      updatedBy: role.updatedBy
    }));

    res.status(200).json(rolesWithDetails);
  } catch (error) {
    console.error('Error fetching participant roles:', error);
    res.status(500).json({ error: 'Failed to fetch participant roles' });
  }
}

async function handlePost(req, res) {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Role title is required' });
    }

    // For now, we'll use a default sub_organizationId. In a real app, 
    // you'd get this from the authenticated user's session
    const defaultSubOrgId = 1; // You should replace this with actual user's organization
    const defaultCreatedBy = 'system'; // You should replace this with actual user ID

    // Check if role already exists in this organization
    const existingRole = await prisma.sub_organization_participant_role.findFirst({
      where: {
        title: title.trim(),
        sub_organizationId: defaultSubOrgId,
        isActive: true
      }
    });

    if (existingRole) {
      return res.status(409).json({ error: 'Role with this title already exists in your organization' });
    }

    // Create new participant role
    const newRole = await prisma.sub_organization_participant_role.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        sub_organizationId: defaultSubOrgId,
        createdBy: defaultCreatedBy
      },
      include: {
        sub_organization: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.status(201).json({
      id: newRole.id,
      title: newRole.title,
      description: newRole.description,
      isActive: newRole.isActive,
      organization: newRole.sub_organization.title,
      createdAt: newRole.createdAt,
      updatedAt: newRole.updatedAt,
      createdBy: newRole.createdBy,
      updatedBy: newRole.updatedBy
    });
  } catch (error) {
    console.error('Error creating participant role:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('unique_role_per_organization')) {
      return res.status(409).json({ error: 'Role with this title already exists in your organization' });
    }
    
    res.status(500).json({ error: 'Failed to create participant role' });
  }
}