import prisma from '../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const userId = req.cookies.workos_user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user from WorkOS
    const user = await workos.userManagement.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { 
      organizationId,
      organizationName, 
      subOrganizationName, 
      description, 
      address, 
      phone, 
      email, 
      website 
    } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Update organization
    const updatedOrg = await prisma.organizations.update({
      where: { id: organizationId },
      data: {
        title: organizationName,
        description,
        info: {
          address,
          phone,
          email,
          website
        },
        lastUpdated: new Date(),
        updatedby: user.id || user.email
      }
    });

    // Update sub-organization if it exists
    if (subOrganizationName && updatedOrg) {
      await prisma.sub_organizations.updateMany({
        where: { organizationId: organizationId },
        data: {
          title: subOrganizationName,
          lastUpdated: new Date(),
          updatedby: user.id || user.email
        }
      });
    }

    // Fetch the updated organization with sub-organizations
    const organization = await prisma.organizations.findUnique({
      where: { id: organizationId },
      include: {
        sub_organizations: true
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Organization updated successfully',
      organization 
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    return res.status(500).json({ 
      error: 'Failed to update organization',
      details: error.message 
    });
  }
}