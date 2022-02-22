export function rotateArray(array, pivotNeedle) {
  const pivot = array.findIndex(pivotNeedle);
  return array.slice(pivot).concat(array.slice(0, pivot));
}

export function rnd(mx = 1, mn = 0) {
  [mx, mn] = [Math.max(mx, mn), Math.min(mx, mn)];
  return Math.random() * (mx - mn) + mn;
}

export default { rotateArray, rnd };