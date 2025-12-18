import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenants = await db.tenant.findMany({
      include: {
        user: true,
        unit: {
          include: { property: true },
        },
        leases: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { name, email, phone, unitId, emergencyContact, emergencyPhone } = data;

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user exists
    let user = await db.user.findUnique({ where: { email } });

    if (user) {
      // Check if user is already a tenant
      const existingTenant = await db.tenant.findUnique({ where: { userId: user.id } });
      if (existingTenant) {
        return NextResponse.json({ error: "User is already a tenant" }, { status: 400 });
      }
    } else {
      // Create new user with temporary password
      const tempPassword = await bcrypt.hash("changeme123", 10);
      user = await db.user.create({
        data: {
          email,
          name,
          phone,
          password: tempPassword,
          role: "TENANT",
        },
      });
    }

    // Create tenant
    const tenant = await db.tenant.create({
      data: {
        userId: user.id,
        unitId: unitId || null,
        emergencyContact,
        emergencyPhone,
      },
      include: {
        user: true,
        unit: {
          include: { property: true },
        },
      },
    });

    // Update unit status if assigned
    if (unitId) {
      await db.unit.update({
        where: { id: unitId },
        data: { status: "OCCUPIED" },
      });
    }

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
