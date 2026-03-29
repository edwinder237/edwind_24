import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

export default createHandler({
  scope: 'admin',
  POST: async (req, res) => {
    const { organizationId: currentOrgId, userId: workosUserId } = req.orgContext;

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
        updatedby: workosUserId
      }
    });

    // Update sub-organization if it exists
    if (subOrganizationName && updatedOrg) {
      await prisma.sub_organizations.updateMany({
        where: { organizationId: organizationId },
        data: {
          title: subOrganizationName,
          lastUpdated: new Date(),
          updatedby: workosUserId
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
  }
});
