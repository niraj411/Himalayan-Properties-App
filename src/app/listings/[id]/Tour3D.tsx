"use client";

import { useEffect, useState } from "react";
import { Film, Rotate3d } from "lucide-react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        exposure?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "rotation-per-second"?: string;
        "shadow-intensity"?: string;
        "camera-orbit"?: string;
        "touch-action"?: string;
        "interaction-prompt"?: string;
      };
    }
  }
}

interface Tour3DProps {
  videoUrl: string | null;
  modelUrl: string | null;
  poster?: string;
  labels: {
    heading: string;
    video: string;
    model: string;
    hint: string;
  };
}

export default function Tour3D({ videoUrl, modelUrl, poster, labels }: Tour3DProps) {
  const [tab, setTab] = useState<"video" | "model">(videoUrl ? "video" : "model");
  const [viewerReady, setViewerReady] = useState(false);

  useEffect(() => {
    if (!modelUrl) return;
    import("@google/model-viewer").then(() => setViewerReady(true));
  }, [modelUrl]);

  if (!videoUrl && !modelUrl) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-3xl font-bold text-on-surface tracking-tight">{labels.heading}</h2>
        {videoUrl && modelUrl && (
          <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 shadow-inner self-start sm:self-auto">
            <button
              onClick={() => setTab("video")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "video"
                  ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-ambient"
                  : "text-on-surface/60 hover:text-on-surface"
              }`}
            >
              <Film className="h-4 w-4" />
              {labels.video}
            </button>
            <button
              onClick={() => setTab("model")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "model"
                  ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-ambient"
                  : "text-on-surface/60 hover:text-on-surface"
              }`}
            >
              <Rotate3d className="h-4 w-4" />
              {labels.model}
            </button>
          </div>
        )}
      </div>

      {tab === "video" && videoUrl && (
        <div className="rounded-[2rem] overflow-hidden shadow-ambient bg-black">
          <video
            src={videoUrl}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            className="w-full aspect-video"
          />
        </div>
      )}

      {tab === "model" && modelUrl && (
        <div className="rounded-[2rem] overflow-hidden shadow-ambient bg-surface-container-low relative">
          {viewerReady ? (
            <>
              <model-viewer
                src={modelUrl}
                alt={labels.heading}
                camera-controls
                auto-rotate
                rotation-per-second="12deg"
                shadow-intensity="1"
                camera-orbit="35deg 78deg 105%"
                touch-action="pan-y"
                style={{ width: "100%", height: "28rem", display: "block" }}
              />
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-medium text-on-surface/60 bg-surface/80 backdrop-blur px-3 py-1.5 rounded-lg pointer-events-none">
                {labels.hint}
              </p>
            </>
          ) : (
            <div className="w-full h-[28rem] flex items-center justify-center">
              <Rotate3d className="h-10 w-10 text-primary/30 animate-pulse" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
