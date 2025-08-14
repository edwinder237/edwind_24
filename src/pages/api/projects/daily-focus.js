import { PrismaClient } from '@prisma/client';
import { WorkOS } from '@workos-inc/node';

const prisma = new PrismaClient();
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
        const focus = await prisma.daily_focus.findUnique({
          where: {
            date_projectId: {
              date: new Date(date),
              projectId: parseInt(projectId)
            }
          }
        });
        
        return res.status(200).json(focus);

      case 'POST':
      case 'PUT':
        const { focus: focusText } = req.body;
        
        if (!focusText || focusText.trim().length === 0) {
          return res.status(400).json({ error: 'Focus text is required' });
        }

        if (focusText.length > 500) {
          return res.status(400).json({ error: 'Focus text must be 500 characters or less' });
        }

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
            updatedBy: user.id
          },
          create: {
            date: new Date(date),
            focus: focusText.trim(),
            projectId: parseInt(projectId),
            createdBy: user.id
          }
        });

        return res.status(200).json(upsertedFocus);

      case 'DELETE':
        await prisma.daily_focus.delete({
          where: {
            date_projectId: {
              date: new Date(date),
              projectId: parseInt(projectId)
            }
          }
        });
        
        return res.status(200).json({ message: 'Daily focus deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Daily focus API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}