import { MediaItem, PositionedItem, Module } from "./types";

const TILE_BASE_WIDTH = 160;
const TILE_GAP = 10;
const MODULE_RADIUS_BASE = 400;
const MODULE_RADIUS_GROWTH = 60;

// Deployment stage ordering: alpha closest to centre, live furthest
const DEPLOYMENT_ORDER: Record<string, number> = {
  ALPHA: 0,
  BETA: 1,
  LIVE: 2,
  NOMAD: 3,
};

// Calculate correlation score between two media items (0 = unrelated, higher = more related)
function correlationScore(a: MediaItem, b: MediaItem): number {
  let score = 0;

  // Module match: strongest gravity (weight: 10)
  if (a.moduleId && b.moduleId && a.moduleId === b.moduleId) {
    score += 10;
  }

  // Waypoint ID match: tightest grouping (weight: 8)
  if (a.waypointId && b.waypointId && a.waypointId === b.waypointId) {
    score += 8;
  }

  // Shared disciplines: positions modules relative to each other (weight: 3 per shared)
  const sharedDisciplines = a.disciplines.filter((d) => b.disciplines.includes(d));
  score += sharedDisciplines.length * 3;

  // Shared explorations: fine-tunes within clusters (weight: 1.5 per shared)
  const sharedExplorations = a.explorations.filter((e) => b.explorations.includes(e));
  score += sharedExplorations.length * 1.5;

  // Shared experimentations: fine-tunes within clusters (weight: 1.5 per shared)
  const sharedExperimentations = a.experimentations.filter((e) =>
    b.experimentations.includes(e)
  );
  score += sharedExperimentations.length * 1.5;

  return score;
}

// Generate pseudo-random but deterministic dimensions for a tile based on its id
function tileDimensions(id: string): { width: number; height: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const widthVariation = 0.8 + (Math.abs(hash % 50) / 100); // 0.8 - 1.3
  const aspectRatio = 0.7 + (Math.abs((hash >> 8) % 60) / 100); // 0.7 - 1.3
  const width = Math.round(TILE_BASE_WIDTH * widthVariation);
  const height = Math.round(width * aspectRatio);
  return { width, height };
}

// Assign angular positions to modules based on discipline similarity
function assignModuleAngles(modules: Module[], media: MediaItem[]): Map<string, number> {
  const angleMap = new Map<string, number>();
  const moduleIds = modules.map((m) => m.id);

  if (moduleIds.length === 0) return angleMap;

  // Get discipline profile for each module
  const moduleProfiles = new Map<string, Set<string>>();
  for (const mod of modules) {
    const disciplines = new Set<string>();
    media
      .filter((m) => m.moduleId === mod.id)
      .forEach((m) => m.disciplines.forEach((d) => disciplines.add(d)));
    moduleProfiles.set(mod.id, disciplines);
  }

  // Sort modules so those with similar disciplines are adjacent
  const sorted = [...moduleIds];
  // Simple greedy ordering: start with first, always pick most similar next
  const ordered: string[] = [sorted[0]];
  const remaining = new Set(sorted.slice(1));

  while (remaining.size > 0) {
    const last = ordered[ordered.length - 1];
    const lastProfile = moduleProfiles.get(last) || new Set();
    let bestId = "";
    let bestOverlap = -1;

    for (const candidateId of remaining) {
      const candidateProfile = moduleProfiles.get(candidateId) || new Set();
      let overlap = 0;
      for (const d of lastProfile) {
        if (candidateProfile.has(d)) overlap++;
      }
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestId = candidateId;
      }
    }

    if (bestId) {
      ordered.push(bestId);
      remaining.delete(bestId);
    }
  }

  // Distribute evenly around the circle
  const step = (2 * Math.PI) / ordered.length;
  ordered.forEach((id, i) => {
    angleMap.set(id, i * step);
  });

  return angleMap;
}

// Main layout function
export function computeLayout(
  media: MediaItem[],
  modules: Module[]
): PositionedItem[] {
  if (media.length === 0) return [];

  const positioned: PositionedItem[] = [];
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];

  // Find the centre waypoint (CODE-SWITCH®↗KUZI)
  const centreModule = modules.find(
    (m) => m.name === "CODE-SWITCH®↗KUZI" || m.abbreviation === "CSS"
  );

  // Separate media types
  const moduleCards = media.filter((m) => m.mediaType === "MODULE CARD");
  const waypointCards = media.filter((m) => m.mediaType === "WAYPOINT CARD");
  const supportingMedia = media.filter(
    (m) => m.mediaType === "SUPPORTING MEDIA" || !m.mediaType
  );

  // Get centre card
  const centreCard = moduleCards.find(
    (m) => centreModule && m.moduleId === centreModule.id
  );

  // Assign module angles
  const otherModules = modules.filter((m) => m.id !== centreModule?.id);
  const moduleAngles = assignModuleAngles(otherModules, media);

  // Check for overlap with existing items
  function overlaps(x: number, y: number, w: number, h: number): boolean {
    for (const o of occupied) {
      if (
        x < o.x + o.w + TILE_GAP &&
        x + w + TILE_GAP > o.x &&
        y < o.y + o.h + TILE_GAP &&
        y + h + TILE_GAP > o.y
      ) {
        return true;
      }
    }
    return false;
  }

  // Place an item near a target position, spiralling outward if occupied
  function placeNear(
    item: MediaItem,
    targetX: number,
    targetY: number,
    dims?: { width: number; height: number }
  ): PositionedItem {
    const { width, height } = dims || tileDimensions(item.id);
    let x = targetX - width / 2;
    let y = targetY - height / 2;

    // Spiral outward to find open space
    let radius = 0;
    let angle = 0;
    const step = TILE_GAP + 2;
    let attempts = 0;

    while (overlaps(x, y, width, height) && attempts < 500) {
      radius += step * 0.15;
      angle += 0.8;
      x = targetX - width / 2 + Math.cos(angle) * radius;
      y = targetY - height / 2 + Math.sin(angle) * radius;
      attempts++;
    }

    occupied.push({ x, y, w: width, h: height });
    return { ...item, x, y, width, height };
  }

  // 1. Place centre card at origin
  if (centreCard) {
    const dims = { width: 320, height: 100 };
    positioned.push(placeNear(centreCard, 0, 0, dims));
  }

  // 2. Place module cards at their angular positions
  for (const mod of otherModules) {
    const card = moduleCards.find((m) => m.moduleId === mod.id);
    const angle = moduleAngles.get(mod.id) || 0;

    // Count items in this module to determine radius
    const moduleItemCount = media.filter((m) => m.moduleId === mod.id).length;
    const radius = MODULE_RADIUS_BASE + moduleItemCount * MODULE_RADIUS_GROWTH;

    const mx = Math.cos(angle) * radius;
    const my = Math.sin(angle) * radius;

    if (card) {
      const dims = { width: 240, height: 80 };
      positioned.push(placeNear(card, mx, my, dims));
    }

    // 3. Place waypoint cards for this module near the module card
    const moduleWaypoints = waypointCards.filter((w) => w.moduleId === mod.id);
    moduleWaypoints.forEach((wp, i) => {
      const wpAngle = angle + ((i - moduleWaypoints.length / 2) * 0.3);
      const wpRadius = radius + 150 + i * 80;
      const wx = Math.cos(wpAngle) * wpRadius;
      const wy = Math.sin(wpAngle) * wpRadius;
      const dims = { width: 240, height: 80 };
      positioned.push(placeNear(wp, wx, wy, dims));
    });

    // 4. Place supporting media for this module
    const moduleMedia = supportingMedia.filter((m) => m.moduleId === mod.id);

    // Sort by deployment stage (alpha closest, live furthest)
    moduleMedia.sort((a, b) => {
      const aOrder = a.deploymentType ? DEPLOYMENT_ORDER[a.deploymentType] ?? 2 : 2;
      const bOrder = b.deploymentType ? DEPLOYMENT_ORDER[b.deploymentType] ?? 2 : 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Secondary sort by date
      if (a.date && b.date) return a.date.localeCompare(b.date);
      return 0;
    });

    moduleMedia.forEach((item, i) => {
      // Find the closest waypoint this item belongs to
      const matchingWaypoint = item.waypointId
        ? positioned.find(
            (p) => p.waypointId === item.waypointId && p.mediaType === "WAYPOINT CARD"
          )
        : null;

      let targetX: number;
      let targetY: number;

      if (matchingWaypoint) {
        // Place near its waypoint
        const spreadAngle = angle + ((i - moduleMedia.length / 2) * 0.15);
        const dist = 80 + i * 30;
        targetX = matchingWaypoint.x + matchingWaypoint.width / 2 + Math.cos(spreadAngle) * dist;
        targetY = matchingWaypoint.y + matchingWaypoint.height / 2 + Math.sin(spreadAngle) * dist;
      } else {
        // Place near the module centre, further out based on deployment stage
        const deployDist = (DEPLOYMENT_ORDER[item.deploymentType || "LIVE"] || 2) * 80;
        const spreadAngle = angle + ((i - moduleMedia.length / 2) * 0.2);
        const dist = radius + 100 + deployDist + i * 20;
        targetX = Math.cos(spreadAngle) * dist;
        targetY = Math.sin(spreadAngle) * dist;
      }

      positioned.push(placeNear(item, targetX, targetY));
    });
  }

  // 5. Place centre module's own content near the centre
  if (centreModule) {
    const centreWaypoints = waypointCards.filter((w) => w.moduleId === centreModule.id);
    centreWaypoints.forEach((wp, i) => {
      const angle = (i / centreWaypoints.length) * 2 * Math.PI;
      const dist = 200 + i * 60;
      positioned.push(
        placeNear(wp, Math.cos(angle) * dist, Math.sin(angle) * dist, {
          width: 240,
          height: 80,
        })
      );
    });

    const centreMedia = supportingMedia.filter((m) => m.moduleId === centreModule.id);
    centreMedia.forEach((item, i) => {
      const angle = (i / centreMedia.length) * 2 * Math.PI;
      const dist = 250 + i * 40;
      positioned.push(placeNear(item, Math.cos(angle) * dist, Math.sin(angle) * dist));
    });
  }

  // 6. Place unaffiliated media (no module) based on discipline correlation
  const unaffiliated = supportingMedia.filter((m) => !m.moduleId);
  unaffiliated.forEach((item) => {
    // Find the most correlated positioned item
    let bestMatch: PositionedItem | null = null;
    let bestScore = 0;

    for (const p of positioned) {
      const score = correlationScore(item, p);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = p;
      }
    }

    if (bestMatch) {
      positioned.push(
        placeNear(item, bestMatch.x + bestMatch.width + 20, bestMatch.y)
      );
    } else {
      // Random position if no correlation found
      const angle = Math.random() * 2 * Math.PI;
      const dist = 300 + Math.random() * 400;
      positioned.push(
        placeNear(item, Math.cos(angle) * dist, Math.sin(angle) * dist)
      );
    }
  });

  return positioned;
}

// Filter positioned items by module or waypoint
export function filterLayout(
  items: PositionedItem[],
  filter: { moduleId?: string | null; waypointId?: string | null; searchQuery?: string }
): PositionedItem[] {
  let filtered = items;

  if (filter.moduleId) {
    filtered = filtered.filter((item) => item.moduleId === filter.moduleId);
  }

  if (filter.waypointId) {
    filtered = filtered.filter((item) => item.waypointId === filter.waypointId);
  }

  if (filter.searchQuery) {
    const q = filter.searchQuery.toUpperCase();
    filtered = filtered.filter(
      (item) =>
        item.waypointId?.toUpperCase().includes(q) ||
        item.title?.toUpperCase().includes(q) ||
        item.moduleName?.toUpperCase().includes(q)
    );
  }

  // Re-layout filtered items centred around origin
  if (filter.moduleId || filter.waypointId || filter.searchQuery) {
    const recentred: PositionedItem[] = [];
    const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];

    // Find anchor item (module card or waypoint card)
    const anchor = filtered.find(
      (f) => f.mediaType === "MODULE CARD" || f.mediaType === "WAYPOINT CARD"
    );

    if (anchor) {
      // Place anchor at centre
      const anchorCentred = { ...anchor, x: -anchor.width / 2, y: -anchor.height / 2 };
      recentred.push(anchorCentred);
      occupied.push({ x: anchorCentred.x, y: anchorCentred.y, w: anchor.width, h: anchor.height });

      // Place rest around it
      const rest = filtered.filter((f) => f.id !== anchor.id);
      rest.forEach((item, i) => {
        const angle = (i / rest.length) * 2 * Math.PI;
        let radius = 150;
        let x = Math.cos(angle) * radius - item.width / 2;
        let y = Math.sin(angle) * radius - item.height / 2;

        let attempts = 0;
        while (attempts < 200) {
          let hasOverlap = false;
          for (const o of occupied) {
            if (
              x < o.x + o.w + TILE_GAP &&
              x + item.width + TILE_GAP > o.x &&
              y < o.y + o.h + TILE_GAP &&
              y + item.height + TILE_GAP > o.y
            ) {
              hasOverlap = true;
              break;
            }
          }
          if (!hasOverlap) break;
          radius += 8;
          x = Math.cos(angle) * radius - item.width / 2;
          y = Math.sin(angle) * radius - item.height / 2;
          attempts++;
        }

        occupied.push({ x, y, w: item.width, h: item.height });
        recentred.push({ ...item, x, y });
      });

      return recentred;
    }
  }

  return filtered;
}
