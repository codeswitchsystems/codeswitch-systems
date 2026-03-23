"use client";

import { useState, useEffect } from "react";
import Canvas from "@/components/Canvas";

export default function Home() {
    const [data, setData] = useState({ items: [], modules: [] });
    const [loading, setLoading] = useState(true);

  useEffect(() => {
        fetch("/api/data")
          .then((res) => res.json())
          .then((d) => { setData(d); setLoading(false); })
          .catch(() => setLoading(false));
  }, []);

  if (loading) {
        return (
                <main style={{ width: "100%", height: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.2)", letterSpacing: "0.15em" }}>
                                      LOADING...
                          </span>span>
                </main>main>
              );
  }

  return (
        <main style={{ width: "100%", height: "100vh" }}>
                <Canvas items={data.items} modules={data.modules} />
        </main>main>
      );
}
