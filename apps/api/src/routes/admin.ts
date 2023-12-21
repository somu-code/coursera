import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "@coursera/database";
import {
  authenticateAdminJWT,
  generateAdminJWT,
} from "../jwt-auth/admin-auth.js";
import type { Admin, adminPayload } from "../custom-types/admin-types.js";
import type {
  Course,
  CourseFromDB,
  CourseWithAdminId,
} from "../custom-types/course-types.js";
import { signupSchema } from "@coursera/common";
// import bcrypt from "bcrypt";

export const adminRouter: Router = Router();

adminRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const parsedInput = signupSchema.safeParse(req.body);
    if (!parsedInput.success) {
      return res.status(411).json({ message: "Invalid input" });
      //        .json({ message: parsedInput.error.issues[0].message });
    } else {
      const { email, password }: { email: string; password: string } =
        parsedInput.data;
      const adminData: Admin | null = await prisma.admin.findFirst({
        where: { email: email },
      });
      if (adminData) {
        await prisma.$disconnect();
        return res.status(403).json({ message: "Admin email already exists" });
      }
      // const hashedPassword: string = await bcrypt.hash(password, 8);
      const hashedPassword: string = password;
      await prisma.admin.create({
        data: {
          email,
          hashedPassword: hashedPassword,
        },
      });

      await prisma.$disconnect();
      return res.json({ message: "Admin created successfully" });
    }
  } catch (error) {
    await prisma.$disconnect();
    console.error(error);
    res.sendStatus(500);
  }
});

adminRouter.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password }: { email: string; password: string } = req.body;
    const adminData: Admin | null = await prisma.admin.findUnique({
      where: {
        email: email,
      },
    });
    await prisma.$disconnect();
    if (!adminData) {
      return res.status(404).json({ message: "Admin email not found" });
    } else {
      // const isPasswordMatch: boolean = await bcrypt.compare(
      //   password,
      //   adminData.hashedPassword
      // );
      const isPasswordMatch: boolean = password === adminData.hashedPassword;
      if (!isPasswordMatch) {
        return res.status(401).json({ message: "Invalid password" });
      } else {
        const { id, email, role }: { id: number; email: string; role: string } =
          adminData;
        const adminPayload: adminPayload = { id, email, role };
        const adminToken: string = generateAdminJWT(adminPayload);
        res.cookie("adminAccessToken", adminToken, {
          domain: "localhost",
          path: "/",
          maxAge: 60 * 60 * 1000,
          secure: true,
          sameSite: "strict",
        });
        return res.json({ message: "Logged in successfully" });
      }
    }
  } catch (error) {
    await prisma.$disconnect();
    console.error(error);
    res.sendStatus(500);
  }
});

adminRouter.get(
  "/profile",
  authenticateAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const decodedAdmin: decodedAdmin = req.decodedAdmin;
      const adminData: Admin | null = await prisma.admin.findUnique({
        where: {
          id: decodedAdmin.id,
        },
      });
      await prisma.$disconnect();
      res.json({
        name: adminData?.name,
        id: adminData?.id,
        email: adminData?.email,
        role: adminData?.role,
      });
    } catch (error) {
      await prisma.$disconnect();
      console.error(error);
      res.sendStatus(500);
    }
  },
);

adminRouter.post(
  "/logout",
  authenticateAdminJWT,
  async (_req: Request, res: Response) => {
    try {
      res.clearCookie("adminAccessToken");
      res.clearCookie("adminLoggedIn");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  },
);

adminRouter.delete(
  "/delete",
  authenticateAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const decodedAdmin: decodedAdmin = req.decodedAdmin;
      await prisma.admin.delete({
        where: {
          id: decodedAdmin.id,
        },
      });
      await prisma.$disconnect();
      res.clearCookie("adminAccessToken");
      res.clearCookie("adminLoggedIn");
      res.json({ message: "Admin deleted successfully" });
    } catch (error) {
      await prisma.$disconnect();
      console.error(error);
      res.sendStatus(500);
    }
  },
);

// Courses

adminRouter.post(
  "/create-course",
  authenticateAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const { title, description, published, imageUrl, price }: Course =
        await req.body;
      const decodedAdmin: decodedAdmin = req.decodedAdmin;
      const createCourse: CourseWithAdminId = {
        adminId: decodedAdmin.id,
        title,
        description,
        published,
        imageUrl,
        price,
      };
      await prisma.course.create({
        data: createCourse,
      });
      await prisma.$disconnect();
      res.json({ message: "Course created successfully" });
    } catch (error) {
      await prisma.$disconnect();
      console.error(error);
      res.sendStatus(500);
    }
  },
);

adminRouter.put(
  "/update-course",
  authenticateAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const updatedCourse: CourseFromDB = await req.body;
      const decodedAdmin: decodedAdmin = req.decodedAdmin;
      if (decodedAdmin.id === updatedCourse.adminId) {
        const isOwnedByAdmin = await prisma.course
          .findUnique({
            where: { id: updatedCourse.id },
            select: {
              admin: {
                select: {
                  id: true,
                },
              },
            },
          })
          .then((course) => course?.admin.id === decodedAdmin.id);
        await prisma.$disconnect();
        if (isOwnedByAdmin) {
          await prisma.course.update({
            where: {
              id: updatedCourse.id,
              adminId: decodedAdmin.id,
            },
            data: updatedCourse,
          });
          await prisma.$disconnect();
          return res.json({ message: "Course updated successfully" });
        } else {
          return res
            .status(403)
            .json({ message: "Admin does not own the course." });
        }
      } else {
        return res.status(403).json({
          message:
            "Admin id from updated course is mismatchd from admin id in cookie",
        });
      }
    } catch (error) {
      await prisma.$disconnect();
      console.log(error);
      res.sendStatus(500);
    }
  },
);

adminRouter.delete(
  "/delete-course",
  authenticateAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const decodedAdmin: decodedAdmin = req.decodedAdmin;
      const { courseId }: { courseId: number } = await req.body;
      const isOwnedByAdmin = await prisma.course
        .findUnique({
          where: { id: courseId },
          select: {
            admin: {
              select: {
                id: true,
              },
            },
          },
        })
        .then((course) => course?.admin.id === decodedAdmin.id);
      if (isOwnedByAdmin) {
        const result = await prisma.course.delete({
          where: { id: courseId },
        });
        console.log(result);
        return res.json({ message: "Course deleted successfully" });
      } else {
        return res.status(403).json({
          message:
            "User does not won the course. Or the course does not exists",
        });
      }
    } catch (error) {
      await prisma.$disconnect();
      console.log(error);
      res.sendStatus(500);
    }
  },
);

adminRouter.get(
  "/my-courses",
  authenticateAdminJWT,
  async (req: Request, res: Response) => {
    try {
      const decodedAdmin: decodedAdmin = req.decodedAdmin;
      const courses: CourseFromDB[] = await prisma.course.findMany({
        where: { adminId: decodedAdmin.id },
      });
      await prisma.$disconnect();
      res.json(courses);
    } catch (error) {
      await prisma.$disconnect();
      console.log(error);
      res.sendStatus(500);
    }
  },
);

adminRouter.get(
  "/all-courses",
  authenticateAdminJWT,
  async (_req: Request, res: Response) => {
    try {
      const courses: CourseFromDB[] = await prisma.course.findMany();
      await prisma.$disconnect();
      res.json(courses);
    } catch (error) {
      await prisma.$disconnect();
      console.log(error);
      res.sendStatus(500);
    }
  },
);
