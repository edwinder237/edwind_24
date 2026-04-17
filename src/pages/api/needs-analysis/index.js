import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';
import { NotFoundError, ValidationError } from '../../../lib/errors/index.js';
import { scopedFindUnique } from '../../../lib/prisma/scopedQueries.js';

async function verifyProjectAccess(orgContext, projectId) {
  const project = await scopedFindUnique(orgContext, 'projects', {
    where: { id: parseInt(projectId) }
  });
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  return project;
}

export default createHandler({
  GET: async (req, res) => {
    const { projectId } = req.query;
    if (!projectId) throw new ValidationError('Project ID is required');

    await verifyProjectAccess(req.orgContext, projectId);

    // Auto-create empty record if none exists (upsert on read)
    const needsAnalysis = await prisma.project_needs_analysis.upsert({
      where: { projectId: parseInt(projectId) },
      update: {},
      create: {
        projectId: parseInt(projectId),
        problemStatement: null,
        rootCauses: [],
        desiredOutcome: null,
        successMetrics: [],
        createdBy: req.orgContext.userId
      }
    });

    return res.status(200).json({ success: true, data: needsAnalysis });
  },

  POST: async (req, res) => {
    const { projectId } = req.query;
    if (!projectId) throw new ValidationError('Project ID is required');

    await verifyProjectAccess(req.orgContext, projectId);

    const { problemStatement, rootCauses, desiredOutcome, successMetrics, status } = req.body;

    const needsAnalysis = await prisma.project_needs_analysis.upsert({
      where: { projectId: parseInt(projectId) },
      update: {
        problemStatement: problemStatement !== undefined ? problemStatement : undefined,
        rootCauses: rootCauses !== undefined ? rootCauses : undefined,
        desiredOutcome: desiredOutcome !== undefined ? desiredOutcome : undefined,
        successMetrics: successMetrics !== undefined ? successMetrics : undefined,
        status: status !== undefined ? status : undefined,
        updatedBy: req.orgContext.userId
      },
      create: {
        projectId: parseInt(projectId),
        problemStatement: problemStatement || null,
        rootCauses: rootCauses || [],
        desiredOutcome: desiredOutcome || null,
        successMetrics: successMetrics || [],
        status: status || 'draft',
        createdBy: req.orgContext.userId
      }
    });

    return res.status(200).json({ success: true, data: needsAnalysis, message: 'Needs analysis saved' });
  }
});
