"use client";

import { useEffect } from "react";
import { PositionedItem } from "@/lib/types";

interface LightboxProps {
  item: PositionedItem;
  onClose: () => void;
}

export default function Lightbox({ item, onClose }: LightboxProps) {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!item.imageUrl) return null;

  return (
    <div
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        cursor: "zoom-out",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <img
        src={item.imageUrl}
        alt={item.title || ""}
        style={{
          maxWidth: "85vw",
          maxHeight: "80vh",
          borderRadius: 3,
          objectFit: "contain",
          animation: "scaleIn 0.3s ease",
        }}
      />
      {(item.title || item.waypointId) && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          {item.waypointId && (
            <span
              style={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(0,0,0,0.3)",
                letterSpacing: "0.12em",
              }}
            >
              {item.waypointId}
            </span>
          )}
          {item.title && (
            <span
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: 13,
                fontWeight: 900,
                color: "rgba(0,0,0,0.6)",
                letterSpacing: "0.04em",
              }}
            >
              {item.title}
            </span>
          )}
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
