import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    // If tenant, only show their requests
    if (session.user.role === "TENANT" && session.user.tenantId) {
      where.tenantId = session.user.tenantId;
    }

    if (status) {
      where.status = status;
    }

    const requests = await db.maintenanceRequest.findMany({
      where,
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, category, priority, imageUrls } = data;

    if (!title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let tenantId = data.tenantId;
    let unitId = data.unitId;

    // If tenant is submitting, use their info
    if (session.user.role === "TENANT") {
      if (!session.user.tenantId) {
        return NextResponse.json({ error: "Tenant profile not found" }, { status: 400 });
      }

      const tenant = await db.tenant.findUnique({
        where: { id: session.user.tenantId },
      });

      if (!tenant || !tenant.unitId) {
        return NextResponse.json({ error: "Not assigned to a unit" }, { status: 400 });
      }

      tenantId = tenant.id;
      unitId = tenant.unitId;
    }

    if (!tenantId || !unitId) {
      return NextResponse.json({ error: "Missing tenant or unit" }, { status: 400 });
    }

    const maintenanceRequest = await db.maintenanceRequest.create({
      data: {
        tenantId,
        unitId,
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
        status: "OPEN",
      },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
      },
    });

    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
