<script>
	import '../color.css';
	import '../base.css';

	import favicon from '$lib/assets/favicon.svg';

	// Supports weights 200-800
	import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';

	import atkinsonHyperlegible from '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2?url';
</script>

<svelte:head>
	<meta name="color-scheme" content="light dark" />
	<!-- preload fonts -->
	{#each [atkinsonHyperlegible] as fontLink}
		<link rel="preload" as="font" type="font/woff2" href={fontLink} crossorigin="anonymous" />
	{/each}
	<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="shortcut icon" href="/favicon.ico" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />

	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
</svelte:head>

<slot />

<style>
	:global(body) {
		margin: 0;
	}
</style>
