<script lang="ts">
	import { RenderingContext, StandardCamera, type Camera } from '$lib/camera';
	import { CubicCoaster, type Coaster } from '$lib/coaster';
	import { CubicPiecewise, getCubicSpline, rungeKuttaStep } from '$lib/methods';
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

	let infoToggled = false;

	let coaster: CubicPiecewise;
	let area: number;
	let maxAcceleration: number;
	let displaySpeed: number;

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
		maxAcceleration = coaster.getMaxSecondDerivative() * feetPerPixels();
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

		let factor = 30;

		let v_prime = (t: number, x: number) => {
			let v = factor * Math.sqrt(Math.max(0, (canvas.height * 2) / 3 - coaster.compute(x)));
			let theta = Math.atan(coaster.computeDerivative(x));
			return Math.cos(theta) * v;
		};

		speed = factor * Math.sqrt((canvas.height * 2) / 3 - coaster.compute(x));

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

{#if infoToggled}
	<div class="info">
		<p>
			<strong class="underline">Total area of your coaster:</strong>
			{Math.round(area)} square feet.
		</p>
		<p>
			<strong class="underline">Maximum acceleration:</strong>
			{Math.round(maxAcceleration * 100) / 100} feet per square second.
		</p>
		<p>
			<strong class="underline">Current coaster speed:</strong>
			{Math.round(displaySpeed)} miles per hour.
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

	button {
		border: solid white 1px;
		padding: 3px;
		border-radius: 3px;
	}

	.button-selected {
		background-color: white;
		color: black;
	}
</style>
