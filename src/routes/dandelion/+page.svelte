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
		mag
	} from 'aninest';
	import { createParticle } from './particle';
	import { getInterpingToProxy, getUpdateLayer } from '@aninest/extensions';
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';
	import { createNoise3D } from 'simplex-noise';

	const screenDimensions = $state(newVec2(0, 0));

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
		const scalar = 0.5 * Math.min(untrackedDims.y, untrackedDims.x / 1.5);
		const ops: (Op<number> | Op<Vec2>)[] = [
			[divScalar, mulScalar, scalar],
			[addVec, subVec, newVec2(-1.5, -2)],
			[mulVec, divVec, newVec2(5, -5)]
		];
		const adjusted = ops.reduce((prev, curr) => {
			return curr[0](prev, curr[2] as number & Vec2);
		}, pos);
		const { x, y } = adjusted;
		const relu = (a: number) => Math.max(a, 0);

		const spiralCenter = newVec2(0, 2);

		if (mag(subVec(spiralCenter, adjusted)) < 0.5) return newVec2(0, 0);

		const spiral = newVec2(
			Math.min(2 / mag(subVec(adjusted, spiralCenter)), 4) *
				(-10 * (x - spiralCenter.x) + 50 * (y - spiralCenter.y)),
			Math.min(2 / mag(subVec(adjusted, spiralCenter)), 4) *
				(-50 * (x - spiralCenter.x) - 10 * (y - spiralCenter.y))
		);

		let yOut =
			// focus to middle
			// 0.1 * mag(subVec(adjusted, spiralCenter)) * subVec(spiralCenter, adjusted).y +
			// spiral
			spiral.y +
			// offshoot
			0.05 *
				mag(subVec(adjusted, spiralCenter)) *
				(relu(y - spiralCenter.y) *
					(1 / Math.max(relu(y - spiralCenter.y) - 0.1 * relu(x - spiralCenter.x), 0.5)) *
					0.1) -
			Math.min(
				0.1 *
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
					(1 / Math.max(relu(x - spiralCenter.x) - relu(y - spiralCenter.y), 2)) *
					0.1);
		// stem
		yOut += relu(spiralCenter.y - 4 - y) * 20 * (0.2 / Math.max(Math.abs(spiralCenter.x - x), 0.2));
		xOut +=
			Math.min(
				-spiral.x * (relu(spiralCenter.y - 2 - y) / 15),
				-spiral.x * Math.sign(spiralCenter.y - 2 - y)
			) +
			relu(spiralCenter.y - 4 - y) * Math.sign(spiralCenter.x - x) * Math.abs(spiralCenter.x - x);

		let out: Vec2 = mulVec(newVec2(xOut + Math.random(), yOut + Math.random()), newVec2(100, -100));
		// wind
		out = addVec(
			out,
			mulScalar(
				newVec2(xNoise3D(x * 10, y * 10, time), yNoise3D(x * 10, y * 10, time)),
				Math.sqrt((mag(out) + 50) * mag(out))
			)
		);
		return out;
	};

	$effect(() => {
		const untrackedDims = untrack(() => screenDimensions);
		if (!ctx || !browser || !untrackedDims) return;
		const unsubMap = new WeakMap();
		const interval = setInterval(() => {
			for (let i = 0; i < 4; i++) {
				const particle = createParticle(vectorField, untrackedDims);
				const { step } = getInterpingToTree(particle.anim);
				const unsub = updateLayer.mount(particle.anim);
				unsubMap.set(particle.anim, unsub);
				step(true);
			}
		}, 10);
		setTimeout(() => {
			clearInterval(interval);
		}, 10000);
		type Particle = AnimatableOf<ReturnType<typeof createParticle>['anim']>;
		const updateLayer = getUpdateLayer<Particle>();

		updateLayer.subscribe('end', (anim) => {
			const { reset } = getInterpingToTree(anim);
			reset(screenDimensions);
		});

		updateLayer.subscribe('updateWithDeltaTime', (dt) => {
			time += 4 * dt;
			console.log(Math.round(1 / dt));
			ctx.clearRect(0, 0, untrackedDims.x * devicePixelRatio, untrackedDims.y * devicePixelRatio);
		});

		updateLayer.subscribe('update', (particle) => {
			ctx.strokeStyle = 'rgb(0, 0, 0)';
			const { draw } = getInterpingToProxy(particle);
			draw(ctx);
		});
		return () => {
			clearInterval(interval);
		};
	});

	$effect(() => {
		if (!canvas) return;
		canvas.style.position = 'relative';
		canvas.style.top = '0';
		canvas.style.left = '0';
		canvas.style.overflow = 'hidden';
		canvas.style.touchAction = 'none';
	});

	$effect(() => {
		if (!canvas) return;
		canvas.width = screenDimensions.x * devicePixelRatio;
		canvas.height = screenDimensions.y * devicePixelRatio;
		canvas.style.width = screenDimensions.x + 'px';
		canvas.style.height = screenDimensions.y + 'px';
	});
</script>

<svelte:window bind:innerWidth={screenDimensions.x} bind:innerHeight={screenDimensions.y} />

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		display: block;
		width: 100svw;
		height: 100svh;
	}
</style>
