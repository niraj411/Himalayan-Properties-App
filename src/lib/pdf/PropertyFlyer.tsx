// Printable listing flyer ("tape to the property"): hero photo, price/beds/baths
// strip, highlights, and a QR that opens the public listing. Its own richer
// StyleSheet rather than the document letterhead. Pure — route resolves images
// to data URIs and passes them in.
import React from "react";
import { Document, Page, StyleSheet } from "@react-pdf/renderer";
import { colors, money, View, Text, Image } from "./theme";
import type { Company } from "./theme";

export interface PropertyFlyerData {
  company: Company;
  headline: string;
  addressLine: string;
  price?: number | null;
  priceLabel?: string;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  typeLabel: string;
  description?: string | null;
  highlights: string[];
  heroSrc?: string;
  thumbs: string[];
  qrSrc?: string;
  listingUrl: string;
  phone?: string | null;
  availability?: string;
  generatedOn: string;
}

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", color: colors.body, fontSize: 10 },
  top: {
    backgroundColor: colors.primary,
    color: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { flexDirection: "row", alignItems: "center" },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 5,
    marginRight: 8,
  },
  brandName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  brandSub: { fontSize: 7, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.75)" },
  forrent: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 1 },
  hero: { height: 250, width: "100%", objectFit: "cover" },
  heroPlaceholder: { height: 250, width: "100%", backgroundColor: "#e9e5f2" },
  cap: { paddingHorizontal: 34, paddingTop: 16 },
  badge: {
    alignSelf: "flex-start",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.primary,
    backgroundColor: "#ede9fe",
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 4,
    marginBottom: 8,
  },
  h1: { fontSize: 26, fontFamily: "Helvetica-Bold", color: colors.ink },
  addr: { fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginTop: 4 },
  specs: {
    marginTop: 16,
    marginHorizontal: 34,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    overflow: "hidden",
  },
  price: { backgroundColor: colors.ink, paddingVertical: 12, paddingHorizontal: 20, justifyContent: "center" },
  priceVal: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  priceLbl: { fontSize: 7.5, letterSpacing: 1, textTransform: "uppercase", color: "#b9b3cc", marginTop: 2 },
  specCells: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  spec: { alignItems: "center" },
  specVal: { fontSize: 17, fontFamily: "Helvetica-Bold", color: colors.ink },
  specLbl: { fontSize: 7.5, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginTop: 2 },
  body: { flexDirection: "row", marginTop: 18, paddingHorizontal: 34 },
  left: { width: "58%", paddingRight: 20 },
  thumbs: { flexDirection: "row", marginBottom: 12 },
  thumb: { width: "48%", height: 92, objectFit: "cover", borderRadius: 6, marginRight: "4%" },
  lead: { fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.primary, marginBottom: 6 },
  desc: { fontSize: 9.5, lineHeight: 1.5, color: colors.body },
  hl: { marginTop: 10, flexDirection: "row", flexWrap: "wrap" },
  hlItem: { width: "50%", flexDirection: "row", marginBottom: 5, paddingRight: 6 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 4, marginRight: 6 },
  hlText: { fontSize: 9, color: colors.ink, flex: 1 },
  right: {
    width: "42%",
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  scanLbl: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1.4, textTransform: "uppercase", color: colors.muted },
  scanBig: { fontSize: 13, fontFamily: "Helvetica-Bold", color: colors.ink, textAlign: "center", marginTop: 4, marginBottom: 10 },
  qr: { width: 150, height: 150, backgroundColor: "#ffffff", padding: 8, borderRadius: 10 },
  qrPlaceholder: { width: 150, height: 150, backgroundColor: "#ede9fe", borderRadius: 10 },
  url: { fontSize: 8, color: colors.muted, marginTop: 10, textAlign: "center" },
  contact: {
    marginTop: 18,
    marginHorizontal: 34,
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  callLbl: { fontSize: 7.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#b9b3cc" },
  callVal: { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#ffffff", marginTop: 2 },
  callSite: { fontSize: 9, color: "#b9b3cc" },
  gen: { textAlign: "center", fontSize: 7, color: colors.muted, marginTop: 14 },
});

export function PropertyFlyer(d: PropertyFlyerData) {
  const initial = (d.company.name || "H").trim().charAt(0).toUpperCase();
  return (
    <Document title={`For Rent — ${d.headline}`} author={d.company.name}>
      <Page size="LETTER" style={s.page}>
        <View style={s.top}>
          <View style={s.brand}>
            <Text style={s.mark}>{initial}</Text>
            <View>
              <Text style={s.brandName}>{d.company.name}</Text>
              <Text style={s.brandSub}>Property Management</Text>
            </View>
          </View>
          <Text style={s.forrent}>FOR RENT</Text>
        </View>

        {d.heroSrc ? <Image src={d.heroSrc} style={s.hero} /> : <View style={s.heroPlaceholder} />}

        <View style={s.cap}>
          {d.availability ? <Text style={s.badge}>{d.availability}</Text> : null}
          <Text style={s.h1}>{d.headline}</Text>
          <Text style={s.addr}>{d.addressLine}</Text>
        </View>

        <View style={s.specs}>
          <View style={s.price}>
            <Text style={s.priceVal}>{d.price ? money(d.price) : "Call"}</Text>
            <Text style={s.priceLbl}>{d.priceLabel || "per month"}</Text>
          </View>
          <View style={s.specCells}>
            <View style={s.spec}>
              <Text style={s.specVal}>{d.beds ?? "—"}</Text>
              <Text style={s.specLbl}>Bedrooms</Text>
            </View>
            <View style={s.spec}>
              <Text style={s.specVal}>{d.baths ?? "—"}</Text>
              <Text style={s.specLbl}>Bathrooms</Text>
            </View>
            <View style={s.spec}>
              <Text style={s.specVal}>{d.sqft ? d.sqft.toLocaleString() : d.typeLabel}</Text>
              <Text style={s.specLbl}>{d.sqft ? "Sq Ft" : "Type"}</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          <View style={s.left}>
            {d.thumbs.length > 0 ? (
              <View style={s.thumbs}>
                {d.thumbs.slice(0, 2).map((t, i) => (
                  <Image key={i} src={t} style={s.thumb} />
                ))}
              </View>
            ) : null}
            <Text style={s.lead}>Bright, updated &amp; move-in ready</Text>
            {d.description ? <Text style={s.desc}>{d.description}</Text> : null}
            {d.highlights.length > 0 ? (
              <View style={s.hl}>
                {d.highlights.map((h, i) => (
                  <View key={i} style={s.hlItem}>
                    <View style={s.dot} />
                    <Text style={s.hlText}>{h}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={s.right}>
            <Text style={s.scanLbl}>Point your camera</Text>
            <Text style={s.scanBig}>Scan to see photos &amp; apply</Text>
            {d.qrSrc ? (
              <Image src={d.qrSrc} style={s.qr} />
            ) : (
              <View style={s.qrPlaceholder} />
            )}
            <Text style={s.url}>{d.listingUrl}</Text>
          </View>
        </View>

        <View style={s.contact}>
          <View>
            <Text style={s.callLbl}>Call or text to schedule a showing</Text>
            <Text style={s.callVal}>{d.phone || d.company.phone || d.listingUrl}</Text>
          </View>
          <Text style={s.callSite}>{d.company.name}</Text>
        </View>

        <Text style={s.gen}>Generated {d.generatedOn}</Text>
      </Page>
    </Document>
  );
}
