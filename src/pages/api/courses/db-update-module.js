import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { editedModule, moduleId } = req.body;

  // Remove the 'activities' field from the editedModule object
  delete editedModule.activities;

  console.log(editedModule, moduleId);

  try {
    await prisma.modules.update({
      where: {
        id: moduleId, // Replace moduleId with the actual ID of the module you want to update
      },
      data: editedModule, // Replace module with the editedModule,
    });

    res.status(200).json("Module updated and saved to database");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
