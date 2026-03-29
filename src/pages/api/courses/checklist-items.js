import prisma from "../../../lib/prisma";
import { createHandler } from '../../../lib/api/createHandler';

// GET - Fetch checklist items for a course
async function getChecklistItems(req, res) {
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({ error: 'Course ID is required' });
  }

  const checklistItems = await prisma.course_checklist_items.findMany({
    where: {
      courseId: parseInt(courseId)
    },
    include: {
      module: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: [
      { category: 'asc' },
      { itemOrder: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  res.status(200).json(checklistItems);
}

// POST - Create new checklist item
async function createChecklistItem(req, res) {
  const {
    courseId,
    title,
    description,
    category = 'general',
    priority = 'medium',
    moduleId,
    itemOrder,
    participantOnly = false,
    createdBy
  } = req.body;

  if (!courseId || !title) {
    return res.status(400).json({ error: 'Course ID and title are required' });
  }

  const newItem = await prisma.course_checklist_items.create({
    data: {
      courseId: parseInt(courseId),
      title,
      description,
      category,
      priority,
      moduleId: moduleId ? parseInt(moduleId) : null,
      itemOrder,
      participantOnly,
      createdBy
    },
    include: {
      module: {
        select: {
          id: true,
          title: true
        }
      }
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
    moduleId,
    itemOrder,
    participantOnly,
    updatedBy
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Item ID is required' });
  }

  const updatedItem = await prisma.course_checklist_items.update({
    where: { id: parseInt(id) },
    data: {
      title,
      description,
      category,
      priority,
      moduleId: moduleId ? parseInt(moduleId) : null,
      itemOrder,
      participantOnly,
      updatedBy,
      updatedAt: new Date()
    },
    include: {
      module: {
        select: {
          id: true,
          title: true
        }
      }
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

  await prisma.course_checklist_items.delete({
    where: { id: parseInt(id) }
  });

  res.status(200).json({ message: 'Checklist item deleted successfully' });
}

export default createHandler({
  scope: 'org',
  GET: getChecklistItems,
  POST: createChecklistItem,
  PUT: updateChecklistItem,
  DELETE: deleteChecklistItem
});
