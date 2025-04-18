import type { CubicSpline } from './methods';

export interface Coaster {
	getHeight(x: number): number;
}

export class LinearCoaster implements Coaster {
	constructor(private points: [number, number][]) {
		points.sort((p1, p2) => p1[0] - p2[0]);
		console.log(points);
	}

	getHeight(x: number): number {
		for (let i = 0; i < this.points.length - 1; i++) {
			if (this.points[i][0] <= x && x <= this.points[i + 1][0]) {
				let between = (x - this.points[i][0]) / (this.points[i + 1][0] - this.points[i][0]);
				return this.points[i][1] + (this.points[i + 1][1] - this.points[i][1]) * between;
			}
		}
		return 100;
	}
}

export class CubicCoaster implements Coaster {
	constructor(private spline: CubicSpline) {}

	getHeight(x: number): number {
		return this.spline.compute(x);
	}
}
