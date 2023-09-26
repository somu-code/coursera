import express, { Router } from "express";

export const adminRouter = Router();

adminRouter.post("/signup", async (req, res) => {
  try {
    const { email, password } = await req.body;
    console.log(email, password);
    res.json({ message: "Admin created succcessfully" });
  } catch (error) {
    res.sendStatus(500);
  }
});
