import { Router } from "express";

export const userRouter = Router();

userRouter.get("/info", async (req, res) => {
  res.send("<h1>User api</h1>");
});
