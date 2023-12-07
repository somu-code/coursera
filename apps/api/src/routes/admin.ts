import { Router, Request, Response } from "express";
import { prisma } from "@coursera/database";

export const adminRouter = Router();

adminRouter.get("/info", async (req: Request, res: Response) => {
  res.send("<h1>Admin api</h1>");
});

adminRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password } = await req.body;
    await prisma.admin.create({
      data: {
        email: email,
        hashedPassword: password,
      },
    });
    await prisma.$disconnect();
    res.json({ message: "Admin created succcessfully" });
  } catch (error) {
    prisma.$disconnect();
    res.sendStatus(500);
  }
});
