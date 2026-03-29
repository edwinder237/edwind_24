/**
 * ============================================
 * POST /api/participant-roles/ensure-default
 * ============================================
 *
 * Ensures a default participant role exists for the current organization.
 * If no active role exists, creates one titled "Learner".
 *
 * Response:
 * {
 *   success: true,
 *   role: {...},
 *   created: boolean
 * }
 */

import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { orgContext } = req;
    const subOrgId = orgContext.subOrganizationIds[0];

    if (!subOrgId) {
      return res.status(400).json({
        success: false,
        message: 'No sub-organization found'
      });
    }

    // Check if ANY active role exists for this sub-org
    const existingRole = await prisma.sub_organization_participant_role.findFirst({
      where: {
        sub_organizationId: subOrgId,
        isActive: true
      }
    });

    if (existingRole) {
      return res.status(200).json({
        success: true,
        role: existingRole,
        created: false
      });
    }

    // No roles exist — create the default
    const defaultRole = await prisma.sub_organization_participant_role.create({
      data: {
        title: 'Learner',
        description: 'Default participant role',
        sub_organizationId: subOrgId,
        isActive: true,
        isSystemDefault: true,
        createdBy: orgContext.userId
      }
    });

    return res.status(201).json({
      success: true,
      role: defaultRole,
      created: true
    });
  }
});
