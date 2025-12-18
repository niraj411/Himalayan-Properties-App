import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let settings = await db.settings.findFirst();

    if (!settings) {
      settings = await db.settings.create({
        data: { companyName: "Himalayan Properties" },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      bankName,
      bankRoutingNumber,
      bankAccountNumber,
      checkMailingAddress,
      paymentInstructions,
    } = data;

    let settings = await db.settings.findFirst();

    if (settings) {
      settings = await db.settings.update({
        where: { id: settings.id },
        data: {
          companyName,
          companyEmail,
          companyPhone,
          companyAddress,
          bankName,
          bankRoutingNumber,
          bankAccountNumber,
          checkMailingAddress,
          paymentInstructions,
        },
      });
    } else {
      settings = await db.settings.create({
        data: {
          companyName,
          companyEmail,
          companyPhone,
          companyAddress,
          bankName,
          bankRoutingNumber,
          bankAccountNumber,
          checkMailingAddress,
          paymentInstructions,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
