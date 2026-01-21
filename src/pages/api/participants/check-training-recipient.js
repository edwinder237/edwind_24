import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    const { orgContext } = req;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!orgContext || !orgContext.subOrganizationIds?.length) {
      return res.status(403).json({ message: 'Organization context required' });
    }

    // Check if participant with this email exists WITHIN the user's accessible sub-organizations
    const participant = await prisma.participants.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        sub_organization: {
          in: orgContext.subOrganizationIds
        }
      },
      include: {
        training_recipient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      participant
    });

  } catch (error) {
    console.error('Error checking participant training recipient:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check participant',
      error: error.message
    });
  }
}

export default withOrgScope(handler);
