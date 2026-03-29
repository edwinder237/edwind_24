import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

export default createHandler({
  scope: 'org',
  GET: async (req, res) => {
    const { orgContext } = req;

    const rooms = await prisma.rooms.findMany({
      where: {
        training_recipient: {
          sub_organizationId: { in: orgContext.subOrganizationIds }
        },
        isActive: true
      },
      include: {
        training_recipient: {
          select: { id: true, name: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.json(rooms);
  },
  POST: async (req, res) => {
    const { orgContext } = req;
    const { name, location, capacity, type, roomType, status, equipment, notes, trainingRecipientId } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    if (!trainingRecipientId) {
      return res.status(400).json({ error: 'Training recipient is required' });
    }

    // Verify training recipient belongs to user's sub-organizations
    const trainingRecipient = await prisma.training_recipients.findFirst({
      where: {
        id: trainingRecipientId,
        sub_organizationId: { in: orgContext.subOrganizationIds }
      }
    });

    if (!trainingRecipient) {
      return res.status(403).json({ error: 'Invalid training recipient' });
    }

    const room = await prisma.rooms.create({
      data: {
        name: name.trim(),
        location: location || null,
        capacity: capacity ? parseInt(capacity) : null,
        type: type || 'Physical',
        roomType: roomType || 'Conference',
        status: status || 'Available',
        equipment: equipment || [],
        notes: notes || null,
        trainingRecipientId,
        createdBy: orgContext.userId
      },
      include: {
        training_recipient: {
          select: { id: true, name: true }
        }
      }
    });
    return res.status(201).json(room);
  }
});
