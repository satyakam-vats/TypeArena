import React, { createContext, useContext, useEffect, useState } from "react";
import { soundManager } from "../lib/sound";

type SoundState = {
  enabled: boolean;
  volume: number;
};

type SoundContextType = SoundState & {
  toggleSound: () => void;
  setVolume: (volume: number) => void;
};

const defaultState: SoundState = {
  enabled: false,
  volume: 0.5,
};

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SoundState>(() => {
    try {
      const stored = localStorage.getItem("typearena_sound_prefs");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem("typearena_sound_prefs", JSON.stringify(state));
    soundManager.setEnabled(state.enabled);
    soundManager.setVolume(state.volume);
  }, [state]);

  const toggleSound = () => {
    setState(prev => {
      const enabled = !prev.enabled;
      if (enabled) {
        soundManager.setEnabled(true);
        soundManager.playClick();
      }
      return { ...prev, enabled };
    });
  };

  const setVolumeLevel = (volume: number) => {
    setState(prev => ({ ...prev, volume }));
  };

  return (
    <SoundContext.Provider value={{ ...state, toggleSound, setVolume: setVolumeLevel }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSound must be used within a SoundProvider");
  return context;
}
