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
		sleep
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
		const scalar = 2 * Math.min(untrackedDims.x, untrackedDims.y);
		const ops: (Op<number> | Op<Vec2>)[] = [
			[divScalar, mulScalar, scalar],
			[addVec, subVec, newVec2(-0.5, -0.5)],
			[mulVec, divVec, newVec2(20, -20)]
		];
		const adjusted = ops.reduce((prev, curr) => {
			return curr[0](prev, curr[2] as number & Vec2);
		}, pos);
		const { x, y } = adjusted;
		const relu = (a: number) => Math.max(a, 0);

		const spiralCenter = newVec2(0, 2);

		let yOut =
			// focus to middle
			2 * mag(subVec(adjusted, spiralCenter)) * subVec(spiralCenter, adjusted).y +
			// spiral
			Math.min(2 / mag(subVec(adjusted, spiralCenter)), 4) *
				(-10 * (x - spiralCenter.x) - 10 * (y - spiralCenter.y)) +
			// offshoot
			10 *
				mag(subVec(adjusted, spiralCenter)) *
				(relu(x - spiralCenter.x) *
					relu(y - spiralCenter.y) *
					(1 / Math.max(relu(y - spiralCenter.y) - relu(x - spiralCenter.x), 2)) *
					0.1);
		let xOut =
			// focus to middle
			2 * mag(subVec(adjusted, spiralCenter)) * subVec(spiralCenter, adjusted).x +
			// spiral
			Math.min(2 / mag(subVec(adjusted, spiralCenter)), 4) *
				(-10 * (x - spiralCenter.x) + 10 * (y - spiralCenter.y)) +
			// offshoot
			10 *
				mag(subVec(adjusted, spiralCenter)) *
				(relu(y) *
					relu(x - spiralCenter.x) *
					(1 / Math.max(relu(x - spiralCenter.x) - relu(y - spiralCenter.y), 2)) *
					0.1);
		// stem
		yOut -= (relu(spiralCenter.y - 4 - y) * (yOut * Math.abs(spiralCenter.x - x))) / 10;
		xOut +=
			relu(spiralCenter.y - 4 - y) * Math.sign(spiralCenter.x - x) * (spiralCenter.x - x) ** 2 * 10;
		// }
		let out: Vec2 = mulVec(newVec2(xOut, yOut), newVec2(100, -100));
		out = addVec(
			out,
			mulScalar(newVec2(xNoise3D(x, y, time), yNoise3D(x, y, time)), mag(out) * 0.5)
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
				step();
			}
		}, 1);
		setTimeout(() => {
			clearInterval(interval);
		}, 10000);
		type Particle = AnimatableOf<ReturnType<typeof createParticle>['anim']>;
		const updateLayer = getUpdateLayer<Particle>();

		updateLayer.subscribe('end', (anim) => {
			const { reset, step } = getInterpingToTree(anim);
			sleep(Math.random()).then(() => {
				reset(screenDimensions);
				step();
			});
		});

		updateLayer.subscribe('updateWithDeltaTime', (dt) => {
			time += dt;
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
