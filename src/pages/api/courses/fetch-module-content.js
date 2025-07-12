import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {


    const courses =  await prisma.modules.findMany({
      select: {
        id:true,
        JSONContent: true,
      },
    });

    res.status(200).json(courses );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
