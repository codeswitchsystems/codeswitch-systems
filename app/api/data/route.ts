import { NextResponse } from "next/server";
import { fetchAllMedia, fetchModules } from "@/lib/notion";
import { computeLayout } from "@/lib/correlation";

export async function GET() {
    try {
          const [modules, media] = await Promise.all([
                  fetchModules(),
                  fetchAllMedia(),
                ]);
          const items = computeLayout(media, modules);
          return NextResponse.json({ modules, items });
        } catch (error) {
          console.error("Notion fetch error:", error);
          return NextResponse.json({ modules: [], items: [] });
        }
  }
