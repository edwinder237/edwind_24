import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const { participantId, enrollee } = req.body;
    const data = enrollee;
    await prisma.participants.update({
      where: {
        id: "dfc72e6f-1a84-45f3-aeca-1d5b0fa861b8",
      },
      data,
    });
    res.status(200).json({
      message: "Participant successfully updated to the database",
      participants: allProjectParticipants,
    });
    console.error("Participant successfully updated to the database");
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
