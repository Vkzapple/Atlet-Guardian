export function calibrateFromReadings(hrReadings, currentBaseline) {
  if (!hrReadings.length) return currentBaseline;

  const sorted = [...hrReadings].sort((a, b) => a - b);
  const restingWindow = sorted.slice(0, Math.max(5, Math.ceil(sorted.length * 0.2)));
  const avgRestingHR = restingWindow.reduce((sum, hr) => sum + hr, 0) / restingWindow.length;

  return {
    ...currentBaseline,
    restingHR: Math.round(avgRestingHR),
    calibratedAt: new Date().toISOString(),
    sampleSize: hrReadings.length
  };
}
