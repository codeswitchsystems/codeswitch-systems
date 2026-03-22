"use client";

import { useState } from "react";
import { PositionedItem } from "@/lib/types";

interface MediaTileProps {
  item: PositionedItem;
  onClick: () => void;
}

export default function MediaTile({ item, onClick }: MediaTileProps) {
  const [hovered, setHovered] = useState(false);

  const isCard = item.mediaType === "MODULE CARD" || item.mediaType === "WAYPOINT CARD";

  if (!item.imageUrl && !isCard) {
    // Placeholder for items without images
    return (
      <div
        onClick={onClick}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 3,
          background: "rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 8,
            fontWeight: 700,
            color: "rgba(0,0,0,0.15)",
            letterSpacing: "0.1em",
          }}
        >
          {item.waypointId || item.title || "MEDIA"}
        </span>
      </div>
    );
  }

  if (item.imageUrl) {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 3,
          overflow: "hidden",
          cursor: "pointer",
          transform: hovered ? "scale(1.03)" : "scale(1)",
          transition: "transform 0.2s ease",
          position: "relative",
        }}
      >
        <img
          src={item.imageUrl}
          alt={item.title || ""}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {/* External link indicator */}
        {item.externalLink && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // Card without image - render as dark card with text
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 3,
        background: "#0a0a0a",
        cursor: "pointer",
        transform: hovered ? "scale(1.03)" : "scale(1)",
        transition: "transform 0.2s ease",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
        userSelect: "none",
      }}
    >
      <div
        style={{
          fontFamily: "'Roboto Mono', monospace",
          fontSize: 7,
          fontWeight: 700,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.12em",
        }}
      >
        {item.waypointId || ""}
      </div>
      <div
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: item.mediaType === "MODULE CARD" ? 14 : 11,
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "0.04em",
        }}
      >
        {item.title || item.moduleName || ""}
      </div>
      {item.mediaType === "MODULE CARD" && (
        <div
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 7,
            fontWeight: 700,
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.1em",
            marginTop: 4,
          }}
        >
          {item.moduleName === "CODE-SWITCH®↗KUZI" ? "PROOF OF PASSAGE" : item.deploymentType || ""}
        </div>
      )}
    </div>
  );
}
