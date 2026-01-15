"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calculator,
  Loader2,
  Link2,
  Link2Off,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Building2,
} from "lucide-react";

interface QBStatus {
  connected: boolean;
  companyName?: string;
}

interface Transaction {
  Id: string;
  TxnDate: string;
  TotalAmt: number;
  CustomerRef?: { name: string };
  PrivateNote?: string;
}

interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

function CallbackHandler({ onConnected }: { onConnected: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "true") {
      toast.success("QuickBooks connected successfully!");
      window.history.replaceState({}, "", "/admin/accounting");
      onConnected();
    } else if (error) {
      toast.error("Failed to connect to QuickBooks");
      window.history.replaceState({}, "", "/admin/accounting");
    }
  }, [searchParams, onConnected]);

  return null;
}

function AccountingContent() {
  const [qbStatus, setQbStatus] = useState<QBStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const loadReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const response = await fetch("/api/quickbooks/reports");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.recentTransactions || []);

        if (data.profitAndLoss?.Rows?.Row) {
          const rows = data.profitAndLoss.Rows.Row;
          let income = 0;
          let expenses = 0;

          rows.forEach((row: { group?: string; Summary?: { ColData?: { value?: string }[] } }) => {
            if (row.group === "Income" && row.Summary?.ColData?.[1]?.value) {
              income = parseFloat(row.Summary.ColData[1].value) || 0;
            }
            if (row.group === "Expenses" && row.Summary?.ColData?.[1]?.value) {
              expenses = parseFloat(row.Summary.ColData[1].value) || 0;
            }
          });

          setSummary({
            totalIncome: income,
            totalExpenses: expenses,
            netIncome: income - expenses,
          });
        }
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  const checkQBStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/quickbooks/status");
      if (response.ok) {
        const status = await response.json();
        setQbStatus(status);
        if (status.connected) {
          loadReports();
        }
      }
    } catch (error) {
      console.error("Error checking QB status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadReports]);

  useEffect(() => {
    checkQBStatus();
  }, [checkQBStatus]);

  const handleConnected = useCallback(() => {
    checkQBStatus();
  }, [checkQBStatus]);

  const connectToQuickBooks = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/quickbooks/connect");
      if (response.ok) {
        const { authUri } = await response.json();
        window.location.href = authUri;
      } else {
        toast.error("Failed to initiate QuickBooks connection");
        setIsConnecting(false);
      }
    } catch {
      toast.error("Something went wrong");
      setIsConnecting(false);
    }
  };

  const disconnectQuickBooks = async () => {
    if (!confirm("Are you sure you want to disconnect QuickBooks?")) return;

    try {
      const response = await fetch("/api/quickbooks/disconnect", { method: "POST" });
      if (response.ok) {
        setQbStatus({ connected: false });
        setTransactions([]);
        setSummary(null);
        toast.success("QuickBooks disconnected");
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <CallbackHandler onConnected={handleConnected} />
      </Suspense>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounting</h1>
          <p className="text-slate-500 mt-1">QuickBooks integration and financial reports</p>
        </div>
        {qbStatus?.connected && (
          <Button
            variant="outline"
            onClick={loadReports}
            disabled={isLoadingReports}
          >
            {isLoadingReports ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        )}
      </div>

      {/* QuickBooks Connection Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Calculator className="h-4 w-4 text-green-600" />
              </div>
              QuickBooks Online
            </CardTitle>
            {qbStatus?.connected ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-100">
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {qbStatus?.connected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{qbStatus.companyName}</p>
                  <p className="text-sm text-slate-500">Sync payments and view reports</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={disconnectQuickBooks}
              >
                <Link2Off className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-slate-600">
                  Connect your QuickBooks account to sync payments and access financial reports.
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  You&apos;ll be redirected to QuickBooks to authorize the connection.
                </p>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={connectToQuickBooks}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect QuickBooks
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary - only show when connected */}
      {qbStatus?.connected && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Income (MTD)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      ${summary?.totalIncome?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Expenses (MTD)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      ${summary?.totalExpenses?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Net Income (MTD)</p>
                    <p className={`text-2xl font-bold mt-1 ${(summary?.netIncome || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${summary?.netIncome?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingReports ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <DollarSign className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p>No recent transactions</p>
                  <p className="text-sm mt-1">Transactions will appear here once synced</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Memo</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => (
                      <TableRow key={txn.Id}>
                        <TableCell className="text-slate-600">
                          {format(new Date(txn.TxnDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {txn.CustomerRef?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-slate-500 max-w-xs truncate">
                          {txn.PrivateNote || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600 font-medium">
                            ${txn.TotalAmt?.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <a href="https://qbo.intuit.com" target="_blank" rel="noopener noreferrer">
                    <Calculator className="h-5 w-5 mr-3 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium">Open QuickBooks</p>
                      <p className="text-xs text-slate-500">Go to QuickBooks Online</p>
                    </div>
                  </a>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3" asChild>
                  <a href="/admin/payments">
                    <DollarSign className="h-5 w-5 mr-3 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium">Record Payment</p>
                      <p className="text-xs text-slate-500">Add and sync payments</p>
                    </div>
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={loadReports}
                  disabled={isLoadingReports}
                >
                  <RefreshCw className={`h-5 w-5 mr-3 text-slate-600 ${isLoadingReports ? "animate-spin" : ""}`} />
                  <div className="text-left">
                    <p className="font-medium">Sync Data</p>
                    <p className="text-xs text-slate-500">Refresh from QuickBooks</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Not Connected State - Show helpful info */}
      {!qbStatus?.connected && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calculator className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Connect QuickBooks to Get Started</h3>
            <p className="text-slate-500 text-center mb-4 max-w-md">
              Link your QuickBooks Online account to view financial reports, sync rent payments, and manage your property accounting in one place.
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={connectToQuickBooks}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect QuickBooks
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AccountingPage() {
  return <AccountingContent />;
}
