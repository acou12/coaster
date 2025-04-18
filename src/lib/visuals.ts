import type { Coaster } from './coaster';

export const drawCoaster = (
	context: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	precision: number,
	coaster: Coaster
) => {
	/* draw the scaffolds */
	for (let x = 0; x < canvas.width; x += precision) {
		context.beginPath();

		context.strokeStyle = '#ffe1a3';
		context.lineWidth = 5;

		context.moveTo(x, canvas.height);
		context.lineTo(x, canvas.height - coaster.getHeight(x));

		context.stroke();
	}

	/* draw the rail */
	for (let x = 0; x < canvas.width; x += precision) {
		context.beginPath();

		context.strokeStyle = '#808080';
		context.lineWidth = 5;

		context.moveTo(x, canvas.height - coaster.getHeight(x));
		context.lineTo(x + precision, canvas.height - coaster.getHeight(x + precision));

		context.stroke();
	}
};

export const drawCoasterParticipant = (context: CanvasRenderingContext2D, x: number, y: number) => {
	context.beginPath();
	context.fillStyle = 'black';
	context.arc(x, y, 10, 0, 2 * Math.PI);
	context.fill();
};
