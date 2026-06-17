import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { resolve } from "node:path";
import { hashPassword } from "../src/auth.js";

dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), "apps/api/.env") });

const prisma = new PrismaClient();

async function main() {
  const masterEmail = process.env.MASTER_USER_EMAIL ?? "williansantos.mutti@gmail.com";
  const masterPassword = process.env.MASTER_USER_PASSWORD ?? "Qweiol2015";
  const passwordHash = await hashPassword(masterPassword);

  if (masterEmail !== "usuario@local.app") {
    await prisma.user.deleteMany({ where: { email: "usuario@local.app" } });
  }

  const user = await prisma.user.upsert({
    where: { email: masterEmail },
    update: {
      name: "Willian Santos",
      passwordHash,
      role: "MASTER"
    },
    create: {
      name: "Willian Santos",
      email: masterEmail,
      passwordHash,
      role: "MASTER"
    }
  });

  const taskCount = await prisma.task.count({ where: { userId: user.id } });
  if (taskCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          userId: user.id,
          title: "Revisar pendencias do dia",
          type: "GENERAL",
          dueAt: new Date(),
          remindAt: new Date()
        },
        {
          userId: user.id,
          title: "Estudar concurso",
          type: "STUDY",
          dueAt: new Date(new Date().setHours(19, 0, 0, 0)),
          remindAt: new Date(new Date().setHours(19, 0, 0, 0)),
          recurrence: "DAILY"
        }
      ]
    });
  }

  const expenseCount = await prisma.expense.count({ where: { userId: user.id } });
  if (expenseCount === 0) {
    await prisma.expense.create({
      data: {
        userId: user.id,
        amount: 45,
        description: "Mercado",
        category: "MERCADO"
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
