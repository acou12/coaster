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
	getIndex(t: number) {
		if (t < this.x[0] || t > this.x[this.x.length - 1] || Number.isNaN(t) /* yikes */) {
			return 0;
		} else {
			let i = 0;
			while (!(this.x[i] <= t && t <= this.x[i + 1])) {
				i++;
			}
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

	computeComponent(t: number, i: number) {
		return Math.pow(t, 3) * this.a[i] + Math.pow(t, 2) * this.b[i] + t * this.c[i] + this.d[i];
	}

	computeDerivative(t: number): number {
		if (this.x.length < 2 || t < this.x[0] || t > this.x[this.x.length - 1]) {
			return 0;
		}
		let i = this.getIndex(t);
		return 3 * Math.pow(t, 2) * this.a[i] + 2 * t * this.b[i] + this.c[i];
	}

	computeSecondDerivative(t: number): number {
		if (this.x.length < 2 || t < this.x[0] || t > this.x[this.x.length - 1]) {
			return 0;
		}
		let i = this.getIndex(t);
		return 6 * t * this.a[i] + 2 * this.b[i];
	}

	getMaxSecondDerivative(): number {
		let max = 0;
		for (let i = 0; i < this.x.length; i++) {
			max = Math.max(this.computeSecondDerivative(this.x[i]), max);
		}
		return max;
	}

	computeIntegral() {
		/* this uses simpson's rule; since each component is a cubic, this is actually exact. */
		let sum = 0;
		for (let i = 0; i < this.x.length - 1; i++) {
			let a = this.x[i];
			let b = this.x[i + 1];
			sum += ((b - a) / 6) * (this.compute(a) + 4 * this.compute((a + b) / 2) + this.compute(b));
		}
		return sum;
	}
}

export const getCubicSpline = (points: Point[]): CubicPiecewise => {
	const pts = [...points].sort((p1, p2) => p1.x - p2.x);
	const N = pts.length;
	if (N < 2)
		return new CubicPiecewise(
			pts.map((p) => p.x),
			[],
			[],
			[],
			[]
		);

	const n = N - 1;
	const x = pts.map((p) => p.x);

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
		const bi = z[i] / 2;
		const ci = m[i] - (h[i] * (2 * z[i] + z[i + 1])) / 6;
		const di = pts[i].y;
		const xi = x[i];

		// expand (t-xi)^3, (t-xi)^2, (t-xi),1 into t^3,t^2,t,1:
		a[i] = ai;
		b[i] = -3 * ai * xi + bi;
		c[i] = 3 * ai * xi * xi - 2 * bi * xi + ci;
		d[i] = -ai * xi * xi * xi + bi * xi * xi - ci * xi + di;
	}

	return new CubicPiecewise(x, a, b, c, d);
};

export const rungeKuttaStep = (
	x: number,
	t: number,
	h: number,
	f: (t: number, x: number) => number
) => {
	const K1 = h * f(t, x);
	const K2 = h * f(t + (1 / 2) * h, x + (1 / 2) * K1);
	const K3 = h * f((t = (1 / 2) * h), x + (1 / 2) * K2);
	const K4 = h * f(t + h, x + K3);
	return x + (1 / 6) * (K1 + 2 * K2 + 2 * K3 + K4);
};

export const eulersStep = (
	x: number,
	t: number,
	h: number,
	f: (t: number, x: number) => number
) => {
	return x + h * f(t, x);
};

export const approximateDerivate = (x: number, h: number, f: (x: number) => number) => {

	// returns the centered difference
	return (f(x + h) - f(x - h)) / (2 * h)
};

/**
 * Given a cubic piecewise function f(x) and a constant c,
 * returns every x for which f(x) = c.
 */
export const getAllIntersections = (spline: CubicPiecewise, c: number): number[] => {
	let intersections = [];
	for (let i = 0; i < spline.x.length - 1; i++) {
		intersections.push(
			...getBoundedCubicRoot(
				spline.a[i],
				spline.b[i],
				spline.c[i],
				spline.d[i] - c,
				spline.x[i],
				spline.x[i + 1]
			)
		);
	}
	return intersections;
};

/**
 * Returns a list of roots of the cubic f(x) = ax^3 + bx^2 + cx + d
 * that lie in the interval [l, h].
 */
export const getBoundedCubicRoot = (
	a: number,
	b: number,
	c: number,
	d: number,
	l: number,
	h: number
): number[] => {
	/* We find the roots by running the bisection method on subintervals of [l, h].
	   The way we find these intervals is by finding the critical points of the cubic.
	   The zeroes must lie between two critical points which have opposite signs. */

	/* find the roots of f'(x) */
	let criticalPoints = [];

	let insideSquareRoot = Math.pow(2 * b, 2) - 12 * a * c;

	if (insideSquareRoot === 0) {
		criticalPoints.push((-2 * b) / (6 * a));
	} else if (insideSquareRoot > 0) {
		criticalPoints.push((-2 * b + Math.sqrt(insideSquareRoot)) / (6 * a));
		criticalPoints.push((-2 * b - Math.sqrt(insideSquareRoot)) / (6 * a));
	}

	/* these are the borders of the critical intervals. */
	let borders = [l, ...criticalPoints.filter((x) => l < x && x < h), h];
	// console.log(borders);

	let roots = [];

	for (let i = 0; i < borders.length - 1; i++) {
		let bl = borders[i];
		let bh = borders[i + 1];
		/* if the interval's border's signs are different, there must be a 
		   root here. use bisection to approximate it. */
		if (
			sign(a * Math.pow(bl, 3) + b * Math.pow(bl, 2) + c * bl + d) !==
			sign(a * Math.pow(bh, 3) + b * Math.pow(bh, 2) + c * bh + d)
		) {
			roots.push(
				bisection((x) => a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d, 0.001, bl, bh)
			);
		}
	}

	return roots;
};

/**
 * Returns an approximation of a root of f between l_i and h_i.
 *
 * More precisely, returns a value l_i <= x <= h_i such that |f(x) - f(x_0)| <= epsilon, where f(x_0) = 0.
 */
export const bisection = (
	f: (x: number) => number,
	epsilon: number,
	l_i: number,
	h_i: number
): number => {
	let l = l_i;
	let h = h_i;
	let m = (l + h) / 2;
	while (h - l > epsilon) {
		if (sign(f(m)) === Sign.ZERO) {
			return m;
		} else {
			if (sign(f(m)) === sign(f(l))) {
				l = m;
			} else {
				h = m;
			}
		}
		m = (l + h) / 2;
	}
	return m;
};

enum Sign {
	POSITIVE,
	ZERO,
	NEGATIVE
}

export const sign = (x: number): Sign => {
	if (x < 0) {
		return Sign.NEGATIVE;
	} else if (x > 0) {
		return Sign.POSITIVE;
	} else {
		return Sign.ZERO;
	}
};
