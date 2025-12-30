import prisma from "../../../lib/prisma";
import { WorkOS } from '@workos-inc/node';
const workos = new WorkOS(process.env.WORKOS_API_KEY);

export default async function handler(req, res) {
  try {
    const userId = req.cookies.workos_user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user from WorkOS
    const user = await workos.userManagement.getUser(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { method } = req;
    const { projectId, date } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    switch (method) {
      case 'GET':
        if (date) {
          // Get specific daily note by date
          const dailyNote = await prisma.daily_training_notes.findUnique({
            where: {
              projectId_date: {
                date: new Date(date),
                projectId: parseInt(projectId)
              }
            }
          });

          return res.status(200).json(dailyNote);
        } else {
          // Get all daily notes for the project
          const dailyNotes = await prisma.daily_training_notes.findMany({
            where: {
              projectId: parseInt(projectId)
            },
            orderBy: {
              date: 'desc'
            }
          });

          return res.status(200).json(dailyNotes);
        }

      case 'POST':
      case 'PUT':
        if (!date) {
          return res.status(400).json({ error: 'Date is required' });
        }

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
            updatedBy: user.id
          },
          create: {
            date: new Date(date),
            projectId: parseInt(projectId),
            keyHighlights: keyHighlights || [],
            challenges: challenges || [],
            sessionNotes: sessionNotes || null,
            author: author || null,
            authorRole: authorRole || null,
            createdBy: user.id
          }
        });

        return res.status(200).json(upsertedNote);

      case 'DELETE':
        if (!date) {
          return res.status(400).json({ error: 'Date is required for deletion' });
        }

        await prisma.daily_training_notes.delete({
          where: {
            projectId_date: {
              date: new Date(date),
              projectId: parseInt(projectId)
            }
          }
        });

        return res.status(200).json({ message: 'Daily training note deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Daily training notes API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
