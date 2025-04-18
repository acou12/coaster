import type { RenderingContext } from './camera';
import type { Coaster } from './coaster';
import type { Point } from './point';

export const drawCoaster = (rc: RenderingContext, precision: number, coaster: Coaster) => {
	/* draw the scaffolds */
	for (let x = -rc.canvas.width * 5; x < rc.canvas.width * 4; x += precision) {
		rc.context.beginPath();

		rc.context.strokeStyle = '#ffe1a3';
		rc.context.lineWidth = 5;

		rc.context.moveTo(rc.camera.transformX(x), rc.camera.transformY(0));
		rc.context.lineTo(rc.camera.transformX(x), rc.camera.transformY(coaster.getHeight(x)));

		rc.context.stroke();
	}

	/* draw the rail */
	for (let x = -rc.canvas.width * 5; x < rc.canvas.width * 4; x += precision) {
		rc.context.beginPath();

		rc.context.strokeStyle = '#808080';
		rc.context.lineWidth = 5;

		rc.context.moveTo(rc.camera.transformX(x), rc.camera.transformY(coaster.getHeight(x)));
		rc.context.lineTo(
			rc.camera.transformX(x + precision),
			rc.camera.transformY(coaster.getHeight(x + precision))
		);

		rc.context.stroke();
	}
};

export const drawCoasterParticipant = (rc: RenderingContext, x: number, y: number) => {
	rc.context.beginPath();
	rc.context.fillStyle = 'black';
	rc.context.arc(rc.camera.transformX(x), rc.camera.transformY(y), 10, 0, 2 * Math.PI);
	rc.context.fill();
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
