"use client";

import { useRef, useEffect } from "react";
import { Module } from "@/lib/types";

interface GlassToolbarProps {
  modules: Module[];
  activeFilter: string | null;
  showSearch: boolean;
  showSort: boolean;
  searchQuery: string;
  onHome: () => void;
  onToggleSearch: () => void;
  onToggleSort: () => void;
  onFilter: (moduleId: string | null) => void;
  onSearch: (query: string) => void;
}

export default function GlassToolbar({
  modules,
  activeFilter,
  showSearch,
  showSort,
  searchQuery,
  onHome,
  onToggleSearch,
  onToggleSort,
  onFilter,
  onSearch,
}: GlassToolbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSearch]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {/* Sort/Filter pills */}
      {showSort && (
        <div
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "0.5px solid rgba(0,0,0,0.08)",
            borderRadius: 12,
            padding: "8px 12px",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 500,
            pointerEvents: "auto",
          }}
        >
          <PillButton
            label="ALL"
            active={!activeFilter}
            onClick={() => onFilter(null)}
          />
          {modules.map((mod) => (
            <PillButton
              key={mod.id}
              label={mod.abbreviation || mod.name}
              active={activeFilter === mod.id}
              onClick={() => onFilter(mod.id)}
            />
          ))}
        </div>
      )}

      {/* Main toolbar */}
      <div
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "0.5px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          padding: "10px 24px",
          display: "flex",
          gap: showSearch ? 12 : 24,
          alignItems: "center",
          pointerEvents: "auto",
          transition: "all 0.3s ease",
        }}
      >
        {/* Home */}
        <ToolbarButton onClick={onHome}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="3" x2="12" y2="21" />
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
          {!showSearch && <ToolbarLabel>HOME</ToolbarLabel>}
        </ToolbarButton>

        <Separator />

        {/* Search */}
        <ToolbarButton onClick={onToggleSearch}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          {!showSearch && <ToolbarLabel>SEARCH</ToolbarLabel>}
        </ToolbarButton>

        {/* Inline search field */}
        {showSearch && (
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value.toUpperCase())}
            placeholder="WAYPOINT ID..."
            style={{
              background: "rgba(0,0,0,0.04)",
              border: "0.5px solid rgba(0,0,0,0.1)",
              borderRadius: 8,
              padding: "6px 12px",
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: "#0a0a0a",
              letterSpacing: "0.08em",
              outline: "none",
              width: 180,
              textTransform: "uppercase",
            }}
            onPointerDown={(e) => e.stopPropagation()}
          />
        )}

        <Separator />

        {/* Sort */}
        <ToolbarButton onClick={onToggleSort}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="1.8">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          {!showSearch && <ToolbarLabel>SORT</ToolbarLabel>}
        </ToolbarButton>

        <Separator />

        {/* Duty Free */}
        <a
          href="https://dutyfree.systems"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ToolbarButton>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            {!showSearch && <ToolbarLabel>DUTY FREE</ToolbarLabel>}
          </ToolbarButton>
        </a>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {children}
    </div>
  );
}

function ToolbarLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "'Roboto Mono', monospace",
        fontSize: 7,
        fontWeight: 700,
        color: "#0a0a0a",
        letterSpacing: "0.1em",
      }}
    >
      {children}
    </span>
  );
}

function Separator() {
  return (
    <div
      style={{
        width: 0.5,
        height: 20,
        background: "rgba(0,0,0,0.1)",
      }}
    />
  );
}

function PillButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.02)",
        border: `0.5px solid ${active ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.06)"}`,
        borderRadius: 8,
        padding: "5px 12px",
        fontFamily: "'Roboto Mono', monospace",
        fontSize: 9,
        fontWeight: 700,
        color: "#0a0a0a",
        letterSpacing: "0.1em",
        cursor: "pointer",
        userSelect: "none",
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}
