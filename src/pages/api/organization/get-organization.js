import prisma from '../../../lib/prisma';
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const { organizationId } = req.query;
    
    if (!organizationId) {
      // For now, return the first organization (you may want to adjust this logic)
      const organizations = await prisma.organizations.findMany({
        take: 1,
        include: {
          sub_organizations: true
        }
      });

      if (!organizations || organizations.length === 0) {
        return res.status(404).json({ error: 'No organization found' });
      }

      return res.status(200).json({ 
        success: true,
        organization: organizations[0]
      });
    }

    // Fetch specific organization
    const organization = await prisma.organizations.findUnique({
      where: { id: organizationId },
      include: {
        sub_organizations: true
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    return res.status(200).json({ 
      success: true,
      organization 
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch organization',
      details: error.message 
    });
  }
}