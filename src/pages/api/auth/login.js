import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ==============================|| ACCOUNT - LOGIN  ||============================== //

export default async function handler(req, res) {
  try {
    const { email, password } = req.body.credentials;

    const user = await prisma.User.findUnique({
      where: {
        email: email,
      },
      include:{
        sub_organization: {
          select:{
            title : true
          }
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: "Verify Your Email & Password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    console.log("Fetched user :", user.sub_organization.title);

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      subOrganizationId: user && user.sub_organizationId ? user.sub_organizationId: null ,
      subOrganizationName: user && user.sub_organization ? user.sub_organization.title : "sub_org missing",
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
}
