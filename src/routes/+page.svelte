<script lang="ts">
	import { RenderingContext, StandardCamera, type Camera } from '$lib/camera';
	import { CubicCoaster, type Coaster } from '$lib/coaster';
	import { getCubicSpline } from '$lib/methods';
	import { Point } from '$lib/point';
	import { drawCoaster, drawCoasterParticipant, drawKnots } from '$lib/visuals';
	import { onMount } from 'svelte';
	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let points: Point[] = [new Point(0, 0)];

	let draggingPoint = -1;

	let draggingCamera = false;

	let coaster: Coaster;
	let camera: Camera;

	let v = 1;
	let x = 0.1;

	onMount(() => {
		context = canvas.getContext('2d')!;
		camera = new StandardCamera(canvas);

		window.addEventListener('keydown', (e) => {
			if (e.key === ' ') {
				draggingCamera = true;
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
				coaster = new CubicCoaster(getCubicSpline(points));
				v = 1;
				x = 0.1;
			}
		});

		canvas.addEventListener('mousemove', (e) => {
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

				coaster = new CubicCoaster(getCubicSpline(points));
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

		let rc = new RenderingContext(camera, context, canvas);

		drawCoaster(rc, /* precision = */ 10, coaster);
		drawKnots(rc, points, draggingPoint);
		drawCoasterParticipant(rc, x, coaster.getHeight(x));

		x += v * delta * Math.cos(Math.atan(coaster.getSlant(x)));
		v -= Math.sin(Math.atan(coaster.getSlant(x))) * 0.01;

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

<style>
	canvas {
		position: fixed;
		left: 0;
		top: 0;
	}
</style>
