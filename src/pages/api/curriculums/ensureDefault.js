/**
 * ============================================
 * POST /api/curriculums/ensureDefault
 * ============================================
 *
 * Ensures a default curriculum exists for the current organization.
 * If no default curriculum exists, creates one titled "Custom Training".
 *
 * Response:
 * {
 *   success: true,
 *   curriculum: {...},
 *   created: boolean
 * }
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;
  const subOrgId = orgContext.subOrganizationIds[0];

  if (!subOrgId) {
    return res.status(400).json({
      success: false,
      message: 'No sub-organization found'
    });
  }

  try {
    // Check if a default curriculum already exists for this sub-org
    let defaultCurriculum = await prisma.curriculums.findFirst({
      where: {
        sub_organizationId: subOrgId,
        isDefault: true
      },
      include: {
        curriculum_courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (defaultCurriculum) {
      return res.status(200).json({
        success: true,
        curriculum: {
          ...defaultCurriculum,
          courseCount: defaultCurriculum.curriculum_courses.length
        },
        created: false
      });
    }

    // Check if there's an existing "Custom Training" curriculum that should be marked as default
    const existingCustomTraining = await prisma.curriculums.findFirst({
      where: {
        sub_organizationId: subOrgId,
        title: 'Custom Training'
      }
    });

    if (existingCustomTraining) {
      // Update existing curriculum to be the default
      defaultCurriculum = await prisma.curriculums.update({
        where: { id: existingCustomTraining.id },
        data: { isDefault: true },
        include: {
          curriculum_courses: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        curriculum: {
          ...defaultCurriculum,
          courseCount: defaultCurriculum.curriculum_courses.length
        },
        created: false
      });
    }

    // Create a new default curriculum
    defaultCurriculum = await prisma.curriculums.create({
      data: {
        title: 'Custom Training',
        description: 'Default curriculum for custom training projects. Add courses to enable full calendar scheduling.',
        isDefault: true,
        sub_organizationId: subOrgId
      },
      include: {
        curriculum_courses: true
      }
    });

    res.status(201).json({
      success: true,
      curriculum: {
        ...defaultCurriculum,
        courseCount: 0
      },
      created: true
    });

  } catch (error) {
    console.error('Error ensuring default curriculum:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
