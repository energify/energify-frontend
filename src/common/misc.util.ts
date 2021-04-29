export function arrayFromRange(j, k) {
  return Array.apply(null, Array(k - j + 1)).map(function (_, n) {
    return n + j;
  });
}
