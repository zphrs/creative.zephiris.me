<script lang="ts">
	import '@fontsource-variable/atkinson-hyperlegible-next';
	import Dandelion from '../(anims)/dandelion/Dandelion.svelte';
	import { getUpdateLayer } from '@aninest/extensions';
	import { changeInterpFunction, createAnimation, getSlerp, getStateTree, modifyTo } from 'aninest';
	import { Play, Pause, Maximize2 } from '@lucide/svelte';
	import Player from '$lib/Player.svelte';
	import Footer from '$lib/Footer.svelte';
	import Porcupine from '../(anims)/porcupine/Porcupine.svelte';
	import { onMount } from 'svelte';

	let mainLayer = getUpdateLayer();
	const playInterp = createAnimation({ playDandelion: 1 }, getSlerp(3));
	const timeoutHandler = setTimeout(() => {
		modifyTo(playInterp, { playDandelion: 0 });
	}, 0);
	let playing = $state(false);
	let playingFromMove = $state(false);
	mainLayer.mount(playInterp);
	let scaledTime = performance.now();
	let prevTime = performance.now();
	const dandelionUpdateLayer = getUpdateLayer((callback) => {
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
	let bodyHeight = $state(0);

	const postHeight = () => {
		window?.parent.postMessage(bodyHeight, { targetOrigin: '*' });
	};

	$effect(postHeight);
	onMount(() => {
		const id = setInterval(postHeight, 10);
		setTimeout(() => {
			clearInterval(id);
		}, 1000);
	});
</script>

<div bind:offsetHeight={bodyHeight} class="flex">
	<Player {mainLayer} title="Dandelion" link="./dandelion" maximizeInNewWindow={true}>
		{#snippet children(updateLayer)}
			<Dandelion parentUpdateLayer={updateLayer} particleCount={500}></Dandelion>
		{/snippet}
	</Player>

	<Player {mainLayer} title="Porcupine" link="./porcupine" maximizeInNewWindow={true}>
		{#snippet children(updateLayer)}
			<Porcupine parentUpdateLayer={updateLayer}></Porcupine>
		{/snippet}
	</Player>
</div>

<style>
	:global(body) {
		overflow: hidden;
		height: 100vh;
	}
	.flex {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.flex > :global(*) {
		max-width: 600px;
	}
</style>
