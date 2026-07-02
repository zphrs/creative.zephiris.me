<script lang="ts">
	import { getUpdateLayer, type UpdateLayer } from '@aninest/extensions';
	import { Maximize2, Pause, Play } from '@lucide/svelte';
	import {
		changeInterpFunction,
		createAnimation,
		getSlerp,
		getStateTree,
		modifyTo,
		type UnknownAnimatable
	} from 'aninest';
	import type { Snippet } from 'svelte';

	let {
		children,
		title,
		link,
		mainLayer,
		maximizeInNewWindow
	}: {
		children: Snippet<[UpdateLayer<UnknownAnimatable>]>;
		title: string;
		link: string;
		mainLayer: UpdateLayer<UnknownAnimatable>;
		maximizeInNewWindow: boolean;
	} = $props();

	const playInterp = createAnimation({ playDandelion: 1 }, getSlerp(3));
	const timeoutHandler = setTimeout(() => {
		modifyTo(playInterp, { playDandelion: 0 });
	}, 0);
	let playing = $state(false);
	let playingFromMove = $state(false);
	mainLayer.mount(playInterp);
	let scaledTime = performance.now();
	let prevTime = performance.now();
	const updateLayer = getUpdateLayer((callback) => {
		const { playDandelion } = getStateTree(playInterp);
		if (playDandelion == 0) {
			let unsub = mainLayer.subscribe('afterUpdate', () => {
				requestAnimationFrame(() => callback(0));
				unsub();
			});
			return;
		}
		requestAnimationFrame((time) => {
			const diff = time - prevTime;
			prevTime = time;
			scaledTime += diff * playDandelion;

			callback(scaledTime);
		});
	});
</script>

<div class="parent">
	<div
		class="preview"
		onpointerdown={() => {
			clearTimeout(timeoutHandler);
			if (!playing) {
				changeInterpFunction(playInterp, getSlerp(0.0));
				modifyTo(playInterp, { playDandelion: 1 });
				playingFromMove = true;
			}
		}}
		onpointerout={() => {
			if (playingFromMove) {
				changeInterpFunction(playInterp, getSlerp(1));
				modifyTo(playInterp, { playDandelion: 0 });
				playingFromMove = false;
			}
		}}
		onpointerup={() => {
			if (playingFromMove) {
				changeInterpFunction(playInterp, getSlerp(1));
				modifyTo(playInterp, { playDandelion: 0 });
				playingFromMove = false;
			}
		}}
	>
		{@render children(updateLayer)}
	</div>
	<a
		class="open"
		href={link}
		target={maximizeInNewWindow ? '_blank' : undefined}
		rel={maximizeInNewWindow ? 'noopener noreferrer' : undefined}
	>
		<Maximize2></Maximize2>
	</a>
	<button
		class="toggle-play"
		onclick={() => {
			clearTimeout(timeoutHandler);
			playingFromMove = false;
			if (playing) {
				modifyTo(playInterp, { playDandelion: 0 });
				playing = false;
			} else {
				changeInterpFunction(playInterp, getSlerp(1));
				modifyTo(playInterp, { playDandelion: 1 });
				playing = true;
			}
		}}
	>
		{#if playing || playingFromMove}
			<Pause aria-label="Pause"></Pause>
		{:else}
			<Play aria-label="Play"></Play>
		{/if}
	</button>
	<h3>{title}</h3>
</div>

<svelte:window
	onresize={() => {
		if (!playing && !playingFromMove) {
			changeInterpFunction(playInterp, getSlerp(0.0));
			modifyTo(playInterp, { playDandelion: 1 });
			changeInterpFunction(playInterp, getSlerp(1));
			modifyTo(playInterp, { playDandelion: 0 });
		}
	}}
/>

<style>
	.preview {
		width: 100%;
		aspect-ratio: 1;
	}

	.parent {
		position: relative;
		margin: 1rem;
		display: block;
		flex-basis: 300px;
		max-width: min(600px, 80svh);
		background-color: var(--gray-95);
		border-radius: 1rem;
		text-decoration: none;
		text-align: center;
		position: relative;
		flex-grow: 1;
		overflow: hidden;
	}
	@media (prefers-color-scheme: dark) {
		.parent {
			background-color: var(--gray-5);
		}
	}
	button {
		position: absolute;
		top: 1rem;
		left: 1rem;
		border-radius: 50%;
		aspect-ratio: 1;
		border: none;
		width: 35px;
		display: flex;
		background-color: transparent;
		border: 1px solid var(--gray-1);
		box-sizing: border-box;
		align-items: center;
		justify-content: center;
		z-index: 2;
	}
	button:hover {
		background-color: var(--gray-90);
	}
	@media (prefers-color-scheme: dark) {
		button {
			border-color: var(--gray-99);
		}
		button:hover {
			background-color: var(--gray-20);
		}
	}
	.open {
		position: absolute;
		top: 1rem;
		right: 1rem;
	}
	.toggle-play {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
	}
	h3 {
		margin: 0;
		position: absolute;
		bottom: min(1rem, 5vw);
		left: 50%;
		transform: translateX(-50%);
		display: inline-flex;
		justify-content: center;
		vertical-align: middle;
		align-items: center;
		background-color: var(--gray-95);
		padding: 0.125rem 0.25rem;
		border-radius: 0.5rem;
		font-size: min(1em, 5vw);
		touch-action: none;
		pointer-events: none;
	}

	@media (prefers-color-scheme: dark) {
		h3 {
			background-color: var(--gray-5);
		}
	}
</style>
