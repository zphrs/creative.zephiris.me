<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';

	let { children } = $props();
</script>

<a href="../">
	<ArrowLeft></ArrowLeft>
	Go Back
</a>

{@render children()}

<style>
	a {
		display: inline-flex;
		align-items: center;
		vertical-align: middle;
		gap: 0.5rem;
		text-decoration: none;
		position: relative;
		z-index: 20;
	}
</style>
