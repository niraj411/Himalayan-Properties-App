import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const maintenanceRequest = await db.maintenanceRequest.findUnique({
      where: { id },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
      },
    });

    if (!maintenanceRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Tenants can only view their own requests
    if (session.user.role === "TENANT" && maintenanceRequest.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    console.error("Error fetching maintenance request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { status, priority, notes } = data;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (status === "COMPLETED") updateData.completedAt = new Date();

    const maintenanceRequest = await db.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
      },
    });

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    console.error("Error updating maintenance request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.maintenanceRequest.delete({ where: { id } });

    return NextResponse.json({ message: "Request deleted" });
  } catch (error) {
    console.error("Error deleting maintenance request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
