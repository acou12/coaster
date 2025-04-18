import { Point } from './point';

export interface Camera {
	transformPoint(point: Point): Point;
	transformX(x: number): number;
	transformY(y: number): number;
	inverseTransformPoint(point: Point): Point;
	inverseTransformX(x: number): number;
	inverseTransformY(y: number): number;
	getTopLeft(): Point;
	updateTopLeft(point: Point): void;
}

export class StandardCamera implements Camera {
	topLeftX: number;
	topLeftY: number;
	zoom: number;

	constructor(private canvas: HTMLCanvasElement) {
		this.topLeftX = 0;
		this.topLeftY = 0;
		this.zoom = 1;
	}

	transformPoint(point: Point): Point {
		return new Point(this.transformX(point.x), this.transformY(point.y));
	}

	transformX(x: number): number {
		return x - this.topLeftX;
	}

	transformY(y: number): number {
		return this.canvas.height - (y - this.topLeftY);
	}

	inverseTransformPoint(point: Point): Point {
		return new Point(this.inverseTransformX(point.x), this.inverseTransformY(point.y));
	}

	inverseTransformX(x: number): number {
		return x + this.topLeftX;
	}

	inverseTransformY(y: number): number {
		return this.canvas.height - y + this.topLeftY;
	}

	getTopLeft(): Point {
		return new Point(this.topLeftX, this.topLeftY);
	}

	updateTopLeft(point: Point): void {
		this.topLeftX = point.x;
		this.topLeftY = point.y;
	}
}

export class RenderingContext {
	constructor(
		public camera: Camera,
		public context: CanvasRenderingContext2D,
		public canvas: HTMLCanvasElement
	) {}
}
