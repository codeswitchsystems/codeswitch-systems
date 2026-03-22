import { fetchAllMedia, fetchModules } from "@/lib/notion";
import { computeLayout } from "@/lib/correlation";
import Canvas from "@/components/Canvas";

export const dynamic = "force-dynamic";

export default async function Home() {
  let modules: Awaited<ReturnType<typeof fetchModules>> = [];
  let positionedItems: ReturnType<typeof computeLayout> = [];

  try {
    const [fetchedModules, media] = await Promise.all([
      fetchModules(),
      fetchAllMedia(),
    ]);
    modules = fetchedModules;
    positionedItems = computeLayout(media, modules);
  } catch (error) {
    console.error("Failed to fetch data from Notion:", error);
  }

  return (
    <main style={{ width: "100%", height: "100vh" }}>
      <Canvas items={positionedItems} modules={modules} />
    </main>
  );
}
