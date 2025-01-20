require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
import { createClient } from "@vercel/postgres";
import { Request, Response } from "express";

const bodyParser = require("body-parser");

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const client = createClient();
client.connect();

app.use(express.static("public"));
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Expense model
export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  bankAccount: string;
  details: string;
  user_id: string;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  bankAccount: string;
  details: string;
  user_id: string;
}

export interface BankAccount {
  id: string;
  name: string;
  base_value: number;
}

app.get("/bank_accounts", async (req: Request, res: Response) => {
  try {
    const { rows: bank_accounts } =
      await client.sql`SELECT * FROM bank_accounts`;
    res.status(200).json(
      bank_accounts.map((bank_account) => ({
        ...bank_account,
        base_value: parseFloat(bank_account.base_value),
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching expenses");
  }
});
app.post("/users", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { rows: user } =
      await client.sql`SELECT * FROM users where email = ${email} and password = ${password}`;
    res.status(200).json(user[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching user");
  }
});

app.put(
  "/bank_accounts/:id",
  urlencodedParser,
  async (req: Request, res: Response) => {
    const { name, base_value }: Partial<BankAccount> = req.body;
    try {
      await client.sql`UPDATE bank_accounts SET name = ${name}, base_value = ${base_value} WHERE id = ${req.params.id}`;
      res.status(200).send("Bank Account updated successfully");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating bank account");
    }
  }
);

app.get(
  "/expenses/:userId/:bankAccount",
  async (req: Request, res: Response) => {
    try {
      const { userId, bankAccount } = req.params;
      const { rows: expenses } =
        await client.sql`SELECT * FROM expenses WHERE user_id = ${userId} AND bank_account = ${bankAccount} ORDER BY date DESC`;
      res.status(200).json(
        expenses.map((expense) => ({
          ...expense,
          amount: parseFloat(expense.amount),
        }))
      );
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching expenses");
    }
  }
);

app.get(
  "/incomes/:userId/:bankAccount",
  async (req: Request, res: Response) => {
    try {
      const { userId, bankAccount } = req.params;
      const { rows: incomes }: { rows: Income[] } =
        await client.sql`SELECT * FROM incomes WHERE user_id = ${userId} AND bank_account = ${bankAccount}`;
      res.status(200).json(
        incomes.map((income) => ({
          ...income,
          amount: parseFloat(income.amount.toString()),
        }))
      );
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching incomes");
    }
  }
);

app.get("/expenses/:id", async (req: Request, res: Response) => {
  try {
    const { rows: expense } =
      await client.sql`SELECT * FROM expenses WHERE id = ${req.params.id}`;
    if (expense.length === 0) {
      res.status(404).send("Expense not found");
    } else {
      res.status(200).json(expense[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching expense");
  }
});

app.post("/expenses", urlencodedParser, async (req: Request, res: Response) => {
  const {
    name,
    amount,
    category,
    date,
    bankAccount,
    details,
    user_id,
  }: Expense = req.body;
  try {
    await client.sql`INSERT INTO expenses (name, amount, category, date, bank_account, details, user_id) VALUES (${name}, ${amount}, ${category}, ${date}, ${bankAccount}, ${
      details ?? ""
    }, ${user_id})`;
    res.status(201).send("Expense added successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding expense");
  }
});

app.post("/incomes", urlencodedParser, async (req: Request, res: Response) => {
  const {
    name,
    amount,
    category,
    date,
    bankAccount,
    details,
    user_id,
  }: Income = req.body;
  try {
    await client.sql`INSERT INTO incomes (name, amount, category, date, bank_account, details, user_id) VALUES (${name}, ${amount}, ${category}, ${date}, ${bankAccount}, ${
      details ?? ""
    }, ${user_id})`;
    res.status(201).send("Income added successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding income");
  }
});

app.put(
  "/expenses/:id",
  urlencodedParser,
  async (req: Request, res: Response) => {
    const { name, amount, category, date }: Partial<Expense> = req.body;
    try {
      await client.sql`UPDATE expenses SET name = ${name}, amount = ${amount}, category = ${category}, date = ${date} WHERE id = ${req.params.id}`;
      res.status(200).send("Expense updated successfully");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating expense");
    }
  }
);

app.delete("/expenses/:id", async (req: Request, res: Response) => {
  try {
    await client.sql`DELETE FROM expenses WHERE id = ${req.params.id}`;
    res.status(200).send("Expense deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting expense");
  }
});

app.delete("/incomes/:id", async (req: Request, res: Response) => {
  try {
    await client.sql`DELETE FROM incomes WHERE id = ${req.params.id}`;
    res.status(200).send("Income deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting income");
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
