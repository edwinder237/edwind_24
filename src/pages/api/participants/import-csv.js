/**
 * ============================================
 * POST /api/participants/import-csv
 * ============================================
 *
 * Imports participants from CSV data into a project.
 * FIXED: Previously accepted any projectId without validation.
 */

import prisma from '../../../lib/prisma';
import { withOrgScope } from '../../../lib/middleware/withOrgScope.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../../lib/errors/index.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;

  try {
    const { participants, projectId } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      throw new ValidationError('Participants array is required');
    }

    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    // Verify project ownership
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(projectId) },
      select: {
        trainingRecipientId: true,
        sub_organizationId: true
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (!project.trainingRecipientId) {
      throw new ValidationError('Project has no training recipient. Cannot import participants: project must be linked to a training recipient');
    }

    const createdParticipants = [];
    const errors = [];
    const batchSize = 5; // Process 5 participants at a time to avoid timeouts

    // Process participants in smaller batches to avoid transaction timeouts
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize);
      
      try {
        // Process each batch in its own transaction
        const batchResult = await prisma.$transaction(async (tx) => {
          const batchCreated = [];
          const batchErrors = [];
          
          for (const participantData of batch) {
            try {
              // Check if participant with this email already exists
              const existingParticipant = await tx.participants.findUnique({
                where: { email: participantData.email }
              });

              let participant;
              
              if (existingParticipant) {
                // Use existing participant
                participant = existingParticipant;
              } else {
                // Handle role mapping - try to find role by title, otherwise use null
                let roleId = null;
                if (participantData.roleId) {
                  const role = await tx.sub_organization_participant_role.findFirst({
                    where: { 
                      title: participantData.roleId,
                      isActive: true,
                      sub_organizationId: project.sub_organizationId
                    }
                  });
                  roleId = role ? role.id : null;
                }

                // Create new participant
                participant = await tx.participants.create({
                  data: {
                    firstName: participantData.firstName,
                    lastName: participantData.lastName,
                    middleName: participantData.middleName || null,
                    email: participantData.email,
                    derpartement: participantData.derpartement || null,
                    roleId: roleId, // Now properly mapped to role ID
                    participantType: participantData.participantType || 'student',
                    participantStatus: participantData.participantStatus || 'active',
                    notes: participantData.notes || null,
                    profilePrefs: participantData.profilePrefs || {},
                    credentials: participantData.credentials || {},
                    trainingRecipientId: project.trainingRecipientId,
                    sub_organization: project.sub_organizationId, // Use project's sub-organization
                    createdBy: 'csv-import',
                    updatedby: 'csv-import',
                  }
                });
              }

              // Handle tool access creation if provided
              if (participantData.toolAccess && participantData.toolAccess.tool && participantData.toolAccess.username && participantData.toolAccess.accessCode) {
                try {
                  // Check if tool access already exists for this participant and tool
                  const existingToolAccess = await tx.toolAccesses.findFirst({
                    where: {
                      participantId: participant.id,
                      tool: participantData.toolAccess.tool,
                      username: participantData.toolAccess.username
                    }
                  });

                  if (!existingToolAccess) {
                    await tx.toolAccesses.create({
                      data: {
                        tool: participantData.toolAccess.tool,
                        toolType: participantData.toolAccess.toolType || participantData.toolAccess.tool.toLowerCase(),
                        toolUrl: participantData.toolAccess.toolUrl || null,
                        toolDescription: participantData.toolAccess.toolDescription || null,
                        username: participantData.toolAccess.username,
                        accessCode: participantData.toolAccess.accessCode,
                        participantId: participant.id,
                        isActive: true,
                        createdBy: 'csv-import',
                        updatedBy: 'csv-import'
                      }
                    });
                  } else {
                  }
                } catch (toolAccessError) {
                  console.error('Error creating tool access for participant:', participant.email, toolAccessError);
                  // Don't fail the entire participant creation if tool access fails
                }
              }

              // Check if participant is already enrolled in this project
              const existingEnrollment = await tx.project_participants.findFirst({
                where: {
                  projectId: parseInt(projectId),
                  participantId: participant.id
                }
              });

              if (!existingEnrollment) {
                // Add participant to project
                await tx.project_participants.create({
                  data: {
                    projectId: parseInt(projectId),
                    participantId: participant.id,
                    trainingRecipientId: project.trainingRecipientId, // Set TR on enrollment
                    status: 'active'
                  }
                });
              } else if (existingEnrollment.status !== 'active') {
                // Reactivate if previously removed
                await tx.project_participants.update({
                  where: { id: existingEnrollment.id },
                  data: {
                    status: 'active',
                    trainingRecipientId: project.trainingRecipientId // Update TR on reactivation
                  }
                });
              }

              batchCreated.push({
                id: participant.id,
                email: participant.email,
                firstName: participant.firstName,
                lastName: participant.lastName,
                status: existingParticipant ? 'existing' : 'created'
              });

            } catch (error) {
              console.error('Error processing participant:', participantData.email, error);
              batchErrors.push({
                email: participantData.email,
                error: error.message
              });
            }
          }
          
          return { batchCreated, batchErrors };
        }, {
          timeout: 30000, // 30 second timeout per batch
        });
        
        // Add batch results to overall results
        createdParticipants.push(...batchResult.batchCreated);
        errors.push(...batchResult.batchErrors);
        
      } catch (batchError) {
        console.error('Error processing batch:', batchError);
        // If the entire batch fails, add all participants to errors
        batch.forEach(participantData => {
          errors.push({
            email: participantData.email,
            error: 'Batch processing failed: ' + batchError.message
          });
        });
      }
    }

    const result = { createdParticipants, errors };

    res.status(200).json({
      success: true,
      message: `Successfully processed ${result.createdParticipants.length} participants`,
      data: {
        imported: result.createdParticipants,
        errors: result.errors,
        summary: {
          total: participants.length,
          successful: result.createdParticipants.length,
          failed: result.errors.length,
          newParticipants: result.createdParticipants.filter(p => p.status === 'created').length,
          existingParticipants: result.createdParticipants.filter(p => p.status === 'existing').length
        }
      }
    });

  } catch (error) {
    console.error('Error importing participants:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));