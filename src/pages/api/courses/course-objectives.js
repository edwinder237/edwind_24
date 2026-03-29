import prisma from '../../../lib/prisma';
import { createHandler } from '../../../lib/api/createHandler';

// GET - Fetch course objectives
async function getCourseObjectives(req, res) {
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required' });
  }

  const parsedCourseId = parseInt(courseId);
  if (isNaN(parsedCourseId)) {
    return res.status(400).json({ error: 'Invalid courseId: must be a number' });
  }

  const objectives = await prisma.course_objectives.findMany({
    where: { courseId: parsedCourseId },
    orderBy: { objectiveOrder: 'asc' }
  });

  return res.status(200).json({
    success: true,
    objectives: objectives
  });
}

// POST - Create course objective
async function createCourseObjective(req, res) {
  const { courseId, objective, createdBy } = req.body;

  if (!courseId || !objective) {
    return res.status(400).json({
      error: 'Missing required fields: courseId and objective'
    });
  }

  const parsedCourseId = parseInt(courseId);
  if (isNaN(parsedCourseId)) {
    return res.status(400).json({ error: 'Invalid courseId: must be a number' });
  }

  // Get the next order number
  const lastObjective = await prisma.course_objectives.findFirst({
    where: { courseId: parsedCourseId },
    orderBy: { objectiveOrder: 'desc' }
  });

  const nextOrder = lastObjective ? lastObjective.objectiveOrder + 1 : 1;

  const newObjective = await prisma.course_objectives.create({
    data: {
      courseId: parsedCourseId,
      objective: objective.trim(),
      objectiveOrder: nextOrder,
      createdBy: createdBy || null
    }
  });

  return res.status(201).json({
    success: true,
    message: 'Course objective created successfully',
    objective: newObjective
  });
}

// PUT - Update course objective
async function updateCourseObjective(req, res) {
  const { id, objective, updatedBy } = req.body;

  if (!id || !objective) {
    return res.status(400).json({
      error: 'Missing required fields: id and objective'
    });
  }

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: 'Invalid id: must be a number' });
  }

  // Check if objective exists
  const existingObjective = await prisma.course_objectives.findUnique({
    where: { id: parsedId }
  });

  if (!existingObjective) {
    return res.status(404).json({ error: 'Course objective not found' });
  }

  const updatedObjective = await prisma.course_objectives.update({
    where: { id: parsedId },
    data: {
      objective: objective.trim(),
      updatedBy: updatedBy || null
    }
  });

  return res.status(200).json({
    success: true,
    message: 'Course objective updated successfully',
    objective: updatedObjective
  });
}

// DELETE - Delete course objective
async function deleteCourseObjective(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: 'Invalid id: must be a number' });
  }

  // Check if objective exists
  const existingObjective = await prisma.course_objectives.findUnique({
    where: { id: parsedId }
  });

  if (!existingObjective) {
    return res.status(404).json({ error: 'Course objective not found' });
  }

  await prisma.course_objectives.delete({
    where: { id: parsedId }
  });

  // Reorder remaining objectives
  const remainingObjectives = await prisma.course_objectives.findMany({
    where: { courseId: existingObjective.courseId },
    orderBy: { objectiveOrder: 'asc' }
  });

  // Update order numbers
  for (let i = 0; i < remainingObjectives.length; i++) {
    await prisma.course_objectives.update({
      where: { id: remainingObjectives[i].id },
      data: { objectiveOrder: i + 1 }
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Course objective deleted successfully'
  });
}

export default createHandler({
  scope: 'org',
  GET: getCourseObjectives,
  POST: createCourseObjective,
  PUT: updateCourseObjective,
  DELETE: deleteCourseObjective
});
