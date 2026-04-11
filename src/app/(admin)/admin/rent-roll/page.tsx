"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Building2, Home, Store, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface UnitRow {
  id: string;
  unitNumber: string;
  status: string;
  rent: number;
  tenantName: string | null;
  leaseId: string | null;
  paidThisMonth: boolean;
  paidAmount: number;
  lastPaymentDate: string | null;
}

interface PropertyRow {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  totalUnits: number;
  occupiedUnits: number;
  expectedRent: number;
  collectedRent: number;
  variance: number;
  mortgageLender: string | null;
  mortgageMonthlyPayment: number;
  mortgageDueDay: number | null;
  mortgageBalance: number | null;
  netIncome: number;
  units: UnitRow[];
}

interface RentRollData {
  month: string;
  summary: {
    totalExpected: number;
    totalCollected: number;
    totalMortgage: number;
    netIncome: number;
  };
  properties: PropertyRow[];
}

export default function RentRollPage() {
  const [data, setData] = useState<RentRollData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rent-roll")
      .then((r) => r.json())
      .then((d) => { setData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#4f17ce]" />
      </div>
    );
  }

  if (!data) return null;

  const monthLabel = format(new Date(data.month), "MMMM yyyy");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1b1c1e]" style={{ letterSpacing: "-0.02em" }}>
          Rent Roll
        </h1>
        <p className="text-slate-500 mt-1">{monthLabel} — Portfolio financial snapshot</p>
      </div>

      {/* Summary banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#4f17ce] to-[#673de6] p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-purple-200 text-sm mb-1">Expected Rent</p>
            <p className="text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
              ${data.summary.totalExpected.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-purple-200 text-sm mb-1">Collected</p>
            <p className="text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
              ${data.summary.totalCollected.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-purple-200 text-sm mb-1">Total Mortgage</p>
            <p className="text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
              ${data.summary.totalMortgage.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-purple-200 text-sm mb-1">Net Income</p>
            <p
              className={`text-3xl font-bold ${data.summary.netIncome < 0 ? "text-red-300" : "text-white"}`}
              style={{ letterSpacing: "-0.02em" }}
            >
              ${data.summary.netIncome.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Per-property sections */}
      {data.properties.map((property) => (
        <div key={property.id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 40px 40px -10px rgba(27,28,30,0.06)" }}>
          {/* Property header */}
          <div className="p-6 bg-[#f5f3f5]">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${property.type === "COMMERCIAL" ? "bg-purple-100" : "bg-blue-100"}`}>
                  {property.type === "COMMERCIAL" ? (
                    <Store className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Home className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-[#1b1c1e] text-lg" style={{ letterSpacing: "-0.01em" }}>
                    {property.name}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {property.address}, {property.city}, {property.state} &nbsp;·&nbsp; {property.occupiedUnits}/{property.totalUnits} occupied
                  </p>
                </div>
              </div>

              {/* Financials */}
              <div className="flex flex-wrap gap-4 text-right">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Expected</p>
                  <p className="font-semibold text-[#1b1c1e]">${property.expectedRent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Collected</p>
                  <p className={`font-semibold ${property.collectedRent >= property.expectedRent ? "text-green-600" : "text-amber-600"}`}>
                    ${property.collectedRent.toLocaleString()}
                  </p>
                </div>
                {property.mortgageMonthlyPayment > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">
                      Mortgage{property.mortgageLender ? ` · ${property.mortgageLender}` : ""}
                    </p>
                    <p className="font-semibold text-slate-600">
                      -${property.mortgageMonthlyPayment.toLocaleString()}
                      {property.mortgageDueDay ? <span className="font-normal text-slate-400 text-xs"> due {property.mortgageDueDay}{ordinal(property.mortgageDueDay)}</span> : ""}
                    </p>
                    {property.mortgageBalance && (
                      <p className="text-xs text-slate-400">${property.mortgageBalance.toLocaleString()} remaining</p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Net</p>
                  <p className={`font-bold ${property.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${property.netIncome.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Units */}
          <div className="divide-y divide-[#cac3d8]/15">
            {property.units.map((unit, i) => (
              <div
                key={unit.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 ${i % 2 === 0 ? "bg-white" : "bg-[#faf9fb]"}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-[#1b1c1e] w-16">#{unit.unitNumber}</span>
                  <div>
                    <p className="text-sm text-[#1b1c1e]">{unit.tenantName || <span className="text-slate-400">Vacant</span>}</p>
                    <p className="text-xs text-slate-400">${unit.rent.toLocaleString()}/mo</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right ml-20 sm:ml-0">
                  {unit.status === "OCCUPIED" && unit.leaseId ? (
                    <>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Paid this month</p>
                        <p className="text-sm font-medium text-[#1b1c1e]">
                          {unit.paidAmount > 0 ? `$${unit.paidAmount.toLocaleString()}` : "—"}
                        </p>
                      </div>
                      {unit.lastPaymentDate && (
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Last payment</p>
                          <p className="text-sm text-slate-600">
                            {format(new Date(unit.lastPaymentDate), "MMM d")}
                          </p>
                        </div>
                      )}
                      <div>
                        {unit.paidThisMonth ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-400" />
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs px-2.5 py-1 bg-[#f5f3f5] rounded-lg text-slate-500">
                      {unit.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Variance row */}
          {property.expectedRent > 0 && (
            <div className="px-6 py-3 bg-[#e9e8ea] flex items-center justify-end gap-2">
              {property.variance === 0 ? (
                <Minus className="h-4 w-4 text-slate-500" />
              ) : property.variance > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${property.variance >= 0 ? "text-green-700" : "text-red-600"}`}>
                {property.variance >= 0 ? "+" : ""}${property.variance.toLocaleString()} variance
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
