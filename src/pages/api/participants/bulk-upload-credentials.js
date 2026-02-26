/**
 * ============================================
 * POST /api/participants/bulk-upload-credentials
 * ============================================
 *
 * Bulk creates tool access credentials for existing project participants.
 * Matches participants by email (primary) or externalId (fallback).
 * Skips duplicates where tool+username already exists for a participant.
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
    const { projectId, credentials } = req.body;

    if (!credentials || !Array.isArray(credentials) || credentials.length === 0) {
      throw new ValidationError('Credentials array is required');
    }

    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    // Verify project ownership via org scope
    const project = await scopedFindUnique(orgContext, 'projects', {
      where: { id: parseInt(projectId) },
      select: {
        id: true,
        sub_organizationId: true
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get all active project participants with emails and externalIds for matching
    const projectParticipants = await prisma.project_participants.findMany({
      where: { projectId: parseInt(projectId), status: 'active' },
      include: {
        participant: {
          select: { id: true, email: true, externalId: true, firstName: true, lastName: true }
        }
      }
    });

    // Build lookup maps: email -> participantId, externalId -> participantId
    const emailToParticipant = new Map();
    const externalIdToParticipant = new Map();
    projectParticipants.forEach(pp => {
      const email = pp.participant?.email?.toLowerCase().trim();
      if (email) emailToParticipant.set(email, pp.participant.id);

      const extId = pp.participant?.externalId?.trim();
      if (extId) externalIdToParticipant.set(extId, pp.participant.id);
    });

    // Process credentials in batches
    const created = [];
    const skipped = [];
    const errors = [];
    const batchSize = 10;

    for (let i = 0; i < credentials.length; i += batchSize) {
      const batch = credentials.slice(i, i + batchSize);

      try {
        const batchResult = await prisma.$transaction(async (tx) => {
          const batchCreated = [];
          const batchSkipped = [];
          const batchErrors = [];

          for (const cred of batch) {
            try {
              // Match participant by email (primary) or externalId (fallback)
              const email = cred.email?.toLowerCase().trim();
              const extId = cred.externalId?.trim();
              let participantId = email ? emailToParticipant.get(email) : null;

              if (!participantId && extId) {
                participantId = externalIdToParticipant.get(extId);
              }

              if (!participantId) {
                batchErrors.push({
                  email: cred.email || cred.externalId || 'unknown',
                  error: 'No matching participant found in this project'
                });
                continue;
              }

              if (!cred.tool || !cred.username || !cred.accessCode) {
                batchErrors.push({
                  email: cred.email || cred.externalId || 'unknown',
                  error: 'Missing required fields (tool, username, accessCode)'
                });
                continue;
              }

              // Check for existing duplicate (same tool + username for this participant)
              const existing = await tx.toolAccesses.findFirst({
                where: {
                  participantId,
                  tool: cred.tool,
                  username: cred.username,
                  isActive: true
                }
              });

              if (existing) {
                batchSkipped.push({
                  email: cred.email || '',
                  tool: cred.tool,
                  username: cred.username,
                  reason: 'Tool access already exists for this participant'
                });
                continue;
              }

              // Create new tool access
              await tx.toolAccesses.create({
                data: {
                  tool: cred.tool,
                  toolType: cred.toolType || cred.tool.toLowerCase(),
                  toolUrl: cred.toolUrl || null,
                  toolDescription: cred.toolDescription || null,
                  username: cred.username,
                  accessCode: cred.accessCode,
                  participantId,
                  isActive: true,
                  createdBy: 'csv-credential-upload',
                  updatedBy: 'csv-credential-upload'
                }
              });

              batchCreated.push({
                email: cred.email || '',
                tool: cred.tool,
                username: cred.username,
                participantId
              });

            } catch (err) {
              batchErrors.push({
                email: cred.email || cred.externalId || 'unknown',
                error: err.message
              });
            }
          }

          return { batchCreated, batchSkipped, batchErrors };
        }, {
          timeout: 30000
        });

        created.push(...batchResult.batchCreated);
        skipped.push(...batchResult.batchSkipped);
        errors.push(...batchResult.batchErrors);

      } catch (batchError) {
        console.error('Error processing credential batch:', batchError);
        batch.forEach(cred => {
          errors.push({
            email: cred.email || cred.externalId || 'unknown',
            error: 'Batch processing failed: ' + batchError.message
          });
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed ${created.length} credentials`,
      data: {
        created,
        skipped,
        errors,
        summary: {
          total: credentials.length,
          created: created.length,
          skipped: skipped.length,
          failed: errors.length
        }
      }
    });

  } catch (error) {
    console.error('Error bulk uploading credentials:', error);
    throw error;
  }
}

export default withOrgScope(asyncHandler(handler));
