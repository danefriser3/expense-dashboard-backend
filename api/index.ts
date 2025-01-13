require("dotenv").config();

const express = require("express");
const app = express();
import { createClient } from "@vercel/postgres";
import { Request, Response } from "express";

const bodyParser = require("body-parser");

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const client = createClient();
client.connect();

app.use(express.static("public"));

app.get("/", function (req: Request, res: Response) {
  res.send("Express on Vercel");
});

app.post(
  "/uploadSuccessful",
  urlencodedParser,
  async (req: Request, res: Response) => {
    try {
      // await sql`INSERT INTO Users (Id, Name, Email) VALUES (${req.body.user_id}, ${req.body.name}, ${req.body.email});`;
      res.status(200).send("<h1>User added successfully</h1>");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error adding user");
    }
  }
);

app.get("/allUsers", async (req: Request, res: Response) => {
  try {
    const { rows: users } = await client.sql`SELECT * from users`;
    res.status(200).send({ users });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sequencing user");
  }
});

app.get("/user/:id", async (req: Request, res: Response) => {
  try {
    const { rows: user } =
      await client.sql`SELECT * from users where id = ${req.params.id}`;
    res.status(200).send({ user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sequencing user");
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
