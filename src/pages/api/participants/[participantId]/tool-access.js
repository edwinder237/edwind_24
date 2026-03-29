import prisma from '../../../../lib/prisma';
import { createHandler } from '../../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { participantId } = req.query;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    return await getToolAccesses(req, res);
  },
  POST: async (req, res) => {
    const { participantId } = req.query;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    return await createToolAccess(req, res);
  }
});

async function getToolAccesses(req, res) {
  const { participantId } = req.query;

  try {
    // Verify participant exists
    const participant = await prisma.participants.findUnique({
      where: { id: participantId }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const toolAccesses = await prisma.toolAccesses.findMany({
      where: {
        participantId: participantId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(toolAccesses);
  } catch (error) {
    console.error('Error fetching tool accesses:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch tool accesses',
      message: error.message 
    });
  }
}

async function createToolAccess(req, res) {
  const { participantId } = req.query;
  const { tool, toolType, toolUrl, toolDescription, username, accessCode, organizationToolId } = req.body;

  if (!tool || !username || !accessCode) {
    return res.status(400).json({ 
      error: 'Tool name, username, and access code are required' 
    });
  }

  try {
    // Verify participant exists
    const participant = await prisma.participants.findUnique({
      where: { id: participantId }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Check if tool access already exists for this participant and tool
    const existingToolAccess = await prisma.toolAccesses.findFirst({
      where: {
        participantId: participantId,
        tool: tool,
        username: username,
        isActive: true
      }
    });

    if (existingToolAccess) {
      return res.status(409).json({ 
        error: 'Tool access already exists for this participant and tool/username combination' 
      });
    }

    const toolAccess = await prisma.toolAccesses.create({
      data: {
        tool,
        toolType: toolType || tool.toLowerCase(),
        toolUrl: toolUrl || null,
        toolDescription: toolDescription || null,
        username,
        accessCode,
        participantId,
        isActive: true,
        organizationToolId: organizationToolId || null,
        createdBy: 'user', // TODO: Replace with actual user ID
        updatedBy: 'user', // TODO: Replace with actual user ID
      }
    });

    return res.status(201).json({
      message: 'Tool access created successfully',
      toolAccess
    });
  } catch (error) {
    console.error('Error creating tool access:', error);
    return res.status(500).json({ 
      error: 'Failed to create tool access',
      message: error.message 
    });
  }
}