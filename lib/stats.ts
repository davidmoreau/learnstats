export function mean(xs: number[]) {
  return xs.reduce((acc, x) => acc + x, 0) / xs.length;
}

export function sd(xs: number[]) {
  const m = mean(xs);
  const variance = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / xs.length;
  return Math.sqrt(variance);
}
