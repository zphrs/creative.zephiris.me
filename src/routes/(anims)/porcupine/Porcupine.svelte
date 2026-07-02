<script lang="ts">
	import {
		type Vec2,
		changeInterpFunction,
		createAnimation,
		getStateTree,
		getLinearInterp,
		getSlerp,
		modifyTo,
		newVec2,
		updateAnimation,
		getLocalState,
		getLocalInterpingTo,
		mag,
		addLocalListener,
		subVec,
		type Animation,
		ZERO_VEC2,
		copy,
		copyObject,
		type unsubscribe,
		type UnknownAnimatable
	} from 'aninest';
	import { getUpdateLayer, type UpdateLayer } from '@aninest/extensions';
	import { onMount } from 'svelte';

	let {
		parentUpdateLayer,
		lineCount
	}: { parentUpdateLayer?: UpdateLayer<UnknownAnimatable>; lineCount?: number } = $props();

	type Color = { r: number; g: number; b: number };

	type Line = {
		shape: {
			p1: { x: number; y: number };
			p2: { x: number; y: number };
		};
		color: Color;
	};

	let canvas: HTMLCanvasElement | undefined = $state(undefined);
	const screenDimensions = $state({ x: 0, y: 0 });

	const WHITE: Color = { r: 255, g: 255, b: 255 };
	onMount(() => {
		if (!canvas) return;
		const updateLayer = getUpdateLayer(requestAnimationFrame);
		const unmount = parentUpdateLayer && updateLayer.setParent(parentUpdateLayer);
		const createLine = (p1: Vec2, p2: Vec2, color: Color = WHITE) => {
			const shapeCache: { p1: Vec2; p2: Vec2 } = { p1: copy(ZERO_VEC2), p2: copy(ZERO_VEC2) };
			const colorCache: Color = copyObject(WHITE);
			// set global interp function to slerp(1s)
			const anim = createAnimation<Line>({ shape: { p1, p2 }, color }, getSlerp(1));
			updateLayer.mount(anim);
			// set interp function of color to linearInterp(0.5)
			changeInterpFunction(anim, getLinearInterp(0.5), { shape: false });
			const setColor = (ctx: CanvasRenderingContext2D) => {
				const color = getLocalState(anim.children.color, colorCache);
				ctx.strokeStyle = `rgb(${color.r} ${color.g} ${color.b})`;
			};
			const drawLine = (ctx: CanvasRenderingContext2D) => {
				getStateTree(anim.children.shape, shapeCache);
				ctx.beginPath();
				ctx.moveTo(shapeCache.p1.x, shapeCache.p1.y);
				ctx.lineTo(shapeCache.p2.x, shapeCache.p2.y);
				ctx.stroke();
			};
			const draw = (ctx: CanvasRenderingContext2D) => {
				setColor(ctx);
				drawLine(ctx);
			};
			const animLoop = (dt: number) => {
				return updateAnimation(anim, dt);
			};
			const onPointChange = (animInfo: Animation<Vec2>) => {
				if (!canvas) return;

				const oldPt = getLocalInterpingTo(animInfo);
				const newPt: Vec2 = getLocalState(animInfo);
				// subtract the vectors to get the difference
				const diff = Math.max(mag(subVec(newPt, oldPt)), 1);

				const screenMag = mag(newVec2(canvas.width, canvas.height));
				const innerDt = (performance.now() - lastClicked) / 1000;
				const sinceLastClick = innerDt > 0.64 ? Math.log(innerDt + 1) : 0;

				changeInterpFunction(
					animInfo,
					getSlerp(
						Math.min(
							(diff / screenMag) * (Math.random() + 0.2) * 10 * Math.max(sinceLastClick, 0.5),
							10
						)
					)
				);
			};
			addLocalListener(anim.children.shape.children.p1, 'start', () =>
				onPointChange(anim.children.shape.children.p1)
			);
			addLocalListener(anim.children.shape.children.p2, 'start', () =>
				onPointChange(anim.children.shape.children.p2)
			);
			let cancelRandomize: unsubscribe | undefined = undefined;
			const out = {
				setP1(p1: Vec2) {
					modifyTo(anim.children.shape, { p1 });
				},
				setPoints(points: { p1: Vec2; p2: Vec2 }) {
					modifyTo(anim.children.shape, points);
				},
				setP2(p2: Vec2) {
					modifyTo(anim.children.shape, { p2 });
				},
				setColor(color: Color) {
					return modifyTo(anim, { color });
				},
				randomize(withTimeout: boolean) {
					if (cancelRandomize) cancelRandomize();
					cancelRandomize = randomizeLine(out, withTimeout);
				},
				update: animLoop,
				draw: draw,
				symbol: Symbol()
			};
			return out;
		};
		const increasinglySlower = (x: number) => {
			return Math.min(x, 100_000_000_000);
		};
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
		type DrawableLine = ReturnType<typeof createLine>;
		const lines: ReturnType<typeof createLine>[] = [];
		updateLayer.subscribe('updateWithDeltaTime', () => {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			lines.forEach((line) => line.draw(ctx));
		});
		$effect(() => {
			if (!canvas) return;
			canvas.width = screenDimensions.x * devicePixelRatio;
			canvas.height = screenDimensions.y * devicePixelRatio;
			lines.forEach((line) => line.draw(ctx));
		});
		const randColor = () => {
			const sinceLastClick = (performance.now() - lastClicked) / 1000;
			const inv = 1 / (sinceLastClick + 1);
			const brightness = inv * 155;
			const randomness = ((1 - inv) * 155 + 100) * Math.random();
			return Math.floor(brightness + randomness);
		};

		const randomizeLine = (line: DrawableLine, withTimeout = true) => {
			if (!canvas) return;

			// wait for a random amount of time
			const canvasMag = mag(newVec2(canvas.width, canvas.height));
			const p1 = newVec2(canvas.width * Math.random(), canvas.height * Math.random());
			const r = Math.max(canvasMag * 0.1 * Math.exp(-Math.random() * 10), 50);
			// randomize the line
			// toCenterNorm.x += Math.random() * 0.5 - 0.25
			// toCenterNorm.y += Math.random() * 0.5 - 0.25
			// const xOff = toCenterNorm.x * r
			// const yOff = toCenterNorm.y * r
			const theta = Math.random() < 0.5 ? Math.PI / 2 : 0;
			const xOff = Math.cos(theta) * r;
			const yOff = Math.sin(theta) * r;
			line.setP1(p1);
			line.setP2({
				x: p1.x + xOff,
				y: p1.y + yOff
			});
			line.setColor({
				r: randColor(),
				g: randColor(),
				b: randColor()
			});
			if (!withTimeout) return;
			const sinceLastClick = (performance.now() - lastClicked) / 1000;
			const cancel = setTimeout(
				() => line.randomize(withTimeout),
				increasinglySlower(1000 * Math.random() + 1000) * sinceLastClick + 1000 * Math.random()
			);
			return () => clearTimeout(cancel);
		};
		const randomizeLines = (withTimeout = true) => {
			const sinceLastClick = (performance.now() - lastClicked) / 1000;
			for (let line of lines) {
				setTimeout(
					() => line.randomize(withTimeout),
					increasinglySlower(10000 * Math.random() * sinceLastClick + 1000 * sinceLastClick + 50)
				);
			}
		};
		let lastClicked = performance.now();

		const onUp = async () => {
			if (downCt != 0) randomizeLines();
			downCt = Math.max(0, downCt - 1);
		};

		let downCt = 0;
		const onMove = (e: PointerEvent) => {
			if (downCt === 0) return;
			const elementOffset = canvas!.getBoundingClientRect();

			const x = (e.clientX - elementOffset.x) * devicePixelRatio;
			const y = (e.clientY - elementOffset.y) * devicePixelRatio;
			const p = newVec2(x, y);
			const points = { p1: p, p2: p };
			lines.forEach((line) => {
				line.setPoints(points);
			});
			lastClicked = performance.now();
		};

		const onDown = (e: PointerEvent) => {
			downCt++;
			onMove(e);
		};

		canvas.style.touchAction = 'none';
		setTimeout(() => {
			if (!canvas) return;
			const canvasMag = mag(newVec2(canvas.width, canvas.height));
			for (let i = 0; i < canvasMag; i++) {
				const canvasCenter = newVec2(canvas.width / 2, canvas.height / 2);
				lines.push(createLine(canvasCenter, canvasCenter));
			}

			// even though the interval in between each refresh is randomized
			// the animation always moves smoothly regardless
			randomizeLines();
		}, 0);

		canvas.addEventListener('pointerup', onUp);
		canvas.addEventListener('pointerleave', onUp);
		canvas.addEventListener('pointerdown', onDown);
		canvas.addEventListener('pointermove', onMove);

		return unmount;
	});
</script>

<canvas
	bind:this={canvas}
	bind:clientWidth={screenDimensions.x}
	bind:clientHeight={screenDimensions.y}
></canvas>

<style>
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
