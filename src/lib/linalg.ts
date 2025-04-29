import { backward_solve, forward_solve } from './methods';
import { Point } from './point';

export class HomogeneousCoordinates {
	constructor(public entries: number[][]) {}

	multiplyVector(v: number[]) {
		let result = [0, 0, 0];
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				result[i] += this.entries[i][j] * v[j];
			}
		}
		return result;
	}

	transformPoint(point: Point): Point {
		let v = this.multiplyVector([point.x, point.y, 1]);
		return new Point(v[0], v[1]);
	}

	inverseTransform(point: Point): Point {
		let L = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		];
		let U = this.entries.map((r) => [...r]);
		for (let ref = 0; ref < 2; ref++) {
			for (let change = ref + 1; change < 3; change++) {
				let factor = U[change][ref] / U[ref][ref];
				L[change][ref] = factor;
				for (let j = 0; j < 3; j++) {
					U[change][j] -= factor * U[ref][j];
				}
			}
		}
		console.debug(L, U);
		let v1 = [point.x, point.y, 1];
		let v2 = forward_solve(L, 3, v1);
		let v3 = backward_solve(U, 3, v2);
		return new Point(v3[0], v3[1]);
	}

	multiply(other: HomogeneousCoordinates): HomogeneousCoordinates {
		let product = new HomogeneousCoordinates([
			[0, 0, 0],
			[0, 0, 0],
			[0, 0, 0]
		]);
		for (let i = 0; i < 3; i++) {
			for (let k = 0; k < 3; k++) {
				for (let j = 0; j < 3; j++) {
					product.entries[i][k] += this.entries[i][j] * other.entries[j][k];
				}
			}
		}
		return product;
	}
}

export const transform = (x: number, y: number) => {
	let h = new HomogeneousCoordinates([
		[1, 0, x],
		[0, 1, y],
		[0, 0, 1]
	]);
	return h;
};

export const scale = (f: number) => {
	let h = new HomogeneousCoordinates([
		[f, 0, 0],
		[0, f, 0],
		[0, 0, 1]
	]);
	return h;
};

export const flip = () => {
	let h = new HomogeneousCoordinates([
		[1, 0, 0],
		[0, -1, 0],
		[0, 0, 1]
	]);
	return h;
};

export const test = () => {
	console.log(scale(3).inverseTransform(new Point(1, 1)));
};
