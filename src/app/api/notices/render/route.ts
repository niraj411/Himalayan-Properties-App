import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderNotice, type NoticeType, type NoticeContext } from "@/lib/notices";
import { chargeRemaining } from "@/lib/ledger";

const LANDLORD_NAME = "Himalayan Holding Property LLC";
const LANDLORD_ADDRESS = "884 Dakota Lane, Erie, CO 80516";

// POST /api/notices/render -> { subject, body, toEmail } for the given lease + type
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leaseId, type, cureDays } = await request.json();
  if (!leaseId || !type) {
    return NextResponse.json({ error: "Missing leaseId or type" }, { status: 400 });
  }

  const lease = await db.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenant: { include: { user: true } },
      unit: { include: { property: true } },
      charges: { where: { status: "OPEN" }, orderBy: { dueDate: "asc" } },
    },
  });
  if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 });

  const p = lease.unit.property;
  const premises = `${p.address}, Unit ${lease.unit.unitNumber}, ${p.city}, ${p.state} ${p.zip}`;
  const openCharges = lease.charges.map((c) => ({
    label: c.label,
    amount: chargeRemaining(c),
  }));
  const totalDue = openCharges.reduce((s, c) => s + c.amount, 0);
  const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const commencementDate = lease.startDate
    ? new Date(lease.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const ctx: NoticeContext = {
    landlordName: LANDLORD_NAME,
    landlordAddress: LANDLORD_ADDRESS,
    tenantName: lease.tenant.user.name,
    premises,
    commencementDate,
    openCharges,
    totalDue,
    todayStr,
    cureDays: cureDays ? Number(cureDays) : undefined,
  };

  const { subject, body } = renderNotice(type as NoticeType, ctx);
  return NextResponse.json({ subject, body, toEmail: lease.tenant.user.email, totalDue });
}
