// Shared loader that turns a leaseId into a rendered TenantStatement document,
// so both the admin per-lease route and the tenant self-serve route stay in
// sync. Auth is the caller's responsibility.
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { chargeRemaining, openBalance, round2 } from "@/lib/ledger";
import { TenantStatement, type StatementCharge, type StatementPayment } from "@/lib/pdf/TenantStatement";
import { loadCompany } from "@/lib/pdf/company";
import { dateFmt } from "@/lib/pdf/theme";

export interface StatementDoc {
  doc: ReactElement<DocumentProps>;
  filename: string;
  lease: { tenantId: string; coTenantIds: string[] };
}

export async function loadStatementDoc(leaseId: string): Promise<StatementDoc | null> {
  const lease = await db.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenant: { include: { user: true } },
      coTenants: true,
      unit: { include: { property: true } },
      charges: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
      payments: { orderBy: { date: "asc" } },
    },
  });
  if (!lease) return null;

  const company = await loadCompany();
  const p = lease.unit.property;
  const premises = `${p.address}, Unit ${lease.unit.unitNumber}, ${p.city}, ${p.state} ${p.zip}`;

  const charges: StatementCharge[] = lease.charges.map((ch) => ({
    dueDate: ch.dueDate,
    label: ch.label,
    kind: ch.kind,
    amount: ch.amount,
    amountPaid: ch.amountPaid,
    remaining: chargeRemaining(ch),
    status: ch.status,
  }));
  const payments: StatementPayment[] = lease.payments.map((pm) => ({
    date: pm.date,
    method: pm.method,
    reference: pm.reference,
    amount: pm.amount,
  }));

  const totalCharged = round2(
    lease.charges.filter((c) => c.status !== "WAIVED").reduce((s, c) => s + c.amount, 0),
  );
  const totalPaid = round2(lease.payments.reduce((s, pm) => s + pm.amount, 0));

  const doc = TenantStatement({
    company,
    statementDate: dateFmt(new Date()),
    tenantName: lease.tenant.user.name,
    tenantEmail: lease.tenant.user.email,
    premises,
    leaseTerm: `${dateFmt(lease.startDate)} to ${dateFmt(lease.endDate)}`,
    monthlyRent: lease.monthlyRent,
    charges,
    payments,
    balance: openBalance(lease.charges),
    totalCharged,
    totalPaid,
    generatedOn: dateFmt(new Date()),
  });

  const short = lease.tenant.user.name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  return {
    doc,
    filename: `statement-${short}-${leaseId.slice(-6)}.pdf`,
    lease: { tenantId: lease.tenantId, coTenantIds: lease.coTenants.map((t) => t.id) },
  };
}
