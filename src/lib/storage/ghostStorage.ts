import { TestSettings } from "../../types/typing";

export type GhostReplay = {
  settingsKey: string;
  targetText: string;
  samples: { elapsedMs: number; charIndex: number }[];
  finalWpm: number;
  completedAt: number;
};

const GHOSTS_STORAGE_KEY = "typearena_ghosts_v1";
const MAX_GHOSTS = 20;

export function getSettingsKey(settings: TestSettings): string {
  return `${settings.mode}_${settings.value}_${settings.wordSourceId}`;
}

export function getAllGhosts(): Record<string, GhostReplay> {
  try {
    const data = localStorage.getItem(GHOSTS_STORAGE_KEY);
    if (!data) return {};
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to parse ghosts from storage", err);
    return {};
  }
}

export function saveGhostReplay(settings: TestSettings, replay: GhostReplay): void {
  const ghosts = getAllGhosts();
  const key = getSettingsKey(settings);
  replay.settingsKey = key;

  const existingGhost = ghosts[key];
  if (!existingGhost || replay.finalWpm > existingGhost.finalWpm) {
    ghosts[key] = replay;
    
    // Enforce max 20 ghosts, remove oldest if needed
    const keys = Object.keys(ghosts);
    if (keys.length > MAX_GHOSTS) {
      const sortedKeys = keys.sort((a, b) => ghosts[a].completedAt - ghosts[b].completedAt);
      while (sortedKeys.length > MAX_GHOSTS) {
        const keyToRemove = sortedKeys.shift();
        if (keyToRemove) delete ghosts[keyToRemove];
      }
    }
    
    try {
      localStorage.setItem(GHOSTS_STORAGE_KEY, JSON.stringify(ghosts));
    } catch (err) {
      console.error("Failed to save ghost replay", err);
    }
  }
}

export function getGhostReplay(settings: TestSettings): GhostReplay | null {
  const ghosts = getAllGhosts();
  const key = getSettingsKey(settings);
  return ghosts[key] || null;
}

export function deleteGhost(settingsKey: string): void {
  const ghosts = getAllGhosts();
  if (ghosts[settingsKey]) {
    delete ghosts[settingsKey];
    try {
      localStorage.setItem(GHOSTS_STORAGE_KEY, JSON.stringify(ghosts));
    } catch (err) {
      console.error("Failed to delete ghost replay", err);
    }
  }
}
