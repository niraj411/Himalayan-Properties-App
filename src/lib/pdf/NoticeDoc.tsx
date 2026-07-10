// Notice letter (late / demand / CO demand). Renders the exact notice body that
// was emailed, verbatim, in a monospace face so the dot-leader charge table
// stays aligned — legal fidelity matters here. Adds a brand letterhead + record
// metadata for printing and service.
import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import { styles, colors, Letterhead, Footer, View, Text } from "./theme";
import type { Company } from "./theme";

export interface NoticeDocData {
  company: Company;
  kicker: string; // e.g. "Demand for Payment"
  subject: string;
  body: string; // verbatim, includes \n
  toEmail: string;
  sentOn: string;
  status: string; // SENT / FAILED
  generatedOn: string;
}

export function NoticeDoc(d: NoticeDocData) {
  return (
    <Document title={d.subject || "Notice"} author={d.company.name}>
      <Page size="LETTER" style={styles.page}>
        <Letterhead company={d.company} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ width: "68%" }}>
            <Text style={styles.docKicker}>{d.kicker}</Text>
            <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: colors.ink, marginTop: 3 }}>
              {d.subject}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>Delivered to</Text>
            <Text style={styles.value}>{d.toEmail}</Text>
            <Text style={[styles.label, { marginTop: 5 }]}>
              {d.status === "SENT" ? "Sent" : "Status"}
            </Text>
            <Text style={styles.value}>{d.status === "SENT" ? d.sentOn : d.status}</Text>
          </View>
        </View>

        <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14 }}>
          <Text style={{ fontFamily: "Courier", fontSize: 8.5, lineHeight: 1.5, color: colors.ink }}>{d.body}</Text>
        </View>

        <Footer company={d.company} generatedOn={d.generatedOn} />
      </Page>
    </Document>
  );
}
