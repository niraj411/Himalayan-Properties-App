// Tenant account statement / ledger for one lease: charges, payments, running
// balance. Multi-page safe (tables wrap). Pure — route loads and passes data.
import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import { styles, colors, money, dateFmt, Letterhead, Footer, Field, Pill, View, Text } from "./theme";
import type { Company } from "./theme";

export interface StatementCharge {
  dueDate: Date | string | null;
  label: string;
  kind: string;
  amount: number;
  amountPaid: number;
  remaining: number;
  status: string; // OPEN / PAID / WAIVED
}
export interface StatementPayment {
  date: Date | string;
  method?: string | null;
  reference?: string | null;
  amount: number;
}
export interface TenantStatementData {
  company: Company;
  statementDate: string;
  tenantName: string;
  tenantEmail?: string | null;
  premises: string;
  leaseTerm: string;
  monthlyRent: number;
  charges: StatementCharge[];
  payments: StatementPayment[];
  balance: number;
  totalCharged: number;
  totalPaid: number;
  generatedOn: string;
}

const statusTone = (s: string): "green" | "amber" | "red" | "muted" =>
  s === "PAID" ? "green" : s === "WAIVED" ? "muted" : "red";

// flex columns
const c = {
  date: { width: "16%" },
  desc: { width: "40%" },
  amt: { width: "15%", textAlign: "right" as const },
  paid: { width: "15%", textAlign: "right" as const },
  bal: { width: "14%", textAlign: "right" as const },
};
const p = {
  date: { width: "20%" },
  method: { width: "28%" },
  ref: { width: "37%" },
  amt: { width: "15%", textAlign: "right" as const },
};

export function TenantStatement(d: TenantStatementData) {
  return (
    <Document title="Account Statement" author={d.company.name}>
      <Page size="LETTER" style={styles.page}>
        <Letterhead company={d.company} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={styles.docKicker}>Account Statement</Text>
            <Text style={styles.docTitle}>Tenant Statement</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>Statement date</Text>
            <Text style={[styles.value, styles.strong]}>{d.statementDate}</Text>
          </View>
        </View>

        <View style={styles.metaWrap}>
          <View style={styles.metaCol}>
            <Field label="Tenant">{d.tenantName}</Field>
            {d.tenantEmail ? <Field label="Email">{d.tenantEmail}</Field> : null}
            <Field label="Premises">{d.premises}</Field>
          </View>
          <View style={styles.metaCol}>
            <Field label="Lease term">{d.leaseTerm}</Field>
            <Field label="Monthly rent">{money(d.monthlyRent)}</Field>
          </View>
        </View>

        {/* balance hero */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: d.balance > 0 ? "#fef2f2" : "#f0fdf4",
            borderWidth: 1,
            borderColor: d.balance > 0 ? "#fecaca" : "#bbf7d0",
            borderRadius: 10,
            padding: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase", color: colors.muted }}>
              {d.balance > 0 ? "Balance due" : "Account balance"}
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Helvetica-Bold",
                color: d.balance > 0 ? colors.red : colors.green,
                marginTop: 2,
              }}
            >
              {money(d.balance)}
            </Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <View style={{ alignItems: "flex-end", marginRight: 20 }}>
              <Text style={styles.label}>Total charged</Text>
              <Text style={[styles.value, styles.strong]}>{money(d.totalCharged)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Total paid</Text>
              <Text style={[styles.value, styles.strong]}>{money(d.totalPaid)}</Text>
            </View>
          </View>
        </View>

        {/* charges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charges</Text>
          <View style={styles.tHead}>
            <Text style={[styles.th, c.date]}>Due</Text>
            <Text style={[styles.th, c.desc]}>Description</Text>
            <Text style={[styles.th, c.amt]}>Amount</Text>
            <Text style={[styles.th, c.paid]}>Paid</Text>
            <Text style={[styles.th, c.bal]}>Balance</Text>
          </View>
          {d.charges.length === 0 ? (
            <View style={styles.tRow}>
              <Text style={[styles.td, { color: colors.muted }]}>No charges on record.</Text>
            </View>
          ) : (
            d.charges.map((ch, i) => (
              <View style={styles.tRow} key={i} wrap={false}>
                <Text style={[styles.td, c.date]}>{dateFmt(ch.dueDate)}</Text>
                <View style={c.desc}>
                  <Text style={styles.td}>{ch.label}</Text>
                  <View style={{ marginTop: 2 }}>
                    <Pill text={ch.status} tone={statusTone(ch.status)} />
                  </View>
                </View>
                <Text style={[styles.td, c.amt]}>{money(ch.amount)}</Text>
                <Text style={[styles.td, c.paid]}>{money(ch.amountPaid)}</Text>
                <Text style={[styles.td, c.bal, styles.strong]}>{money(ch.remaining)}</Text>
              </View>
            ))
          )}
        </View>

        {/* payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payments received</Text>
          <View style={styles.tHead}>
            <Text style={[styles.th, p.date]}>Date</Text>
            <Text style={[styles.th, p.method]}>Method</Text>
            <Text style={[styles.th, p.ref]}>Reference</Text>
            <Text style={[styles.th, p.amt]}>Amount</Text>
          </View>
          {d.payments.length === 0 ? (
            <View style={styles.tRow}>
              <Text style={[styles.td, { color: colors.muted }]}>No payments on record.</Text>
            </View>
          ) : (
            d.payments.map((pm, i) => (
              <View style={styles.tRow} key={i} wrap={false}>
                <Text style={[styles.td, p.date]}>{dateFmt(pm.date)}</Text>
                <Text style={[styles.td, p.method]}>{pm.method || "—"}</Text>
                <Text style={[styles.td, p.ref]}>{pm.reference || "—"}</Text>
                <Text style={[styles.td, p.amt, styles.strong]}>{money(pm.amount)}</Text>
              </View>
            ))
          )}
        </View>

        {d.company.paymentLink ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 9, color: colors.muted }}>
              Pay your balance online: {d.company.paymentLink}
            </Text>
          </View>
        ) : null}

        <Footer company={d.company} generatedOn={d.generatedOn} />
      </Page>
    </Document>
  );
}
