import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const {credentials} = req.body;
    const password = credentials.password; 
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    const newUser = await prisma.User.create({
      data: {
        username: credentials.name,
        email: credentials.email,
        password: hashedPassword, // Use the hashed password
        name: credentials.name,
        firstName: "John",
        lastName: "Doe",
        status: "active",
        info: { bio: "", phone: "" },
        sub_organizationId: 1,
      },
    });

    console.log("New user created:", newUser);
    res.status(200).json(newUser );
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect(); // Close the Prisma client connection
  }
}
