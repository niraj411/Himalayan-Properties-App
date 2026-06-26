"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { utilityTypeLabel } from "@/lib/utilities";
import {
  Plug, Trash2, Zap, Droplets, Waves, Flame, Home, Wifi,
  Phone, ExternalLink,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { CardListSkeleton } from "@/components/ui/skeletons";

interface Utility {
  id: string;
  type: string;
  providerName: string | null;
  phone: string | null;
  website: string | null;
  tenantNotes: string | null;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  TRASH: Trash2, ELECTRIC: Zap, WATER: Droplets, SEWER: Waves,
  GAS: Flame, HOA: Home, INTERNET: Wifi, OTHER: Plug,
};

export default function TenantUtilitiesPage() {
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUtilities = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/utilities?scope=tenant");
      if (!response.ok) throw new Error();
      setUtilities(await response.json());
    } catch (err) {
      console.error("Error fetching utilities:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilities();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilities</h1>
          <p className="text-slate-500 mt-1">
            Service providers and important info for your home.
          </p>
        </div>
        <CardListSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilities</h1>
          <p className="text-slate-500 mt-1">
            Service providers and important info for your home.
          </p>
        </div>
        <ErrorState message="We couldn't load this page." onRetry={fetchUtilities} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Utilities</h1>
        <p className="text-slate-500 mt-1">
          Service providers and important info for your home.
        </p>
      </div>

      {utilities.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plug className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No utility info posted yet
            </h3>
            <p className="text-slate-500 text-center">
              Contact your property manager for details.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {utilities.map((utility) => {
            const Icon = TYPE_ICONS[utility.type] ?? Plug;
            return (
              <Card key={utility.id} className="border-0 shadow-sm rounded-xl">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {utilityTypeLabel(utility.type)}
                      </h3>
                      {utility.providerName && (
                        <p className="text-sm text-slate-500">{utility.providerName}</p>
                      )}
                    </div>
                  </div>

                  {(utility.phone || utility.website) && (
                    <div className="space-y-2">
                      {utility.phone && (
                        <a href={`tel:${utility.phone}`}
                           className="flex items-center gap-2 text-sm text-primary hover:text-primary">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{utility.phone}</span>
                        </a>
                      )}
                      {utility.website && (
                        <a href={utility.website} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 text-sm text-primary hover:text-primary break-all">
                          <ExternalLink className="h-4 w-4 shrink-0" />
                          <span>{utility.website}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {utility.tenantNotes && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700 whitespace-pre-line">
                        {utility.tenantNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
