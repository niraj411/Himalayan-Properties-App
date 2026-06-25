import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTenantEmail } from "@/lib/email";

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
    const { status, priority, notes, contractor, repairCost, paymentMethod, paymentAccount } = data;

    // Load existing request so we can detect the transition into COMPLETED
    const existing = await db.maintenanceRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const cost =
      repairCost === undefined || repairCost === null || repairCost === ""
        ? null
        : Number(repairCost);
    if (cost !== null && (isNaN(cost) || cost < 0)) {
      return NextResponse.json({ error: "Invalid repair cost" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (contractor !== undefined) updateData.contractor = contractor || null;
    if (repairCost !== undefined) updateData.repairCost = cost;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod || null;
    if (paymentAccount !== undefined) updateData.paymentAccount = paymentAccount || null;
    if (status === "COMPLETED" && !existing.completedAt) updateData.completedAt = new Date();

    // When a request is completed with a cost, log it as a PAID maintenance
    // charge against the tenant's active lease — but only once (guard on
    // chargeId). The charge creation and the request update run in one
    // transaction so we never create a charge without linking it back.
    const maintenanceRequest = await db.$transaction(async (tx) => {
      if (status === "COMPLETED" && cost && cost > 0 && !existing.chargeId) {
        const lease = await tx.lease.findFirst({
          where: { unitId: existing.unitId, tenantId: existing.tenantId, status: "ACTIVE" },
          orderBy: { startDate: "desc" },
        });
        // Fall back to the most recent lease on the unit if no active tenant match
        const targetLease =
          lease ||
          (await tx.lease.findFirst({
            where: { unitId: existing.unitId },
            orderBy: { startDate: "desc" },
          }));

        if (targetLease) {
          const labelContractor = (contractor ?? existing.contractor) || "";
          const charge = await tx.charge.create({
            data: {
              leaseId: targetLease.id,
              kind: "MAINTENANCE",
              amount: cost,
              amountPaid: cost,
              label: labelContractor ? `${existing.title} — ${labelContractor}` : existing.title,
              status: "PAID",
              source: (paymentMethod ?? existing.paymentMethod) || null,
              notes: (notes ?? existing.notes) || null,
              paidDate: new Date(),
            },
          });
          updateData.chargeId = charge.id;
        }
      }

      return tx.maintenanceRequest.update({
        where: { id },
        data: updateData,
        include: {
          tenant: { include: { user: true } },
          unit: { include: { property: true } },
        },
      });
    });

    // Email tenant on status change
    if (status) {
      try {
        const tenantUser = maintenanceRequest.tenant.user;
        const statusLabel: Record<string, string> = {
          IN_PROGRESS: "In Progress",
          COMPLETED: "Completed",
          CANCELLED: "Cancelled",
          OPEN: "Open",
        };
        await sendTenantEmail({
          tenantName: tenantUser.name,
          tenantEmail: tenantUser.email,
          subject: `Maintenance Update: ${maintenanceRequest.title}`,
          body: `Your maintenance request "${maintenanceRequest.title}" has been updated to: ${statusLabel[status] || status}.${notes ? `\n\nNote from management: ${notes}` : ""}`,
        });
      } catch (emailErr) {
        console.error("Failed to send maintenance email:", emailErr);
      }
    }

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
