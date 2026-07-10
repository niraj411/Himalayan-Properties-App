// Rent / payment receipt. One page, one payment. Pure — all data is passed in
// by the route handler.
import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import { styles, colors, money, Letterhead, Footer, Field, View, Text } from "./theme";
import type { Company } from "./theme";

export interface RentReceiptData {
  company: Company;
  receiptNo: string;
  paidOn: string;
  amount: number;
  method?: string | null;
  reference?: string | null;
  notes?: string | null;
  tenantName: string;
  tenantEmail?: string | null;
  premises: string;
  appliedTo?: string | null; // e.g. "August Rent" if allocated to a charge
  generatedOn: string;
}

const methodLabel = (m?: string | null) =>
  ({ BANK_TRANSFER: "Bank transfer", CHECK: "Check", CASH: "Cash", OTHER: "Other" }[m ?? ""] ?? (m || "—"));

export function RentReceipt(d: RentReceiptData) {
  return (
    <Document title={`Receipt ${d.receiptNo}`} author={d.company.name}>
      <Page size="LETTER" style={styles.page}>
        <Letterhead company={d.company} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={styles.docKicker}>Payment Receipt</Text>
            <Text style={styles.docTitle}>Rent Receipt</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>Receipt No.</Text>
            <Text style={[styles.value, styles.strong]}>{d.receiptNo}</Text>
          </View>
        </View>

        {/* amount hero */}
        <View
          style={{
            marginTop: 18,
            backgroundColor: colors.ink,
            borderRadius: 10,
            paddingVertical: 18,
            paddingHorizontal: 22,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase", color: "#b9b3cc" }}>
              Amount received
            </Text>
            <Text style={{ fontSize: 26, fontFamily: "Helvetica-Bold", color: "#ffffff", marginTop: 2 }}>
              {money(d.amount)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase", color: "#b9b3cc" }}>Paid</Text>
            <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#ffffff", marginTop: 3 }}>{d.paidOn}</Text>
          </View>
        </View>

        <View style={styles.metaWrap}>
          <View style={styles.metaCol}>
            <Field label="Received from">{d.tenantName}</Field>
            {d.tenantEmail ? <Field label="Email">{d.tenantEmail}</Field> : null}
            <Field label="Property">{d.premises}</Field>
          </View>
          <View style={styles.metaCol}>
            <Field label="Payment method">{methodLabel(d.method)}</Field>
            {d.reference ? <Field label="Reference">{d.reference}</Field> : null}
            {d.appliedTo ? <Field label="Applied to">{d.appliedTo}</Field> : null}
          </View>
        </View>

        {d.notes ? (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Text style={{ marginTop: 3 }}>{d.notes}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 26, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 }}>
          <Text style={{ fontSize: 9, color: colors.muted }}>
            This receipt confirms the payment shown above was received and credited to the tenant account. Please retain
            for your records. Balances are maintained in the tenant portal.
          </Text>
        </View>

        <Footer company={d.company} generatedOn={d.generatedOn} />
      </Page>
    </Document>
  );
}
