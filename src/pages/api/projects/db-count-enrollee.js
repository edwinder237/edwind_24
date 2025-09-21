import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    const { projectId } = req.body;
    const count = await prisma.project_participants.count({});

    res.status(200).json({
      message: "Participant successfully added to database ",
      count: count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
}
