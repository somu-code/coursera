import express, { Router } from "express";
import { prisma } from "@coursera-typescript/database";

export const adminRouter = Router();

adminRouter.get("/info", async (req, res) => {
  res.send("<h1>Admin api</h1>");
});

adminRouter.post("/signup", async (req, res) => {
  try {
    const { email, password } = await req.body;
    await prisma.admin.create({
      data: {
        email: email,
        hashedPassword: password,
      },
    });
    await prisma.$disconnect();
    console.log(email, password);
    res.json({ message: "Admin created succcessfully" });
  } catch (error) {
    prisma.$disconnect();
    res.sendStatus(500);
  }
});
