import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/require-org";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period"); // "YYYY-MM"

  let dateFilter;
  if (period) {
    const [year, month] = period.split("-").map(Number);
    dateFilter = {
      gte: new Date(Date.UTC(year, month - 1, 1)),
      lt: new Date(Date.UTC(year, month, 1)),
    };
  }

  const expenses = await prisma.expense.findMany({
    where: { organizationId, ...(dateFilter && { date: dateFilter }) },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const { organizationId, response } = await requireOrg("DIRECTIVO");
  if (response) return response;

  const { category, description, amount, date } = await req.json();
  if (!category || !amount || !date) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: { category, description: description || null, amount, date: new Date(date), organizationId },
  });

  return NextResponse.json(expense);
}
