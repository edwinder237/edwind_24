import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        error: 'Training recipient ID is required' 
      });
    }

    // Check if recipient exists
    const existingRecipient = await prisma.training_recipients.findUnique({
      where: { id: parseInt(id) },
      include: {
        projects: true,
        participants: true
      }
    });

    if (!existingRecipient) {
      return res.status(404).json({
        error: 'Training recipient not found'
      });
    }

    // Check if recipient has associated projects or participants
    if (existingRecipient.projects.length > 0) {
      return res.status(400).json({
        error: `Cannot delete training recipient. It has ${existingRecipient.projects.length} associated project(s). Please remove projects first.`
      });
    }

    if (existingRecipient.participants.length > 0) {
      return res.status(400).json({
        error: `Cannot delete training recipient. It has ${existingRecipient.participants.length} associated participant(s). Please remove participants first.`
      });
    }

    // Delete training recipient
    await prisma.training_recipients.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Training recipient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting training recipient:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}