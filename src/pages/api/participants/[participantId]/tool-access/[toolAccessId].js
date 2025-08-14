import prisma from '../../../../../lib/prisma';

export default async function handler(req, res) {
  const { method, query } = req;
  const { participantId, toolAccessId } = query;

  if (!participantId || !toolAccessId) {
    return res.status(400).json({ error: 'Participant ID and Tool Access ID are required' });
  }

  try {
    switch (method) {
      case 'PUT':
        return await updateToolAccess(req, res);
      case 'DELETE':
        return await deleteToolAccess(req, res);
      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}

async function updateToolAccess(req, res) {
  const { participantId, toolAccessId } = req.query;
  const { tool, toolType, toolUrl, toolDescription, username, accessCode, isActive } = req.body;

  if (!tool || !username || !accessCode) {
    return res.status(400).json({ 
      error: 'Tool name, username, and access code are required' 
    });
  }

  try {
    // Check if tool access exists and belongs to the participant
    const existingToolAccess = await prisma.toolAccesses.findFirst({
      where: {
        id: parseInt(toolAccessId),
        participantId: participantId
      }
    });

    if (!existingToolAccess) {
      return res.status(404).json({ error: 'Tool access not found' });
    }

    // Check for duplicate tool/username combination (excluding current record)
    const duplicateToolAccess = await prisma.toolAccesses.findFirst({
      where: {
        participantId: participantId,
        tool: tool,
        username: username,
        isActive: true,
        id: { not: parseInt(toolAccessId) }
      }
    });

    if (duplicateToolAccess) {
      return res.status(409).json({ 
        error: 'Another tool access with the same tool and username already exists' 
      });
    }

    const toolAccess = await prisma.toolAccesses.update({
      where: { id: parseInt(toolAccessId) },
      data: {
        tool,
        toolType: toolType || tool.toLowerCase(),
        toolUrl: toolUrl || null,
        toolDescription: toolDescription || null,
        username,
        accessCode,
        isActive: isActive !== undefined ? isActive : existingToolAccess.isActive,
        updatedBy: 'user', // TODO: Replace with actual user ID
      }
    });

    return res.status(200).json({
      message: 'Tool access updated successfully',
      toolAccess
    });
  } catch (error) {
    console.error('Error updating tool access:', error);
    return res.status(500).json({ 
      error: 'Failed to update tool access',
      message: error.message 
    });
  }
}

async function deleteToolAccess(req, res) {
  const { participantId, toolAccessId } = req.query;

  try {
    // Check if tool access exists and belongs to the participant
    const existingToolAccess = await prisma.toolAccesses.findFirst({
      where: {
        id: parseInt(toolAccessId),
        participantId: participantId
      }
    });

    if (!existingToolAccess) {
      return res.status(404).json({ error: 'Tool access not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.toolAccesses.update({
      where: { id: parseInt(toolAccessId) },
      data: {
        isActive: false,
        updatedBy: 'user', // TODO: Replace with actual user ID
      }
    });

    return res.status(200).json({
      message: 'Tool access deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tool access:', error);
    return res.status(500).json({ 
      error: 'Failed to delete tool access',
      message: error.message 
    });
  }
}