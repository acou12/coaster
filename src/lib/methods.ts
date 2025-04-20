import type { Point } from './point';

/**
 * Represents a piecewise cubic function.
 *
 * In particular, this computes the function f where
 * f(t) = a[i]t^3 + b[i]t^2 + c[i]t + d[i] where x[i] <= t <= x[i+i].
 */
export class CubicPiecewise {
	constructor(
		public x: number[],
		public a: number[],
		public b: number[],
		public c: number[],
		public d: number[]
	) {}

	/* find the i such that x[i] <= t <= x[i+1]. */
	private getIndex(t: number) {
		if (t < this.x[0] || t > this.x[this.x.length - 1]) {
			return 0;
		} else {
			let i = 0;
			while (this.x[i] < t) {
				i++;
			}
			i--;
			return i;
		}
	}

	compute(t: number): number {
		if (this.x.length < 2 || t < this.x[0] || t > this.x[this.x.length - 1]) {
			return 0;
		}
		let i = this.getIndex(t);
		return Math.pow(t, 3) * this.a[i] + Math.pow(t, 2) * this.b[i] + t * this.c[i] + this.d[i];
	}

	computeDerivative(t: number): number {
		if (this.x.length < 2 || t < this.x[0] || t > this.x[this.x.length - 1]) {
			return 0;
		}
		let i = this.getIndex(t);
		return 3 * Math.pow(t, 2) * this.a[i] + 2 * t * this.b[i] + this.c[i];
	}
}

// export const getCubicSpline = (points: Point[]): CubicPiecewise => {
// 	/* todo */
// 	points.sort((p1, p2) => p1.x - p2.x);

// 	const x = points.map((p) => p.x);
// 	const a = Array(points.length - 1).fill(0);
// 	const b = Array(points.length - 1).fill(0);
// 	const c = Array(points.length - 1).fill(0);
// 	const d = Array(points.length - 1).fill(0);

// 	/* temporarily returns a linear spline */

// 	for (let i = 0; i < points.length - 1; i++) {
// 		let first = points[i];
// 		let second = points[i + 1];
// 		let slope = (second.y - first.y) / (second.x - first.x);
// 		/* first.y = slope * first.x + yIntercept, so */
// 		let yIntercept = first.y - slope * first.x;
// 		c[i] = slope;
// 		d[i] = yIntercept;
// 	}

// 	return new CubicPiecewise(x, a, b, c, d);
// };
export const getCubicSpline = (points: Point[]): CubicPiecewise => {
	const pts = [...points].sort((p1, p2) => p1.x - p2.x);
	const N = pts.length;
	if (N < 2) return new CubicPiecewise(pts.map(p => p.x), [], [], [], []);
  
	const n = N - 1;
	const x = pts.map(p => p.x);
  
	// 1) interval widths & slopes
	const h = new Array<number>(n);
	const m = new Array<number>(n);
	for (let i = 0; i < n; i++) {
	  h[i] = pts[i + 1].x - pts[i].x;
	  m[i] = (pts[i + 1].y - pts[i].y) / h[i];
	}
  
	// 2) build & solve tridiagonal system for z (second derivs)
	// natural spline: z[0] = z[n] = 0
	const u = new Array<number>(N).fill(0);
	const v = new Array<number>(N).fill(0);
	if (n > 1) {
	  u[1] = 2 * (h[0] + h[1]);
	  v[1] = 6 * (m[1] - m[0]);
	  for (let i = 2; i < n; i++) {
		const tmp = h[i - 1] / u[i - 1];
		u[i] = 2 * (h[i - 1] + h[i]) - h[i - 1] * tmp;
		v[i] = 6 * (m[i] - m[i - 1]) - v[i - 1] * tmp;
	  }
	}
  
	const z = new Array<number>(N).fill(0);
	for (let i = n - 1; i >= 1; i--) {
	  z[i] = (v[i] - h[i] * z[i + 1]) / u[i];
	}
  
	// 3) compute local cubic in (t - x[i]) basis, then convert to global t^3+t^2+t+1
	const a = new Array<number>(n);
	const b = new Array<number>(n);
	const c = new Array<number>(n);
	const d = new Array<number>(n);
  
	for (let i = 0; i < n; i++) {
	  // local
	  const ai = (z[i + 1] - z[i]) / (6 * h[i]);
	  const bi =  z[i] / 2;
	  const ci =  m[i] - (h[i] * (2 * z[i] + z[i + 1])) / 6;
	  const di =  pts[i].y;
	  const xi =  x[i];
  
	  // expand (t-xi)^3, (t-xi)^2, (t-xi),1 into t^3,t^2,t,1:
	  a[i] = ai;
	  b[i] = -3 * ai * xi + bi;
	  c[i] =  3 * ai * xi * xi - 2 * bi * xi + ci;
	  d[i] = -ai * xi * xi * xi + bi * xi * xi - ci * xi + di;
	}
  
	return new CubicPiecewise(x, a, b, c, d);
  }