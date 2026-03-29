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
    const { projectId, date } = req.query;
    if (!projectId) throw new ValidationError('Project ID is required');

    await verifyProjectAccess(req.orgContext, projectId);

    if (date) {
      const dailyNote = await prisma.daily_training_notes.findUnique({
        where: {
          projectId_date: {
            date: new Date(date),
            projectId: parseInt(projectId)
          }
        }
      });
      return res.status(200).json(dailyNote);
    }

    const dailyNotes = await prisma.daily_training_notes.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { date: 'desc' }
    });
    return res.status(200).json(dailyNotes);
  },

  POST: async (req, res) => {
    const { projectId, date } = req.query;
    if (!projectId) throw new ValidationError('Project ID is required');
    if (!date) throw new ValidationError('Date is required');

    await verifyProjectAccess(req.orgContext, projectId);

    const { keyHighlights, challenges, sessionNotes, author, authorRole } = req.body;

    const upsertedNote = await prisma.daily_training_notes.upsert({
      where: {
        projectId_date: {
          date: new Date(date),
          projectId: parseInt(projectId)
        }
      },
      update: {
        keyHighlights: keyHighlights || [],
        challenges: challenges || [],
        sessionNotes: sessionNotes || null,
        author: author || null,
        authorRole: authorRole || null,
        updatedAt: new Date(),
        updatedBy: req.orgContext.userId
      },
      create: {
        date: new Date(date),
        projectId: parseInt(projectId),
        keyHighlights: keyHighlights || [],
        challenges: challenges || [],
        sessionNotes: sessionNotes || null,
        author: author || null,
        authorRole: authorRole || null,
        createdBy: req.orgContext.userId
      }
    });

    return res.status(200).json(upsertedNote);
  },

  PUT: async (req, res) => {
    const { projectId, date } = req.query;
    if (!projectId) throw new ValidationError('Project ID is required');
    if (!date) throw new ValidationError('Date is required');

    await verifyProjectAccess(req.orgContext, projectId);

    const { keyHighlights, challenges, sessionNotes, author, authorRole } = req.body;

    const upsertedNote = await prisma.daily_training_notes.upsert({
      where: {
        projectId_date: {
          date: new Date(date),
          projectId: parseInt(projectId)
        }
      },
      update: {
        keyHighlights: keyHighlights || [],
        challenges: challenges || [],
        sessionNotes: sessionNotes || null,
        author: author || null,
        authorRole: authorRole || null,
        updatedAt: new Date(),
        updatedBy: req.orgContext.userId
      },
      create: {
        date: new Date(date),
        projectId: parseInt(projectId),
        keyHighlights: keyHighlights || [],
        challenges: challenges || [],
        sessionNotes: sessionNotes || null,
        author: author || null,
        authorRole: authorRole || null,
        createdBy: req.orgContext.userId
      }
    });

    return res.status(200).json(upsertedNote);
  },

  DELETE: async (req, res) => {
    const { projectId, date } = req.query;
    if (!projectId) throw new ValidationError('Project ID is required');
    if (!date) throw new ValidationError('Date is required for deletion');

    await verifyProjectAccess(req.orgContext, projectId);

    await prisma.daily_training_notes.delete({
      where: {
        projectId_date: {
          date: new Date(date),
          projectId: parseInt(projectId)
        }
      }
    });

    return res.status(200).json({ message: 'Daily training note deleted successfully' });
  }
});
