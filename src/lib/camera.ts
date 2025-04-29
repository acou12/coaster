import { flip, HomogeneousCoordinates, scale, transform } from './linalg';
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
	getZoom(): number;
	updateZoom(z: number): void;
}

export class StandardCamera implements Camera {
	topLeftX: number;
	topLeftY: number;
	zoom: number;
	coordinates: HomogeneousCoordinates;

	constructor(private canvas: HTMLCanvasElement) {
		this.topLeftX = 0;
		this.topLeftY = 0;
		this.zoom = 1;
		this.coordinates = new HomogeneousCoordinates([]);
		this.updateCoordinates();
	}

	private updateCoordinates() {
		this.coordinates = scale(this.zoom)
			.multiply(transform(this.topLeftX, this.topLeftY))
			.multiply(flip());
	}

	transformPoint(point: Point): Point {
		return this.coordinates.transformPoint(point);
	}

	transformX(x: number): number {
		return this.coordinates.transformPoint(new Point(x, 0)).x;
	}

	transformY(y: number): number {
		return this.coordinates.transformPoint(new Point(0, y)).y;
	}

	inverseTransformPoint(point: Point): Point {
		return this.coordinates.inverseTransform(point);
	}

	inverseTransformX(x: number): number {
		return this.coordinates.inverseTransform(new Point(x, 0)).x;
	}

	inverseTransformY(y: number): number {
		return this.coordinates.inverseTransform(new Point(0, y)).y;
	}

	getTopLeft(): Point {
		return new Point(this.topLeftX, this.topLeftY);
	}

	updateTopLeft(point: Point): void {
		this.topLeftX = point.x;
		this.topLeftY = point.y;
		this.updateCoordinates();
	}

	getZoom(): number {
		return this.zoom;
	}

	updateZoom(z: number): void {
		this.zoom = z;
		this.updateCoordinates();
	}
}

export class RenderingContext {
	constructor(
		public camera: Camera,
		public context: CanvasRenderingContext2D,
		public canvas: HTMLCanvasElement
	) {}
}
