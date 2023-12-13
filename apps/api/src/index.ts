import express, { Request, Response, Express } from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { adminRouter } from "./routes/admin.ts";
import { userRouter } from "./routes/user.ts";

dotenv.config({
  override: true,
  path: path.join(__dirname, "../.env"),
});

const app: Express = express();
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/admin", adminRouter);
app.use("/user", userRouter);

app.get("/", async (req, res) => {
  res.send("<h1>Hello, viewer</h1>");
});

app.listen(process.env.PORT, () => {
  console.log(
    `Express server is listening on http://localhost:${process.env.PORT}`
  );
});
