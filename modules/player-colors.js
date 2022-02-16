const colorCount = 8;
export const PlayerColors = Array.from(
  { length: colorCount },
  (_, index) => `hsl(${
    Math.floor(index / colorCount * 360)
  }, 50%, 50%)`
);

export default PlayerColors;
