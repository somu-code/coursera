import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(json());

import { adminRouter } from "./routes/admin.mjs";

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/admin", adminRouter);

app.get("/", async (req, res) => {
  res.send("<h1>Hello, world!</h1>");
});

app.listen(process.env.PORT, () => {
  console.log(
    `Express server is listening on http://localhost:${process.env.PORT}`
  );
});
