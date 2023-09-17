
export const is_approx = (a: number, b: number, eps = 1e-4) => {
  return Math.abs(a - b) < eps;
}
