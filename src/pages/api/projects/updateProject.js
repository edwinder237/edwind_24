/**
 * ============================================
 * PUT /api/projects/updateProject
 * ============================================
 *
 * Updates an existing project.
 * FIXED: Previously updated any project without org validation.
 *
 * Body:
 * - id (required): Project ID
 * - title, description, dates, status, etc.
 *
 * Response:
 * {
 *   success: true,
 *   project: {...}
 * }
 */

import prisma from "../../../lib/prisma";
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique, scopedUpdate } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const {
      id,
      title,
      description,
      type,
      tags,
      startDate,
      endDate,
      language,
      location,
      trainingRecipientId,
      curriculumId,
      sharing,
      backgroundImg,
      color,
      projectStatus
    } = req.body;

    if (!id) {
      throw new ValidationError('Project ID is required');
    }

    // Verify project ownership
    const existingProject = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(id) }
    });

    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    // Build update data object - only include fields that were provided
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.summary = description;
    if (type !== undefined) updateData.projectType = type;
    if (tags !== undefined) updateData.tags = tags;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (language !== undefined) updateData.language = language;
    if (location !== undefined) updateData.location = location;
    if (trainingRecipientId !== undefined) updateData.trainingRecipientId = trainingRecipientId;
    if (sharing !== undefined) updateData.published = sharing;
    if (backgroundImg !== undefined) updateData.backgroundImg = backgroundImg;
    if (color !== undefined) updateData.color = color;
    if (projectStatus !== undefined) updateData.projectStatus = projectStatus;

    // Update the project with org scoping
    const updatedProject = await scopedUpdate(orgContext, 'projects', {
      where: {
        id: parseInt(id)
      },
      data: updateData,
      include: {
        participants: true,
        groups: true,
        events: true,
        training_recipient: {
          select: {
            id: true,
            name: true,
            description: true,
            contactPerson: true,
            email: true,
            phone: true,
            address: true,
            website: true,
            industry: true,
          }
        }
      }
    });

    // If trainingRecipientId was updated, update all enrollments to match
    if (trainingRecipientId !== undefined && trainingRecipientId !== null) {
      // Update all project_participants enrollments for this project
      const updateResult = await prisma.project_participants.updateMany({
        where: {
          projectId: parseInt(id)
        },
        data: {
          trainingRecipientId: trainingRecipientId
        }
      });

      console.log(`Updated ${updateResult.count} enrollments to trainingRecipientId: ${trainingRecipientId}`);
    }

    // Handle curriculum update
    if (curriculumId !== undefined) {
      // First, remove existing curriculum associations for this project
      await prisma.project_curriculums.deleteMany({
        where: {
          projectId: parseInt(id)
        }
      });

      // If a new curriculum is provided, create the association
      if (curriculumId) {
        await prisma.project_curriculums.create({
          data: {
            projectId: parseInt(id),
            curriculumId: parseInt(curriculumId)
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));