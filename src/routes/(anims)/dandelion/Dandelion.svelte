<script lang="ts">
	import {
		divScalar,
		mulScalar,
		newVec2,
		type Vec2,
		type AnimatableOf,
		ZERO_VEC2,
		addVec,
		mulVec,
		subVec,
		divVec,
		getInterpingToTree,
		mag,
		type UnknownAnimatable,
		type unsubscribe,
		magSquared
	} from 'aninest';
	import { createParticle } from './particle';
	import { getInterpingToProxy, getUpdateLayer, type UpdateLayer } from '@aninest/extensions';
	import { browser } from '$app/environment';
	import { onDestroy, untrack } from 'svelte';
	import { createNoise3D } from 'simplex-noise';

	const screenDimensions = $state({ x: 0, y: 0 });

	let {
		parentUpdateLayer,
		particleCount
	}: { parentUpdateLayer?: UpdateLayer<UnknownAnimatable>; particleCount?: number } = $props();

	let canvas: HTMLCanvasElement | undefined;
	const ctx = $derived(canvas?.getContext('2d'));
	type Op<C> = [
		forward: (prev: Vec2, constant: C) => Vec2,
		backward: (prev: Vec2, constant: C) => Vec2,
		constant: C
	];
	const xNoise3D = createNoise3D();
	const yNoise3D = createNoise3D();
	let time = 0;

	const vectorField = (pos: Vec2): Vec2 => {
		const untrackedDims = untrack(() => screenDimensions);
		if (untrackedDims.x == 0 || untrackedDims.y == 0) return ZERO_VEC2;
		const scalar = window.devicePixelRatio * Math.min(untrackedDims.y, untrackedDims.x);
		const ops: (Op<number> | Op<Vec2>)[] = [
			[divScalar, mulScalar, scalar],
			[addVec, subVec, newVec2(-0.5, -0.5)],
			[mulVec, divVec, newVec2(40, -40)],
			[addVec, subVec, newVec2(2, -7.5)]
		];
		const adjusted = ops.reduce((prev, curr) => {
			return curr[0](prev, curr[2] as number & Vec2);
		}, pos);
		const { x, y } = adjusted;
		const relu = (a: number) => Math.max(a, 0);

		const spiralCenter = newVec2(0, 0);

		if (mag(subVec(spiralCenter, adjusted)) < 0.25) return ZERO_VEC2;

		const spiral = newVec2(
			Math.min(4 / mag(subVec(adjusted, spiralCenter)), 4) *
				(-10 * (x - spiralCenter.x) + 50 * (y - spiralCenter.y)),
			Math.min(4 / mag(subVec(adjusted, spiralCenter)), 4) *
				(-50 * (x - spiralCenter.x) - 10 * (y - spiralCenter.y))
		);

		let yOut =
			// focus to middle
			// 0.1 * mag(subVec(adjusted, spiralCenter)) * subVec(spiralCenter, adjusted).y +
			// spiral
			spiral.y +
			// offshoot
			0.1 *
				mag(subVec(adjusted, spiralCenter)) *
				(relu(y - spiralCenter.y) *
					(1 / Math.max(relu(y - spiralCenter.y) - 0.1 * relu(x - spiralCenter.x), 0.5)) *
					0.1) -
			Math.min(
				0.05 *
					spiral.y *
					Math.max(
						relu(x - spiralCenter.x) *
							relu(y - spiralCenter.y) *
							(1 / Math.max(relu(y - spiralCenter.y) - relu(x - spiralCenter.x), 0.5)) *
							0.1 *
							x,
						1
					),
				0
			);
		let xOut =
			// focus to middle
			// 0.1 * mag(subVec(adjusted, spiralCenter)) * subVec(spiralCenter, adjusted).x +
			// spiral
			spiral.x +
			// offshoot
			10 *
				mag(subVec(adjusted, spiralCenter)) *
				(relu(y) *
					relu(x - spiralCenter.x) *
					(2 / Math.max(relu(x - spiralCenter.x) - relu(y - spiralCenter.y), 2)) *
					0.1);
		// stem
		yOut += Math.max(
			relu(spiralCenter.y - 4 - y) * 20 * (0.5 / Math.max(Math.abs(spiralCenter.x - x + 1), 0.5)),
			10
		);
		xOut +=
			Math.min(
				-spiral.x * (relu(spiralCenter.y - 2 - y) / 15),
				-spiral.x * Math.sign(spiralCenter.y - 2 - y)
			) +
			Math.max(relu(spiralCenter.y - 2 - y), 1) *
				Math.sign(spiralCenter.x - x + 1) *
				Math.abs(spiralCenter.x - x + 1);

		let out: Vec2 = mulVec(newVec2(xOut + Math.random(), yOut + Math.random()), newVec2(100, -100));
		// wind
		out = addVec(
			out,
			mulScalar(
				newVec2(xNoise3D(x, y, time * 4), yNoise3D(x, y, time * 4)),
				Math.min(mag(out) + 2000, 20000)
			)
		);
		return out;
	};

	$effect(() => {
		const untrackedDims = untrack(() => screenDimensions);
		if (!ctx || !browser || !untrackedDims || !canvas) return;

		let particles = 0;
		const unsubSet = new Set();
		const interval = setInterval(() => {
			if (particleCount !== undefined && particleCount < particles) {
				clearInterval(interval);
				return;
			}
			for (let i = 0; i < 1; i++) {
				const particle = createParticle(vectorField, untrackedDims, canvas!);
				const { step } = getInterpingToTree(particle.anim);
				const unsub = updateLayer.mount(particle.anim);
				unsubSet.add(() => {
					particle.unsub();
					unsub();
					console.log('unsubbed');
				});
				step();
			}
			particles += 1;
		}, 1);
		onDestroy(() => {
			for (const value of unsubSet) {
				value();
			}
			clearInterval(interval);
		});
		type Particle = AnimatableOf<ReturnType<typeof createParticle>['anim']>;
		const updateLayer = getUpdateLayer<Particle>();
		console.log(parentUpdateLayer);
		const unmount = parentUpdateLayer && updateLayer.setParent(parentUpdateLayer);

		updateLayer.subscribe('end', (anim) => {
			const { reset } = getInterpingToTree(anim);
			reset(screenDimensions);
		});

		const lightColor = 'rgb(0,0,0)';
		const darkColor = 'rgb(255,255,255)';

		let colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches
			? darkColor
			: lightColor;

		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
			colorScheme = event.matches ? darkColor : lightColor;
		});

		updateLayer.subscribe('updateWithDeltaTime', (dt) => {
			const untrackedDims = untrack(() => screenDimensions);

			time += dt;
			// console.log(Math.round(1 / dt)); // logs fps
			ctx.clearRect(0, 0, untrackedDims.x * devicePixelRatio, untrackedDims.y * devicePixelRatio);
		});

		updateLayer.subscribe('update', (particle) => {
			ctx.strokeStyle = colorScheme;
			const { draw } = getInterpingToProxy(particle);
			draw(ctx);
		});
		return () => {
			if (unmount) unmount();
			clearInterval(interval);
		};
	});

	$effect(() => {
		if (!canvas) return;
		canvas.width = screenDimensions.x * devicePixelRatio;
		canvas.height = screenDimensions.y * devicePixelRatio;
		parentUpdateLayer?.forceUpdate(0);
	});

	$effect(() => {
		if (!canvas) return;
		canvas.style.position = 'relative';
		canvas.style.top = '0';
		canvas.style.left = '0';
		canvas.style.overflow = 'hidden';
		canvas.style.touchAction = 'none';
	});
</script>

<canvas
	bind:clientWidth={screenDimensions.x}
	bind:clientHeight={screenDimensions.y}
	bind:this={canvas}
></canvas>

<style>
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
