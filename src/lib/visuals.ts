import type { RenderingContext } from './camera';
import { getAllIntersections, type CubicPiecewise } from './methods';
import { Point } from './point';

export const drawCoaster = (rc: RenderingContext, precision: number, coaster: CubicPiecewise) => {
	/* draw the scaffolds */
	for (let x = coaster.x[0]; x < coaster.x[coaster.x.length - 1]; x += precision * 2) {
		rc.context.beginPath();

		rc.context.strokeStyle = '#ffe1a3';
		rc.context.lineWidth = 5;

		rc.context.moveTo(rc.camera.transformX(x), rc.camera.transformY(0));
		rc.context.lineTo(rc.camera.transformX(x), rc.camera.transformY(coaster.compute(x)));

		rc.context.stroke();
	}

	for (let y = 0; y < rc.canvas.height; y += precision * 2) {
		// let y = window.innerHeight / 2;
		let intersections = getAllIntersections(coaster, y);
		// console.log(intersections);
		// console.log(intersections.map((x) => coaster.compute(x)));
		for (let i = 0; i < intersections.length - 1; i++) {
			let [xl, xh] = [intersections[i], intersections[i + 1]];
			if (coaster.computeDerivative(xl) > 0) {
				rc.context.beginPath();
				rc.context.moveTo(rc.camera.transformX(xl), rc.camera.transformY(coaster.compute(xl)));
				rc.context.lineTo(rc.camera.transformX(xh), rc.camera.transformY(coaster.compute(xh)));
				rc.context.stroke();
			}
		}
		if (intersections.length > 0) {
			let last = intersections[intersections.length - 1];
			if (coaster.computeDerivative(last) > 0) {
				rc.context.beginPath();
				rc.context.moveTo(rc.camera.transformX(last), rc.camera.transformY(coaster.compute(last)));
				rc.context.lineTo(
					rc.camera.transformX(coaster.x[coaster.x.length - 1]),
					rc.camera.transformY(coaster.compute(last))
				);
				rc.context.stroke();
			}
		}
	}

	/* draw the rail */
	for (let x = coaster.x[0]; x < coaster.x[coaster.x.length - 1]; x += precision) {
		rc.context.beginPath();

		rc.context.strokeStyle = '#808080';
		rc.context.lineWidth = 5;

		rc.context.moveTo(rc.camera.transformX(x), rc.camera.transformY(coaster.compute(x)));
		rc.context.lineTo(
			rc.camera.transformX(x + precision),
			rc.camera.transformY(coaster.compute(x + precision))
		);

		rc.context.stroke();
	}
};

export const drawCoasterParticipant = (
	rc: RenderingContext,
	x: number,
	coaster: CubicPiecewise
) => {
	rc.context.beginPath();
	rc.context.fillStyle = 'black';
	// rc.context.arc(rc.camera.transformX(x), rc.camera.transformY(y), 10, 0, 2 * Math.PI);
	let y = coaster.compute(x);
	let len = 20;
	rc.context.translate(rc.camera.transformX(x), rc.camera.transformY(y));
	rc.context.rotate(-Math.atan(coaster.computeDerivative(x)));

	rc.context.fillRect(-len, -len, 2 * len, len);
	// rc.context.arc(-len, 0, 10, 0, 2 * Math.PI);
	// rc.context.arc(len, 0, 10, 0, 2 * Math.PI);

	rc.context.translate(rc.camera.transformX(-x), rc.camera.transformY(-y));
	rc.context.fill();
	rc.context.resetTransform();
};

export const drawKnots = (rc: RenderingContext, points: Point[], draggingPoint: number) => {
	for (let i = 0; i < points.length; i++) {
		let p = points[i];
		rc.context.beginPath();
		rc.context.fillStyle = draggingPoint === i ? '#606060' : '#808080';
		rc.context.arc(
			rc.camera.transformX(p.x),
			rc.camera.transformY(p.y),
			draggingPoint === i ? 15 : 10,
			0,
			2 * Math.PI
		);
		rc.context.fill();
	}
};

/* debug */

export const drawCubic = (
	rc: RenderingContext,
	precision: number,
	coaster: CubicPiecewise,
	x: number
) => {
	let i = coaster.getIndex(x);
	for (let x = -rc.canvas.width * 5; x < rc.canvas.width * 4; x += precision) {
		rc.context.beginPath();

		rc.context.strokeStyle = '#c44cfc';
		rc.context.lineWidth = 5;

		rc.context.moveTo(
			rc.camera.transformX(x),
			rc.camera.transformY(coaster.computeComponent(x, i))
		);
		rc.context.lineTo(
			rc.camera.transformX(x + precision),
			rc.camera.transformY(coaster.computeComponent(x + precision, i))
		);

		rc.context.stroke();
	}
};

export const drawArrow = (rc: RenderingContext, p1: Point, p2: Point) => {
	rc.context.beginPath();

	rc.context.moveTo(rc.camera.transformX(p1.x), rc.camera.transformY(p1.y));
	rc.context.lineTo(rc.camera.transformX(p2.x), rc.camera.transformY(p2.y));

	let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
	let len = Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));

	rc.context.moveTo(rc.camera.transformX(p2.x), rc.camera.transformY(p2.y));
	rc.context.lineTo(
		rc.camera.transformX(p2.x + (Math.cos(angle + (Math.PI * 4) / 5) * len) / 3),
		rc.camera.transformY(p2.y + (Math.sin(angle + (Math.PI * 4) / 5) * len) / 3)
	);

	rc.context.moveTo(rc.camera.transformX(p2.x), rc.camera.transformY(p2.y));
	rc.context.lineTo(
		rc.camera.transformX(p2.x + (Math.cos(angle - (Math.PI * 4) / 5) * len) / 3),
		rc.camera.transformY(p2.y + (Math.sin(angle - (Math.PI * 4) / 5) * len) / 3)
	);

	rc.context.stroke();
};

export const drawForces = (rc: RenderingContext, slope: number, x: number, y: number) => {
	rc.context.lineWidth = 5;

	let theta = Math.atan(slope);
	let dx = -Math.sin(theta) * 60;
	let dy = Math.cos(theta) * 60;

	rc.context.strokeStyle = '#4c66fc';
	drawArrow(rc, new Point(x, y), new Point(x + Math.cos(theta) * dx, y + Math.sin(theta) * dx));
	rc.context.strokeStyle = '#fc9b4c';
	drawArrow(
		rc,
		new Point(x, y),
		new Point(x + Math.cos(theta - Math.PI / 2) * dy, y + Math.sin(theta - Math.PI / 2) * dy)
	);
};
