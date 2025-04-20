<script lang="ts">
	import { CubicCoaster, type Coaster } from '$lib/coaster';
	import { eulersStep, getCubicSpline, rungeKuttaStep } from '$lib/methods';
	import { Point } from '$lib/point';
	import { drawCoaster, drawCoasterParticipant, drawKnots } from '$lib/visuals';
	import { onMount } from 'svelte';
	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let points: Point[] = [
		new Point(0, 0),
		new Point(1101, 0),
		new Point(194, 181),
		new Point(282, 363),
		new Point(410, 481),
		new Point(453, 366),
		new Point(530, 482),
		new Point(611, 456),
		new Point(660, 479),
		new Point(704, 444),
		new Point(756, 410),
		new Point(783, 226),
		new Point(821, 104),
		new Point(901, 37),
		new Point(971, 10)
	];

	let draggingPoint = -1;

	let coaster: Coaster;
	let x = 0.01;
	let direction = 1;

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
				x = 0.01;
				direction = 1;
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
		// points.push(new Point(window.innerWidth, 0));
		// points.push(new Point(0, 0));
		coaster = new CubicCoaster(getCubicSpline(points));
		draw(0);
	});

	let lastTime = 0;

	const draw = (time: number) => {
		let delta = time - lastTime;
		lastTime = time;

		console.log(points);

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		context.fillStyle = 'skyblue';
		context.fillRect(0, 0, canvas.width, canvas.height);

		drawCoaster(context, canvas, /* precision = */ 10, coaster);
		drawKnots(context, canvas, points, draggingPoint);
		drawCoasterParticipant(context, x, canvas.height - coaster.getHeight(x));

		if ((canvas.height * 2) / 3 - coaster.getHeight(x + 0.1) < 0) {
			direction *= -1;
			while ((canvas.height * 2) / 3 - coaster.getHeight(x) < 0) {
				x += direction * 0.1;
			}
		}

		let v_prime = (t: number, x: number) => {
			let v = 2 * Math.sqrt((canvas.height * 2) / 3 - coaster.getHeight(x));
			let theta = Math.atan(coaster.getSlant(x));
			return direction * Math.cos(theta) * v;
		};

		x = rungeKuttaStep(x, 0, 0.1, v_prime);
		// x = eulersStep(x, 0, 0.1, v_prime);

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
