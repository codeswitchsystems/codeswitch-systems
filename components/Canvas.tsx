"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PositionedItem, Module } from "@/lib/types";
import { filterLayout } from "@/lib/correlation";
import MediaTile from "./MediaTile";
import GlassToolbar from "./GlassToolbar";
import Lightbox from "./Lightbox";

interface CanvasProps {
  items: PositionedItem[];
  modules: Module[];
}

export default function Canvas({ items, modules }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<PositionedItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const dragRef = useRef({
    startX: 0, startY: 0,
    lastX: 0, lastY: 0,
    lastTime: 0,
    vx: 0, vy: 0,
    didDrag: false,
  });
  const animRef = useRef<number>(0);

  // Determine visible items based on filter
  const visibleItems = activeFilter || searchQuery
    ? filterLayout(items, {
        moduleId: activeFilter,
        searchQuery: searchQuery || undefined,
      })
    : items;

  // Pan: pointer down
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      setDragging(true);
      const d = dragRef.current;
      d.startX = e.clientX - tx;
      d.startY = e.clientY - ty;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.lastTime = Date.now();
      d.vx = 0;
      d.vy = 0;
      d.didDrag = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    },
    [tx, ty]
  );

  // Pan: pointer move
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const d = dragRef.current;
      const now = Date.now();
      const dt = now - d.lastTime || 1;
      const newTx = e.clientX - d.startX;
      const newTy = e.clientY - d.startY;
      d.vx = ((e.clientX - d.lastX) / dt) * 16;
      d.vy = ((e.clientY - d.lastY) / dt) * 16;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.lastTime = now;

      if (Math.abs(e.clientX - (d.startX + tx)) > 5 || Math.abs(e.clientY - (d.startY + ty)) > 5) {
        d.didDrag = true;
      }

      setTx(newTx);
      setTy(newTy);
    },
    [dragging, tx, ty]
  );

  // Momentum drift after release
  const drift = useCallback(() => {
    const d = dragRef.current;
    const friction = 0.94;
    const step = () => {
      d.vx *= friction;
      d.vy *= friction;
      setTx((prev) => prev + d.vx);
      setTy((prev) => prev + d.vy);
      if (Math.abs(d.vx) > 0.1 || Math.abs(d.vy) > 0.1) {
        animRef.current = requestAnimationFrame(step);
      }
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  // Pan: pointer up
  const onPointerUp = useCallback(() => {
    setDragging(false);
    drift();
  }, [drift]);

  // Zoom: scroll wheel (desktop only)
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      setScale((prev) => Math.min(Math.max(prev * delta, 0.3), 2.5));
    },
    []
  );

  // Home: reset view
  const handleHome = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setTx(0);
    setTy(0);
    setScale(1);
    setActiveFilter(null);
    setSearchQuery("");
    setShowSearch(false);
    setShowSort(false);
  }, []);

  // Filter by module
  const handleFilter = useCallback(
    (moduleId: string | null) => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setActiveFilter(moduleId);
      setTx(0);
      setTy(0);
      setScale(1);
      setShowSort(false);
    },
    []
  );

  // Search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query) {
      setTx(0);
      setTy(0);
    }
  }, []);

  // Handle item click (only if we didn't drag)
  const handleItemClick = useCallback(
    (item: PositionedItem) => {
      if (dragRef.current.didDrag) return;

      if (item.externalLink) {
        window.open(item.externalLink, "_blank");
        return;
      }

      // If it's a module card, filter by that module
      if (item.mediaType === "MODULE CARD" && item.moduleId) {
        handleFilter(item.moduleId);
        return;
      }

      // Otherwise open lightbox
      if (item.imageUrl) {
        setLightboxItem(item);
      }
    },
    [handleFilter]
  );

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        if (dragging) {
          setDragging(false);
          drift();
        }
      }}
      onWheel={onWheel}
      style={{
        width: "100%",
        height: "100%",
        background: "#ffffff",
        overflow: "hidden",
        cursor: dragging ? "grabbing" : "grab",
        position: "relative",
        touchAction: "pan-x pan-y",
      }}
    >
      {/* Canvas layer */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "0 0",
          transition: dragging ? "none" : "transform 0.05s linear",
        }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: item.x,
              top: item.y,
              width: item.width,
              height: item.height,
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            <MediaTile item={item} onClick={() => handleItemClick(item)} />
          </div>
        ))}

        {/* Empty state */}
        {visibleItems.length === 0 && (
          <div
            style={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(0,0,0,0.2)",
              letterSpacing: "0.15em",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            {searchQuery ? "NO RESULTS" : "ADD MEDIA IN NOTION TO BEGIN"}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <GlassToolbar
        modules={modules}
        activeFilter={activeFilter}
        showSearch={showSearch}
        showSort={showSort}
        searchQuery={searchQuery}
        onHome={handleHome}
        onToggleSearch={() => { setShowSearch(!showSearch); setShowSort(false); }}
        onToggleSort={() => { setShowSort(!showSort); setShowSearch(false); }}
        onFilter={handleFilter}
        onSearch={handleSearch}
      />

      {/* Lightbox */}
      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </div>
  );
}
