import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
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
import { format } from "date-fns";
import { CreditCard, Building, DollarSign, Clock, AlertCircle } from "lucide-react";

async function getPaymentData(tenantId: string) {
  const [settings, payments] = await Promise.all([
    db.settings.findFirst(),
    db.payment.findMany({
      where: {
        lease: {
          tenantId,
        },
      },
      include: {
        lease: {
          include: {
            unit: { include: { property: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  return { settings, payments };
}

export default async function TenantPaymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    redirect("/login");
  }

  const { settings, payments } = await getPaymentData(session.user.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-slate-500 mt-1">View payment information and history</p>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Online Payments Coming Soon</h2>
              <p className="text-blue-100">
                We&apos;re working on adding online payment options. For now, please use the payment
                methods below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bank Transfer */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5 text-blue-600" />
              Bank Transfer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.bankName ? (
              <>
                <div>
                  <p className="text-sm text-slate-500">Bank Name</p>
                  <p className="font-medium text-slate-900">{settings.bankName}</p>
                </div>
                {settings.bankRoutingNumber && (
                  <div>
                    <p className="text-sm text-slate-500">Routing Number</p>
                    <p className="font-mono font-medium text-slate-900">
                      {settings.bankRoutingNumber}
                    </p>
                  </div>
                )}
                {settings.bankAccountNumber && (
                  <div>
                    <p className="text-sm text-slate-500">Account Number</p>
                    <p className="font-mono font-medium text-slate-900">
                      {settings.bankAccountNumber}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <AlertCircle className="h-4 w-4" />
                <p>Bank details not configured yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check Mailing */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-green-600" />
              Mail a Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.checkMailingAddress ? (
              <>
                <div>
                  <p className="text-sm text-slate-500">Mailing Address</p>
                  <p className="font-medium text-slate-900 whitespace-pre-line">
                    {settings.checkMailingAddress}
                  </p>
                </div>
                {settings.paymentInstructions && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">{settings.paymentInstructions}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <AlertCircle className="h-4 w-4" />
                <p>Mailing address not configured yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No payment history yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-green-600 font-medium">
                        <DollarSign className="h-4 w-4" />
                        {payment.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100">
                        {payment.method === "BANK_TRANSFER"
                          ? "Bank Transfer"
                          : payment.method === "CHECK"
                          ? "Check"
                          : payment.method === "CASH"
                          ? "Cash"
                          : payment.method || "Other"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{payment.reference || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
