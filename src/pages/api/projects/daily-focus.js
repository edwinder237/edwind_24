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

    if (!date) {
      const allFocus = await prisma.daily_focus.findMany({
        where: { projectId: parseInt(projectId) },
        orderBy: { date: 'asc' }
      });
      return res.status(200).json(allFocus);
    }

    const focus = await prisma.daily_focus.findUnique({
      where: {
        date_projectId: {
          date: new Date(date),
          projectId: parseInt(projectId)
        }
      }
    });

    return res.status(200).json(focus);
  },

  POST: async (req, res) => {
    const { projectId, date } = req.query;
    const { focus: focusText } = req.body;

    if (!projectId) throw new ValidationError('Project ID is required');
    if (!focusText || focusText.trim().length === 0) throw new ValidationError('Focus text is required');
    if (focusText.length > 500) throw new ValidationError('Focus text must be 500 characters or less');

    await verifyProjectAccess(req.orgContext, projectId);

    const upsertedFocus = await prisma.daily_focus.upsert({
      where: {
        date_projectId: {
          date: new Date(date),
          projectId: parseInt(projectId)
        }
      },
      update: {
        focus: focusText.trim(),
        updatedAt: new Date(),
        updatedBy: req.orgContext.userId
      },
      create: {
        date: new Date(date),
        focus: focusText.trim(),
        projectId: parseInt(projectId),
        createdBy: req.orgContext.userId
      }
    });

    return res.status(200).json(upsertedFocus);
  },

  PUT: async (req, res) => {
    const { projectId, date } = req.query;
    const { focus: focusText } = req.body;

    if (!projectId) throw new ValidationError('Project ID is required');
    if (!focusText || focusText.trim().length === 0) throw new ValidationError('Focus text is required');
    if (focusText.length > 500) throw new ValidationError('Focus text must be 500 characters or less');

    await verifyProjectAccess(req.orgContext, projectId);

    const upsertedFocus = await prisma.daily_focus.upsert({
      where: {
        date_projectId: {
          date: new Date(date),
          projectId: parseInt(projectId)
        }
      },
      update: {
        focus: focusText.trim(),
        updatedAt: new Date(),
        updatedBy: req.orgContext.userId
      },
      create: {
        date: new Date(date),
        focus: focusText.trim(),
        projectId: parseInt(projectId),
        createdBy: req.orgContext.userId
      }
    });

    return res.status(200).json(upsertedFocus);
  },

  DELETE: async (req, res) => {
    const { projectId, date } = req.query;
    if (!projectId) throw new ValidationError('Project ID is required');

    await verifyProjectAccess(req.orgContext, projectId);

    await prisma.daily_focus.delete({
      where: {
        date_projectId: {
          date: new Date(date),
          projectId: parseInt(projectId)
        }
      }
    });

    return res.status(200).json({ message: 'Daily focus deleted successfully' });
  }
});
