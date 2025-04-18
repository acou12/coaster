<script lang="ts">
	import { CubicCoaster, type Coaster } from '$lib/coaster';
	import { getCubicSpline } from '$lib/methods';
	import { Point } from '$lib/point';
	import { drawCoaster, drawCoasterParticipant, drawKnots } from '$lib/visuals';
	import { onMount } from 'svelte';
	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let points: Point[] = [new Point(0, 0)];

	let draggingPoint = -1;

	let coaster: Coaster;
	let v = 1;
	let x = 0.1;

	onMount(() => {
		context = canvas.getContext('2d')!;
		canvas.addEventListener('mousedown', (e) => {
			let foundOne = false;
			for (let i = 0; i < points.length; i++) {
				const point = points[i];
				if (Math.hypot(point.x - e.clientX, canvas.height - point.y - e.clientY) <= 10) {
					draggingPoint = i;
					foundOne = true;
					break;
				}
			}
			if (!foundOne) {
				points.push(new Point(e.clientX, canvas.height - e.clientY));
				coaster = new CubicCoaster(getCubicSpline(points));
				v = 1;
				x = 0.1;
			}
		});

		canvas.addEventListener('mousemove', (e) => {
			if (draggingPoint != -1) {
				points[draggingPoint].x = e.clientX;
				points[draggingPoint].y = canvas.height - e.clientY;

				if (
					draggingPoint + 1 < points.length &&
					points[draggingPoint].x > points[draggingPoint + 1].x
				) {
					let temp = points[draggingPoint];
					points[draggingPoint] = points[draggingPoint + 1];
					points[draggingPoint + 1] = temp;
					draggingPoint += 1;
				}

				if (draggingPoint - 1 >= 0 && points[draggingPoint].x < points[draggingPoint - 1].x) {
					let temp = points[draggingPoint];
					points[draggingPoint] = points[draggingPoint - 1];
					points[draggingPoint - 1] = temp;
					draggingPoint -= 1;
				}

				coaster = new CubicCoaster(getCubicSpline(points));
			}
		});
		canvas.addEventListener('mouseup', (e) => {
			if (draggingPoint != -1) {
				draggingPoint = -1;
			}
		});
		points.push(new Point(window.innerWidth, 0));
		coaster = new CubicCoaster(getCubicSpline(points));
		draw(0);
	});

	let lastTime = 0;

	const draw = (time: number) => {
		let delta = time - lastTime;
		lastTime = time;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		context.fillStyle = 'skyblue';
		context.fillRect(0, 0, canvas.width, canvas.height);

		drawCoaster(context, canvas, /* precision = */ 10, coaster);
		drawKnots(context, canvas, points, draggingPoint);
		drawCoasterParticipant(context, x, canvas.height - coaster.getHeight(x));

		x += v * delta * Math.cos(Math.atan(coaster.getSlant(x)));
		v -= Math.sin(Math.atan(coaster.getSlant(x))) * 0.01;

		if (x < 0) {
			x += canvas.width;
		}
		if (x > canvas.width) {
			x -= canvas.width;
		}

		requestAnimationFrame(draw);
	};
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		position: fixed;
		left: 0;
		top: 0;
	}
</style>
