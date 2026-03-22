export interface Module {
  id: string;
  name: string;
  abbreviation: string;
}

export interface MediaItem {
  id: string;
  title: string;
  imageUrl: string | null;
  mediaType: "MODULE CARD" | "WAYPOINT CARD" | "SUPPORTING MEDIA" | null;
  waypointId: string | null;
  moduleId: string | null;
  moduleName: string | null;
  iteration: number | null;
  disciplines: string[];
  explorations: string[];
  experimentations: string[];
  deploymentType: "ALPHA" | "BETA" | "LIVE" | "NOMAD" | null;
  date: string | null;
  externalLink: string | null;
}

export interface PositionedItem extends MediaItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasState {
  tx: number;
  ty: number;
  scale: number;
  isDragging: boolean;
}

export interface FilterState {
  moduleId: string | null;
  waypointId: string | null;
  searchQuery: string;
}
