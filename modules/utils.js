export function rotateArray(array, pivotNeedle) {
  const pivot = array.findIndex(pivotNeedle);
  return array.slice(pivot).concat(array.slice(0, pivot));
};
