import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";

interface Props {
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
  title?: string;
  note?: string;
}

/** Formats a raw 10-digit US number as (510) 388-5124; anything else is shown as-is. */
export function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

/**
 * Tenant-facing landlord contact card with tap-to-call / tap-to-email links.
 * Renders nothing when neither a phone nor an email is configured in Settings.
 */
export function LandlordContact({
  phone,
  email,
  companyName,
  title = "Contact Your Landlord",
  note,
}: Props) {
  if (!phone && !email) return null;
  const digits = phone ? phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "") : "";
  const telHref = digits ? `tel:+1${digits}` : null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {companyName && <p className="text-sm text-on-surface-variant">{companyName}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          {phone && telHref && (
            <a
              href={telHref}
              className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-primary font-medium hover:bg-primary/15 transition-colors"
            >
              <Phone className="h-4 w-4" />
              {formatPhone(phone)}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-primary font-medium hover:bg-primary/15 transition-colors break-all"
            >
              <Mail className="h-4 w-4 shrink-0" />
              {email}
            </a>
          )}
        </div>
        {note && <p className="text-sm text-on-surface-variant">{note}</p>}
      </CardContent>
    </Card>
  );
}
