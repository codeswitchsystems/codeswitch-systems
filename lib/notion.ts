import { Client } from "@notionhq/client";
import { Module, MediaItem } from "./types";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

function getTextProperty(properties: any, name: string): string | null {
  const prop = properties[name];
  if (!prop) return null;
  if (prop.type === "title") {
    return prop.title?.[0]?.plain_text || null;
  }
  if (prop.type === "rich_text") {
    return prop.rich_text?.[0]?.plain_text || null;
  }
  return null;
}

function getSelectProperty(properties: any, name: string): string | null {
  const prop = properties[name];
  if (!prop || prop.type !== "select") return null;
  return prop.select?.name || null;
}

function getNumberProperty(properties: any, name: string): number | null {
  const prop = properties[name];
  if (!prop || prop.type !== "number") return null;
  return prop.number;
}

function getDateProperty(properties: any, name: string): string | null {
  const prop = properties[name];
  if (!prop || prop.type !== "date" || !prop.date) return null;
  return prop.date.start || null;
}

function getUrlProperty(properties: any, name: string): string | null {
  const prop = properties[name];
  if (!prop || prop.type !== "url") return null;
  return prop.url || null;
}

function getFileProperty(properties: any, name: string): string | null {
  const prop = properties[name];
  if (!prop || prop.type !== "files" || !prop.files?.length) return null;
  const file = prop.files[0];
  if (file.type === "file") return file.file?.url || null;
  if (file.type === "external") return file.external?.url || null;
  return null;
}

function getRelationIds(properties: any, name: string): string[] {
  const prop = properties[name];
  if (!prop || prop.type !== "relation") return [];
  return prop.relation?.map((r: any) => r.id) || [];
}

export async function fetchModules(): Promise<Module[]> {
  const dbId = process.env.NOTION_MODULES_DB!;
  const response = await notion.databases.query({ database_id: dbId, page_size: 100 });

  return response.results.map((page: any) => ({
    id: page.id,
    name: getTextProperty(page.properties, "MODULE NAME") || "",
    abbreviation: getTextProperty(page.properties, "ABBREVIATION") || "",
  }));
}

async function fetchReferenceNames(dbId: string, ids: string[], titleField: string): Promise<string[]> {
  if (ids.length === 0) return [];
  const names: string[] = [];
  for (const id of ids) {
    try {
      const page = await notion.pages.retrieve({ page_id: id }) as any;
      const name = getTextProperty(page.properties, titleField);
      if (name) names.push(name);
    } catch {
      // skip if page not found
    }
  }
  return names;
}

export async function fetchAllMedia(): Promise<MediaItem[]> {
  const dbId = process.env.NOTION_MEDIA_DB!;
  const modules = await fetchModules();
  const moduleMap = new Map(modules.map((m) => [m.id, m]));

  let allResults: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const response: any = await notion.databases.query({
      database_id: dbId,
      page_size: 100,
      start_cursor: startCursor,
    });
    allResults = allResults.concat(response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor || undefined;
  }

  const items: MediaItem[] = [];

  for (const page of allResults) {
    const props = page.properties;

    const moduleRelIds = getRelationIds(props, "MODULE");
    const moduleId = moduleRelIds[0] || null;
    const mod = moduleId ? moduleMap.get(moduleId) : null;

    const disciplineIds = getRelationIds(props, "DISCIPLINES");
    const explorationIds = getRelationIds(props, "EXPLORATIONS");
    const experimentationIds = getRelationIds(props, "EXPERIMENTATIONS");

    const disciplines = await fetchReferenceNames(
      process.env.NOTION_DISCIPLINES_DB!,
      disciplineIds,
      "DISCIPLINE NAME"
    );
    const explorations = await fetchReferenceNames(
      process.env.NOTION_EXPLORATIONS_DB!,
      explorationIds,
      "EXPLORATION NAME"
    );
    const experimentations = await fetchReferenceNames(
      process.env.NOTION_EXPERIMENTATIONS_DB!,
      experimentationIds,
      "EXPERIMENTATION NAME"
    );

    items.push({
      id: page.id,
      title: getTextProperty(props, "TITLE") || "",
      imageUrl: getFileProperty(props, "MEDIA FILE"),
      mediaType: getSelectProperty(props, "MEDIA TYPE") as MediaItem["mediaType"],
      waypointId: getTextProperty(props, "WAYPOINT ID"),
      moduleId,
      moduleName: mod?.name || null,
      iteration: getNumberProperty(props, "ITERATION"),
      disciplines,
      explorations,
      experimentations,
      deploymentType: getSelectProperty(props, "DEPLOYMENT TYPE") as MediaItem["deploymentType"],
      date: getDateProperty(props, "DATE"),
      externalLink: getUrlProperty(props, "EXTERNAL LINK"),
    });
  }

  return items;
}

export async function fetchAllData() {
  const [modules, media] = await Promise.all([fetchModules(), fetchAllMedia()]);
  return { modules, media };
}
