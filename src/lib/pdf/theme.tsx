// Shared react-pdf building blocks: brand palette, styles, formatters, and the
// letterhead / footer used across every generated document. Pure and
// server-renderable (no db, no next/server) so document components can import it
// freely. Uses the built-in Helvetica family so nothing needs font files at
// runtime in the standalone build.
import React from "react";
import { StyleSheet, View, Text, Image } from "@react-pdf/renderer";

export const colors = {
  primary: "#7c3aed", // violet-600 (design-system primary)
  primaryDark: "#5b21b6", // violet-800
  ink: "#171523",
  body: "#3f3b52",
  muted: "#6b6780",
  line: "#e7e3ef",
  soft: "#faf9fc",
  green: "#15803d",
  amber: "#b45309",
  red: "#b91c1c",
};

export const money = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

export const dateFmt = (d: Date | string | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: colors.body,
    lineHeight: 1.45,
  },
  // letterhead
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "center" },
  mark: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.primary,
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 6,
    marginRight: 9,
  },
  brandName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: colors.ink },
  brandSub: { fontSize: 8, color: colors.muted, letterSpacing: 1.2, textTransform: "uppercase" },
  contact: { textAlign: "right", fontSize: 8.5, color: colors.muted, lineHeight: 1.5 },
  rule: { height: 2, backgroundColor: colors.primary, marginTop: 12, marginBottom: 18 },
  // doc title
  docKicker: { fontSize: 8.5, letterSpacing: 1.8, textTransform: "uppercase", color: colors.primary, fontFamily: "Helvetica-Bold" },
  docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: colors.ink, marginTop: 2 },
  // generic
  label: { fontSize: 7.5, letterSpacing: 1, textTransform: "uppercase", color: colors.muted },
  value: { fontSize: 10.5, color: colors.ink },
  strong: { fontFamily: "Helvetica-Bold", color: colors.ink },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.ink, marginBottom: 8 },
  // two-column meta card
  metaWrap: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  metaCol: { width: "48%" },
  metaItem: { marginBottom: 8 },
  // table
  tHead: {
    flexDirection: "row",
    backgroundColor: colors.soft,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  th: { fontSize: 8, letterSpacing: 0.6, textTransform: "uppercase", color: colors.muted, fontFamily: "Helvetica-Bold" },
  td: { fontSize: 9.5, color: colors.body },
  // footer
  footer: {
    position: "absolute",
    bottom: 26,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
    fontSize: 7.5,
    color: colors.muted,
  },
});

export interface Company {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  paymentLink?: string | null;
}

export function Letterhead({ company }: { company: Company }) {
  const initial = (company.name || "H").trim().charAt(0).toUpperCase();
  return (
    <View>
      <View style={styles.headRow}>
        <View style={styles.brandRow}>
          <Text style={styles.mark}>{initial}</Text>
          <View>
            <Text style={styles.brandName}>{company.name}</Text>
            <Text style={styles.brandSub}>Property Management</Text>
          </View>
        </View>
        <View style={styles.contact}>
          {company.address ? <Text>{company.address}</Text> : null}
          {company.phone ? <Text>{company.phone}</Text> : null}
          {company.email ? <Text>{company.email}</Text> : null}
        </View>
      </View>
      <View style={styles.rule} />
    </View>
  );
}

export function Footer({ company, generatedOn }: { company: Company; generatedOn: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        {company.name}
        {company.phone ? `  ·  ${company.phone}` : ""}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `Generated ${generatedOn}   ·   Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

// Small labelled field used across documents.
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{children}</Text>
    </View>
  );
}

// A status pill (OPEN / PAID / WAIVED etc.).
export function Pill({ text, tone }: { text: string; tone: "green" | "amber" | "red" | "muted" }) {
  const bg = { green: "#dcfce7", amber: "#fef3c7", red: "#fee2e2", muted: "#eceaf1" }[tone];
  const fg = { green: colors.green, amber: colors.amber, red: colors.red, muted: colors.muted }[tone];
  return (
    <Text
      style={{
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: fg,
        backgroundColor: bg,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
      }}
    >
      {text}
    </Text>
  );
}

export { View, Text, Image };
