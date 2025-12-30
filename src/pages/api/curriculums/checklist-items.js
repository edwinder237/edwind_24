import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await getChecklistItems(req, res);
      case 'POST':
        return await createChecklistItem(req, res);
      case 'PUT':
        return await updateChecklistItem(req, res);
      case 'DELETE':
        return await deleteChecklistItem(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in curriculum checklist items API:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Fetch checklist items for a curriculum
async function getChecklistItems(req, res) {
  const { curriculumId } = req.query;

  if (!curriculumId) {
    return res.status(400).json({ error: 'Curriculum ID is required' });
  }

  const checklistItems = await prisma.curriculum_checklist_items.findMany({
    where: {
      curriculumId: parseInt(curriculumId)
    },
    orderBy: [
      { itemOrder: 'asc' },
      { category: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  res.status(200).json(checklistItems);
}

// POST - Create new checklist item
async function createChecklistItem(req, res) {
  const {
    curriculumId,
    title,
    description,
    category = 'trainer_prep',
    priority = 'medium',
    itemOrder,
    createdBy
  } = req.body;

  if (!curriculumId || !title) {
    return res.status(400).json({ error: 'Curriculum ID and title are required' });
  }

  // If no order specified, get the max order and add 1
  let order = itemOrder;
  if (order === undefined || order === null) {
    const maxOrderItem = await prisma.curriculum_checklist_items.findFirst({
      where: { curriculumId: parseInt(curriculumId) },
      orderBy: { itemOrder: 'desc' }
    });
    order = maxOrderItem?.itemOrder ? maxOrderItem.itemOrder + 1 : 0;
  }

  const newItem = await prisma.curriculum_checklist_items.create({
    data: {
      curriculumId: parseInt(curriculumId),
      title,
      description,
      category,
      priority,
      itemOrder: order,
      createdBy
    }
  });

  res.status(201).json(newItem);
}

// PUT - Update checklist item
async function updateChecklistItem(req, res) {
  const { id } = req.query;
  const {
    title,
    description,
    category,
    priority,
    itemOrder,
    updatedBy
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Item ID is required' });
  }

  const updatedItem = await prisma.curriculum_checklist_items.update({
    where: { id: parseInt(id) },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(priority !== undefined && { priority }),
      ...(itemOrder !== undefined && { itemOrder }),
      ...(updatedBy !== undefined && { updatedBy }),
      updatedAt: new Date()
    }
  });

  res.status(200).json(updatedItem);
}

// DELETE - Delete checklist item
async function deleteChecklistItem(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Item ID is required' });
  }

  // This will cascade delete all progress records
  await prisma.curriculum_checklist_items.delete({
    where: { id: parseInt(id) }
  });

  res.status(200).json({ message: 'Checklist item deleted successfully' });
}
