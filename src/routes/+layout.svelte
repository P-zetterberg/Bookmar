<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/popup.css';
	import { setupConvex } from 'convex-svelte';

	const { children } = $props();
	setupConvex('https://coordinated-meadowlark-491.convex.cloud');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
