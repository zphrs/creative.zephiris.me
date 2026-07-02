<script>
	import Dandelion from './Dandelion.svelte';
</script>

<svelte:head>
	<title>Dandelion | Creative Experiments</title>
</svelte:head>

<div class="fill">
	<Dandelion particleCount={2000}></Dandelion>
</div>

<style>
	.fill {
		position: absolute;
		top: 0;
		left: 0;
		width: 100lvw;
		height: 100dvh;
	}
</style>
