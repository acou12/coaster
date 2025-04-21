import type { CubicPiecewise } from './methods';

export interface Coaster {
	getHeight(x: number): number;
	getSlant(x: number): number;
	getArea(): number;
	getMaxAcceleration(): number;
}

export class CubicCoaster implements Coaster {
	constructor(private spline: CubicPiecewise) {}

	getSlant(x: number): number {
		return this.spline.computeDerivative(x);
	}

	getHeight(x: number): number {
		return this.spline.compute(x);
	}

	getArea(): number {
		return this.spline.computeIntegral();
	}

	getMaxAcceleration(): number {
		return this.spline.getMaxSecondDerivative();
	}
}
