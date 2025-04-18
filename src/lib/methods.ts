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

export const getCubicSpline = (points: Point[]): CubicPiecewise => {
	/* todo */
	points.sort((p1, p2) => p1.x - p2.x);

	const x = points.map((p) => p.x);
	const a = Array(points.length - 1).fill(0);
	const b = Array(points.length - 1).fill(0);
	const c = Array(points.length - 1).fill(0);
	const d = Array(points.length - 1).fill(0);

	/* temporarily returns a linear spline */

	for (let i = 0; i < points.length - 1; i++) {
		let first = points[i];
		let second = points[i + 1];
		let slope = (second.y - first.y) / (second.x - first.x);
		/* first.y = slope * first.x + yIntercept, so */
		let yIntercept = first.y - slope * first.x;
		c[i] = slope;
		d[i] = yIntercept;
	}

	return new CubicPiecewise(x, a, b, c, d);
};
