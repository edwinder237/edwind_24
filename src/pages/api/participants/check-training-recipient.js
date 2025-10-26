import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if participant with this email exists
    const participant = await prisma.participants.findFirst({
      where: {
        email: email.toLowerCase().trim()
      },
      include: {
        training_recipient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      participant
    });

  } catch (error) {
    console.error('Error checking participant training recipient:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check participant',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
