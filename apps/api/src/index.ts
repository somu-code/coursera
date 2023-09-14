import express from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();

app.get("/", async (req, res) => {
  res.send("<h1>Hello, world!</h1>");
});

app.listen(process.env.PORT, () => {
  console.log(
    `Express server is listening on http://localhost:${process.env.PORT}`
  );
});
