<script lang="ts">
	import { RenderingContext, StandardCamera, type Camera } from '$lib/camera';
	import { CubicCoaster, type Coaster } from '$lib/coaster';
	import {
		approximateDerivate,
		CubicPiecewise,
		getCubicSpline,
		rungeKuttaStep
	} from '$lib/methods';
	import { Point } from '$lib/point';
	import {
		drawCoaster,
		drawCoasterParticipant,
		drawCubic,
		drawKnots,
		drawForces
	} from '$lib/visuals';
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let points: Point[] = [new Point(0, 0)];

	let mousePos = { x: 0, y: 0 };

	let draggingPoint = -1;

	let draggingCamera = false;

	let coaster: CubicPiecewise;
	let area: number;
	let displaySpeed: number;
	let displayAcceleration: number;
	let displayJerk: number;

	let speed: number;
	let x = 0.01;

	let camera: Camera;

	let debug = {
		components: false,
		forces: false,
		follow: false
	};

	const feetPerPixels = () => {
		return 100 / window.innerWidth;
	};

	const updateCoaster = () => {
		coaster = getCubicSpline(points);
		area = coaster.computeIntegral() * feetPerPixels();
	};

	onMount(() => {
		context = canvas.getContext('2d')!;
		camera = new StandardCamera(canvas);

		window.addEventListener('keydown', (e) => {
			if (e.key === 'Shift') {
				draggingCamera = true;
			} else if (e.key === 'Backspace') {
				points = [new Point(0, 0), new Point(window.innerWidth, 0)];
				updateCoaster();
			} else if (e.key === 'p') {
				x = camera.inverseTransformX(mousePos.x);
			}
		});

		window.addEventListener('keyup', (e) => {
			if (e.key === 'Shift') {
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
		points.push(new Point(canvas.clientWidth, 0));
		updateCoaster();
		draw(0);
	});

	let lastTime = 0;

	const draw = (time: number) => {
		let delta = time - lastTime;
		lastTime = time;

		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;

		context.fillStyle = 'skyblue';
		context.fillRect(0, 0, canvas.width, canvas.height);

		let factor = 30;

		let v_prime = (t: number, x: number) => {
			let v = factor * Math.sqrt(Math.max(0, (canvas.height * 2) / 3 - coaster.compute(x)));
			let theta = Math.atan(coaster.computeDerivative(x));
			return Math.cos(theta) * v;
		};

		speed = factor * Math.sqrt((canvas.height * 2) / 3 - coaster.compute(x));
		displayAcceleration =
			approximateDerivate(
				x,
				0.001,
				(x) =>
					(factor * Math.sqrt((canvas.height * 2) / 3 - coaster.compute(x)) * feetPerPixels()) /
					1.467
			) * 60;

		displayJerk =
			approximateDerivate(
				x,
				0.001,
				(x) =>
					approximateDerivate(
						x,
						0.001,
						(y) =>
							(factor * Math.sqrt((canvas.height * 2) / 3 - coaster.compute(y)) * feetPerPixels()) /
							1.467
					) * 60
			) * 60;

		x = rungeKuttaStep(x, 0, delta / 1000, v_prime);
		// x = eulersStep(x, 0, 0.1, v_prime);

		let min = points.map((p) => p.x).reduce((acc, x) => Math.min(acc, x));
		let max = points.map((p) => p.x).reduce((acc, x) => Math.max(acc, x));

		if (x < min) {
			x += max - min;
		}
		if (x > max) {
			x -= max - min;
		}

		if (debug.follow) {
			camera.updateTopLeft(new Point(x - canvas.width / 2, camera.getTopLeft().y));
		}

		let rc = new RenderingContext(camera, context, canvas);

		drawCoaster(rc, /* precision = */ 10, coaster);
		if (debug.components) {
			drawCubic(rc, /* precision = */ 10, coaster, x);
		}
		drawKnots(rc, points, draggingPoint);
		drawCoasterParticipant(rc, x, coaster);
		if (debug.forces) {
			drawForces(rc, coaster.computeDerivative(x), x, coaster.compute(x));
		}

		displaySpeed = (speed * feetPerPixels()) / 1.467 /* mph conversion */;

		requestAnimationFrame(draw);
	};
</script>

<canvas bind:this={canvas}></canvas>

<div class="info">
	<p>
		<strong class="underline">Total area of your coaster</strong>
		<br />
		{Math.round(area)} square feet.
	</p>
	<p>
		<strong class="underline">Current coaster speed</strong>
		<br />
		{Math.round(displaySpeed)} miles per hour.
	</p>
	<p>
		<strong class="underline">Current coaster acceleration</strong>
		<br />
		{Math.round(displayAcceleration)} miles per hour per second.
	</p>
	<p>
		<strong class="underline">Current coaster jerk</strong>
		<br />
		{Math.round(displayJerk)} miles per hour per second per second.
	</p>
	<p>
		<button
			class:button-selected={debug.components}
			on:click={() => (debug.components = !debug.components)}>Toggle component drawing</button
		>
		<button class:button-selected={debug.forces} on:click={() => (debug.forces = !debug.forces)}
			>Toggle forces</button
		>
		<button class:button-selected={debug.follow} on:click={() => (debug.follow = !debug.follow)}
			>Toggle follow</button
		>
	</p>
	<strong class="underline">Controls</strong>
	<ul>
		<li>- Place knot: <code>Left Click</code></li>
		<li>- Move knot: Hold <code>Left Click</code></li>
		<li>- Clear tracks: <code>Backspace/Delete</code></li>
		<li>- Re-place coaster: <code>P</code></li>
		<li>- Pan camera: hold <code>Shift</code></li>
	</ul>
</div>

<style>
	canvas {
		position: fixed;
		left: 0;
		top: 0;
		width: 70vw;
		height: 100vh;
	}

	.info {
		position: fixed;
		left: 70vw;
		width: 30vw;
		top: 0vh;
		height: 100vh;
		padding: 30px;
	}

	button {
		border: solid black 1px;
		margin: 3px;
		padding: 3px;
		border-radius: 3px;
	}

	button:hover {
		border-width: 4px;
		margin: 0;
	}

	.button-selected {
		background-color: black;
		color: white;
	}

	code {
		padding: 3px;
		border-radius: 5px;
		background-color: rgb(244, 244, 244);
	}
</style>
