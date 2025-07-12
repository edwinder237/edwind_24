import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {

  try {
    const { event, eventId } = req.body;
    await prisma.events.update({
      where: {
        id: eventId, 
      },
      data: event, // Replace module with the editedModule,
    });

    res.status(200).json("Event updated and saved to database");
    console.log("Event updated and saved to database");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
