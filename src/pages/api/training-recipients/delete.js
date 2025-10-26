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

    // Check if recipient has associated projects
    if (existingRecipient.projects.length > 0) {
      return res.status(400).json({
        error: `Cannot delete training recipient. It has ${existingRecipient.projects.length} associated project(s). Please remove or reassign projects first.`
      });
    }

    // Delete all participants associated with this training recipient
    const participantIds = existingRecipient.participants.map(p => p.id);

    if (participantIds.length > 0) {
      // First, delete all project_participants records for these participants
      await prisma.project_participants.deleteMany({
        where: {
          participantId: {
            in: participantIds
          }
        }
      });

      // Then delete the participants themselves
      await prisma.participants.deleteMany({
        where: {
          id: {
            in: participantIds
          }
        }
      });
    }

    // Finally, delete the training recipient
    await prisma.training_recipients.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: `Training recipient and ${participantIds.length} participant(s) deleted successfully`,
      deletedParticipants: participantIds.length
    });
  } catch (error) {
    console.error('Error deleting training recipient:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}