import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "@coursera/database";
import { authenticateUserJWT, generateUserJWT } from "../jwt-auth/user-auth.js";
import type { User, userPayload } from "../custom-types/user-types.js";
import type { CourseFromDB } from "../custom-types/course-types.js";
import { signupSchema } from "@coursera/common";

export const userRouter: Router = Router();

userRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const parsedInput = signupSchema.safeParse(req.body);
    if (!parsedInput.success) {
      return res
        .status(411)
        .json({ message: "invalid input" });
      //        .json({ message: parsedInput.error.issues[0].message });
    } else {
      const { email, password }: { email: string; password: string } =
        parsedInput.data;

      const userData: User | null = await prisma.user.findFirst({
        where: { email: email },
      });
      if (userData) {
        await prisma.$disconnect();
        return res.status(403).json({ message: "User email already exists" });
      }
      const hashedPassword: string = password;
      await prisma.user.create({
        data: {
          email: email,
          hashedPassword: hashedPassword,
        },
      });
      await prisma.$disconnect();
      res.json({
        message: "User created successfully",
      });
    }
  } catch (error) {
    await prisma.$disconnect();
    console.error(error);
    res.sendStatus(500);
  }
});

userRouter.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password }: { email: string; password: string } =
      await req.body;
    const userData: User | null = await prisma.user.findFirst({
      where: { email: email },
    });
    await prisma.$disconnect();
    if (!userData) {
      return res.status(404).json({ message: "User email not found" });
    }
    const isPasswordMatch: boolean = password === userData.hashedPassword;

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    } else {
      const { id, email, role }: { id: number; email: string; role: string } =
        userData;
      const userPayload: userPayload = { id, email, role };
      const userToken: string = generateUserJWT(userPayload);
      res.cookie("userAccessToken", userToken, {
        domain: "localhost",
        path: "/",
        maxAge: 60 * 60 * 1000,
        secure: true,
        sameSite: "strict",
      });
      return res.json({ message: "Logged in successfully", email });
    }
  } catch (error) {
    await prisma.$disconnect();
    console.error(error);
    res.sendStatus(500);
  }
});

userRouter.get(
  "/profile",
  authenticateUserJWT,
  async (req: Request, res: Response) => {
    try {
      const decodedUser: decodedUser = req.decodedUser;
      const userData: User | null = await prisma.user.findFirst({
        where: { id: decodedUser.id },
      });
      await prisma.$disconnect();
      res.json({
        name: userData?.name,
        id: userData?.id,
        email: userData?.email,
        role: userData?.role,
      });
    } catch (error) {
      await prisma.$disconnect();
      console.error(error);
      res.sendStatus(500);
    }
  }
);

userRouter.post("/logout", authenticateUserJWT, async (_req, res) => {
  try {
    res.clearCookie("userAccessToken");
    res.clearCookie("userLoggedIn");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

userRouter.delete("/delete", authenticateUserJWT, async (req, res) => {
  try {
    const decodedUser: decodedUser = req.decodedUser;
    await prisma.user.delete({
      where: { id: decodedUser.id },
    });
    await prisma.$disconnect();
    res.clearCookie("userAccessToken");
    res.clearCookie("userLoggedIn");
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    await prisma.$disconnect();
    console.error(error);
    res.sendStatus(500);
  }
});

// Courses

userRouter.get(
  "/all-courses",
  authenticateUserJWT,
  async (_req: Request, res: Response) => {
    try {
      const courseData: CourseFromDB[] = await prisma.course.findMany();
      await prisma.$disconnect();
      res.json(courseData);
    } catch (error) {
      await prisma.$disconnect();
      console.error(error);
      res.sendStatus(500);
    }
  }
);

userRouter.post(
  "/purchase-course",
  authenticateUserJWT,
  async (req: Request, res: Response) => {
    try {
      const { courseId }: { courseId: number } = await req.body;
      const decodedUser: decodedUser = req.decodedUser;
      await prisma.userCourses.create({
        data: {
          user: {
            connect: { id: decodedUser.id },
          },
          course: {
            connect: { id: courseId },
          },
        },
      });
      await prisma.$disconnect();
      res.json({
        message: `User id ${decodedUser.id} brought course id ${courseId}`,
      });
    } catch (error) {
      await prisma.$disconnect();
      console.error(error);
      res.sendStatus(500);
    }
  }
);

userRouter.get(
  "/my-courses",
  authenticateUserJWT,
  async (req: Request, res: Response) => {
    try {
      const decodedUser: decodedUser = req.decodedUser;
      const userPurchased = await prisma.user.findUnique({
        where: {
          id: decodedUser.id,
        },
        select: {
          UserCourses: {
            select: {
              course: true,
            },
          },
        },
      });
      await prisma.$disconnect();
      res.json(userPurchased);
    } catch (error) {
      await prisma.$disconnect();
      console.error(error);
      res.sendStatus(500);
    }
  }
);
