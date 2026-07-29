import type { CompletedRun } from "../types/typing";

export async function generateShareCard(run: CompletedRun): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  // Colors
  const bgTop = "#191a18";
  const bgBottom = "#0a0a09";
  const accent = "#7fc4b9";
  const textMain = "#e9e4da";
  const textMuted = "#9d9a90";

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, bgTop);
  gradient.addColorStop(1, bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 400);

  // Top accent line
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 600, 4);

  // Border (subtle)
  ctx.strokeStyle = "#393a35";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 600, 400);

  // Fonts
  const fontMono = '"IBM Plex Mono", ui-monospace, monospace';
  
  // Branding
  ctx.fillStyle = textMuted;
  ctx.font = `14px ${fontMono}`;
  ctx.textAlign = "left";
  ctx.fillText("typearena", 30, 40);

  // WPM
  ctx.font = `400 110px ${fontMono}`;
  const wpmStr = run.metrics.wpm.toString();
  const wpmMetrics = ctx.measureText(wpmStr);
  const wpmWidth = wpmMetrics.width;

  ctx.font = `24px ${fontMono}`;
  const labelStr = "wpm";
  const labelMetrics = ctx.measureText(labelStr);
  const labelWidth = labelMetrics.width;

  const totalWidth = wpmWidth + 10 + labelWidth;
  const startX = 300 - (totalWidth / 2);

  ctx.fillStyle = accent;
  ctx.font = `400 110px ${fontMono}`;
  ctx.textAlign = "left";
  ctx.fillText(wpmStr, startX, 200);

  ctx.fillStyle = textMuted;
  ctx.font = `24px ${fontMono}`;
  ctx.fillText(labelStr, startX + wpmWidth + 10, 200);

  // Stats
  ctx.textAlign = "center";
  ctx.font = `16px ${fontMono}`;
  const stats = `raw ${run.metrics.rawWpm}  ·  acc ${run.metrics.accuracy}%  ·  con ${run.metrics.consistency}%`;
  
  ctx.fillStyle = textMuted;
  ctx.fillText(stats, 300, 260);

  // Footer
  ctx.font = `14px ${fontMono}`;
  ctx.fillStyle = textMuted;
  
  // Mode Info
  ctx.textAlign = "left";
  const modeInfo = `${run.settings.mode} ${run.settings.value} · ${run.settings.wordSourceId}`;
  ctx.fillText(modeInfo, 30, 370);

  // Date
  ctx.textAlign = "right";
  const dateStr = new Date(run.completedAt).toLocaleDateString(undefined, { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });
  ctx.fillText(dateStr, 570, 370);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to generate blob"));
    }, "image/png");
  });
}

export async function downloadShareCard(run: CompletedRun): Promise<void> {
  const blob = await generateShareCard(run);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `typearena-${run.settings.mode}-${run.settings.value}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareShareCard(run: CompletedRun): Promise<void> {
  const blob = await generateShareCard(run);
  const file = new File([blob], `typearena-${run.settings.mode}-${run.settings.value}.png`, { type: "image/png" });
  
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: "TypeArena Results",
        text: `I just typed ${run.metrics.wpm} WPM on TypeArena!`,
        files: [file],
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed", err);
        await downloadShareCard(run);
      }
    }
  } else {
    await downloadShareCard(run);
  }
}
