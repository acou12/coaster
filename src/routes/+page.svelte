<script lang="ts">
	import { RenderingContext, StandardCamera, type Camera } from '$lib/camera';
	import { CubicCoaster, type Coaster } from '$lib/coaster';
	import { eulersStep, getCubicSpline, rungeKuttaStep } from '$lib/methods';
	import { Point } from '$lib/point';
	import { drawCoaster, drawCoasterParticipant, drawKnots } from '$lib/visuals';
	import { onMount } from 'svelte';
	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let points: Point[] = [
		new Point(0, 0),
		// new Point(1101, 0),
		new Point(194, 181),
		new Point(288, 306),
		new Point(401, 373),
		new Point(444, 343),
		new Point(469, 380),
		new Point(582, 302),
		new Point(617, 372),
		new Point(713, 381),
		new Point(744, 303),
		new Point(774, 193),
		new Point(821, 104),
		new Point(901, 37),
		new Point(971, 10),
		new Point(234, 267),
		new Point(651, 387),
		new Point(685, 389)
	];

	let mousePos = { x: 0, y: 0 };

	let draggingPoint = -1;

	let draggingCamera = false;

	let infoToggled = false;

	let coaster: Coaster;
	let area: number;
	let speed: number;
	let maxAcceleration: number;
	let x = 0.01;
	let direction = 1;

	let camera: Camera;

	const updateCoaster = () => {
		coaster = new CubicCoaster(getCubicSpline(points));
		area = coaster.getArea();
		maxAcceleration = coaster.getMaxAcceleration();
	};

	onMount(() => {
		context = canvas.getContext('2d')!;
		camera = new StandardCamera(canvas);

		window.addEventListener('keydown', (e) => {
			if (e.key === ' ') {
				draggingCamera = true;
			} else if (e.key === 'Escape') {
				infoToggled = !infoToggled;
			} else if (e.key === 'Backspace') {
				points = [new Point(0, 0), new Point(window.innerWidth, 0)];
				updateCoaster();
			} else if (e.key === 'p') {
				x = mousePos.x;
			}
		});

		window.addEventListener('keyup', (e) => {
			if (e.key === ' ') {
				draggingCamera = false;
			}
		});

		canvas.addEventListener('mousedown', (e) => {
			let rx = camera.inverseTransformX(e.clientX);
			let ry = camera.inverseTransformY(e.clientY);
			let foundOne = false;
			for (let i = 0; i < points.length; i++) {
				const point = points[i];
				if (Math.hypot(point.x - rx, point.y - ry) <= 10) {
					draggingPoint = i;
					foundOne = true;
					break;
				}
			}
			if (!foundOne) {
				points.push(new Point(rx, ry));
				updateCoaster();
			}
		});

		canvas.addEventListener('mousemove', (e) => {
			mousePos = {
				x: e.clientX,
				y: e.clientY
			};
			if (draggingPoint !== -1) {
				points[draggingPoint].x = camera.inverseTransformX(e.clientX);
				points[draggingPoint].y = camera.inverseTransformY(e.clientY);

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

				updateCoaster();
			}
			if (draggingCamera) {
				console.log('DRAGGING');
				let p = camera.getTopLeft();
				camera.updateTopLeft(new Point(p.x - e.movementX, p.y + e.movementY));
			}
		});
		canvas.addEventListener('mouseup', (e) => {
			if (draggingPoint != -1) {
				draggingPoint = -1;
			}
		});
		points.push(new Point(window.innerWidth, 0));
		updateCoaster();
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

		let rc = new RenderingContext(camera, context, canvas);

		drawCoaster(rc, /* precision = */ 10, coaster);
		drawKnots(rc, points, draggingPoint);
		drawCoasterParticipant(rc, x, coaster.getHeight(x));

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

		speed = 2 * Math.sqrt((canvas.height * 2) / 3 - coaster.getHeight(x));

		x = rungeKuttaStep(x, 0, 0.1, v_prime);
		// x = eulersStep(x, 0, 0.1, v_prime);

		let min = points.map((p) => p.x).reduce((acc, x) => Math.min(acc, x));
		let max = points.map((p) => p.x).reduce((acc, x) => Math.max(acc, x));

		if (x < min) {
			x += max - min;
		}
		if (x > max) {
			x -= max - min;
		}

		requestAnimationFrame(draw);
	};
</script>

<canvas bind:this={canvas}></canvas>

{#if infoToggled}
	<div class="info">
		<p>
			<strong class="underline">Total area of your coaster:</strong>
			{Math.round(area)} square pixels.
		</p>
		<p>
			<strong class="underline">Maximum acceleration felt by your coaster riders:</strong>
			{Math.round(maxAcceleration * 100) / 100} pixels per square second.
		</p>
		<p>
			<strong class="underline">Current coaster speed:</strong>
			{Math.round(speed)} pixels per second.
		</p>
	</div>
{/if}

<style>
	canvas {
		position: fixed;
		left: 0;
		top: 0;
	}

	.info {
		position: fixed;
		left: 10vw;
		width: 80vw;
		top: 10vh;
		height: 80vh;

		border-radius: 20px;
		padding: 30px;

		background: rgba(0, 0, 0, 0.5);
		color: white;
	}
</style>
