<script lang="ts">
	import { CubicCoaster, LinearCoaster, type Coaster } from '$lib/coaster';
	import { getCubicSpline } from '$lib/methods';
	import { Point } from '$lib/point';
	import { drawCoaster, drawCoasterParticipant } from '$lib/visuals';
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let points: Point[] = [new Point(0, 0)];
	let coaster: Coaster = new CubicCoaster(getCubicSpline(points));
	let x = 0;

	onMount(() => {
		context = canvas.getContext('2d')!;
		canvas.addEventListener('click', (e) => {
			points.push(new Point(e.clientX, canvas.height - e.clientY));
			console.log(points);
			coaster = new CubicCoaster(getCubicSpline(points));
		});
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
		drawCoasterParticipant(context, x, canvas.height - coaster.getHeight(x));

		x += delta * 0.3;
		x %= canvas.width;

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
