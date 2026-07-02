<script>
	import '@fontsource-variable/atkinson-hyperlegible-next';
	import Dandelion from './(anims)/dandelion/Dandelion.svelte';
	import { getUpdateLayer } from '@aninest/extensions';
	import { changeInterpFunction, createAnimation, getSlerp, getStateTree, modifyTo } from 'aninest';
	import { Play, Pause, Maximize2 } from '@lucide/svelte';
	import Player from '$lib/Player.svelte';
	import Footer from '$lib/Footer.svelte';
	import Porcupine from './(anims)/porcupine/Porcupine.svelte';

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
</script>

<svelte:head>
	<title>Creative Experiments</title>
</svelte:head>

<main>
	<h1>Creative Experiments</h1>

	<h2>Generative Line Art</h2>
	<div class="flex">
		<Player {mainLayer} title="Dandelion" link="./dandelion">
			{#snippet children(updateLayer)}
				<Dandelion parentUpdateLayer={updateLayer} particleCount={500}></Dandelion>
			{/snippet}
		</Player>

		<Player {mainLayer} title="Porcupine" link="./porcupine">
			{#snippet children(updateLayer)}
				<Porcupine parentUpdateLayer={updateLayer}></Porcupine>
			{/snippet}
		</Player>
	</div>
</main>

<Footer></Footer>

<style>
	.flex {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
	}

	main {
		min-height: 100lvh;
		padding: 0.25rem 1rem;
	}
</style>
