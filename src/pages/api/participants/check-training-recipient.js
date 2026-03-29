import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
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
  }
});
