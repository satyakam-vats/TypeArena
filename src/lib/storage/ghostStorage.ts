import type { TestSettings } from "../../types/typing";

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
  return [
    settings.mode,
    settings.value,
    settings.wordSourceId,
    settings.punctuation ? "p" : "",
    settings.numbers ? "n" : "",
    settings.quoteLength || "",
  ].join("_");
}

export function getAllGhosts(): Record<string, GhostReplay> {
  try {
    const data = localStorage.getItem(GHOSTS_STORAGE_KEY);
    if (!data) return {};
    return JSON.parse(data);
  } catch {
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
    } catch {
      /* ignore quota */
    }
  }
}

export function getGhostReplay(settings: TestSettings): GhostReplay | null {
  const ghosts = getAllGhosts();
  return ghosts[getSettingsKey(settings)] || null;
}

export function deleteGhost(settingsKey: string): void {
  const ghosts = getAllGhosts();
  if (ghosts[settingsKey]) {
    delete ghosts[settingsKey];
    try {
      localStorage.setItem(GHOSTS_STORAGE_KEY, JSON.stringify(ghosts));
    } catch {
      /* ignore */
    }
  }
}
