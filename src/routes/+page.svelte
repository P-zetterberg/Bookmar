<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { BookmarkPlus, ExternalLink } from '@lucide/svelte';
	import { api } from '../convex/_generated/api.js';
	import { useQuery, useConvexClient } from 'convex-svelte';

	interface Bookmark {
		title: string;
		url: string;
		tags: string[];
		favicon?: string;
	}

	interface Model {
		_id: string;
		name: string;
		url: string;
	}

	const client = useConvexClient();
	const links = useQuery(api.links.get, {});
	const models = useQuery(api.models.get, {});

	let tags = $state('');
	let activeTab = $state<'links' | 'models'>('links');
	let modelSearchQuery = $state('');

	onMount(async () => {
		const authResult = await chrome.storage.session.get('authenticated');
		const isAuthenticated = authResult.authenticated === 'true';
		if (!isAuthenticated) {
			goto('/pin');
			return;
		}
	});
	async function addBookmark(url: string, tags: string, title: string = '', favicon?: string) {
		let formattedUrl = url;
		if (!/^https?:\/\//i.test(url)) {
			formattedUrl = `https://${url}`;
		}

		const tagArray = tags
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag !== '');

		await client.mutation(api.links.create, {
			url: formattedUrl,
			title: title,
			tags: tagArray,
			favicon: favicon
		});
	}

	let SearchQuery = $state('');
	let filteredLinks = $derived<Bookmark[]>(
		(links.data || [])
			.filter((link) => {
				const query = SearchQuery.toLowerCase();
				// Ensure tags is an array before searching
				const tagsArray = Array.isArray(link.tags) ? link.tags : Object.values(link.tags || {});
				return (
					link.url.toLowerCase().includes(query) ||
					link.title?.toLowerCase().includes(query) ||
					tagsArray.some((tag) => String(tag).toLowerCase().includes(query))
				);
			})
			.reverse()
	);

	async function handleBookmarkCurrentTab() {
		// Get the current active tab
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tab && tab.url && tab.title) {
			addBookmark(tab.url, tags, tab.title, tab.favIconUrl);
			tags = '';
		}
	}

	function extractModelName(url: string): string {
		try {
			const urlObj = new URL(url);
			const pathParts = urlObj.pathname.split('/').filter((part) => part !== '');
			// For URLs like www.chaturbate.com/modelname/ or www.chaturbate.com/modelname/?
			if (pathParts.length > 0) {
				return pathParts[0];
			}
			return '';
		} catch (e) {
			return '';
		}
	}

	async function addModel(url: string, name: string) {
		let formattedUrl = url;
		if (!/^https?:\/\//i.test(url)) {
			formattedUrl = `https://${url}`;
		}

		await client.mutation(api.models.create, {
			url: formattedUrl,
			name: name
		});
	}

	async function handleAddCurrentModel() {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tab && tab.url) {
			// Check if the URL contains 'chaturbate'
			if (!tab.url.toLowerCase().includes('chaturbate')) {
				alert('Models can only be added from Chaturbate URLs');
				return;
			}
			const modelName = extractModelName(tab.url);
			if (modelName) {
				await addModel(tab.url, modelName);
			}
		}
	}

	let filteredModels = $derived<Model[]>(
		(models.data || [])
			.filter((model) => {
				const query = modelSearchQuery.toLowerCase();
				return model.url.toLowerCase().includes(query) || model.name?.toLowerCase().includes(query);
			})
			.reverse()
	);
</script>

<main
	class="mx-auto flex max-h-[600px] max-w-[500px] flex-col justify-center overflow-hidden bg-slate-700 p-6"
>
	<!-- Tab Selector -->
	<div class="mb-4 flex gap-2 rounded bg-slate-600 p-1">
		<button
			class="flex-1 rounded px-4 py-2 font-bold transition-colors duration-200 {activeTab ===
			'links'
				? 'bg-slate-400 text-slate-900'
				: 'text-slate-300 hover:bg-slate-500'}"
			onclick={() => (activeTab = 'links')}
		>
			Links
		</button>
		<button
			class="flex-1 rounded px-4 py-2 font-bold text-slate-300 transition-colors duration-200 {activeTab ===
			'models'
				? 'bg-slate-400 text-slate-900'
				: 'text-slate-300 hover:bg-slate-500'}"
			onclick={() => (activeTab = 'models')}
		>
			Models
		</button>
	</div>

	{#if activeTab === 'links'}
		<!-- Links View -->
		<div class="mt-4 flex flex-col">
			<label for="tags" class="text-slate-300">Tags</label>
			<input
				id="tags"
				placeholder="Comma, seperated, tags"
				type="text"
				bind:value={tags}
				class="mt-2 rounded bg-slate-600 p-2 text-slate-300 outline-2 transition-all duration-150 focus:outline-2 focus:outline-amber-400"
				style="transition-duration: .15s; transition-property: background, border, color, outline; transition-timing-function: ease-out;"
			/>
		</div>

		<button
			onclick={handleBookmarkCurrentTab}
			class="mt-4 flex items-center justify-center gap-2 rounded bg-amber-500 p-2 text-slate-900 transition-colors duration-200 hover:bg-amber-600"
		>
			<BookmarkPlus />
			Bookmark Current Tab
		</button>

		<div class="mt-8 flex flex-col">
			<label for="search" class="text-slate-300">Search</label>
			<input
				id="search"
				placeholder="Search bookmarks"
				type="text"
				bind:value={SearchQuery}
				class="mt-2 rounded bg-slate-600 p-2 text-slate-300 outline-2 transition-all duration-150 focus:outline-2 focus:outline-amber-400"
				style="transition-duration: .15s; transition-property: background, border, color, outline; transition-timing-function: ease-out;"
			/>
		</div>

		<div class="mt-4 flex max-h-80 flex-col gap-2 overflow-y-scroll">
			{#if links.isLoading}
				{#each Array(5) as _, i}
					<div
						class="flex max-h-10 animate-pulse items-center justify-between rounded bg-slate-600 p-2"
					>
						<div class="flex min-w-0 flex-1 items-center gap-2">
							<div class="h-4 w-4 shrink-0 rounded bg-slate-500"></div>
							<div class="h-4 w-100 rounded bg-slate-500"></div>
						</div>
						<div class="ml-2 h-4 w-4 shrink-0 rounded bg-slate-500"></div>
					</div>
				{/each}
			{:else}
				{#each filteredLinks as link}
					<a href={link.url} rel="external" target="_blank">
						<div
							class="wrap flex max-h-10 items-center justify-between rounded bg-slate-600 p-2 text-slate-300 transition-colors duration-200 hover:bg-slate-500"
						>
							<div class="flex min-w-0 flex-1 items-center gap-2">
								{#if link.favicon}
									<img src={link.favicon} alt="favicon" class="h-4 w-4 shrink-0" />
								{/if}
								<span class="max-w-32 truncate">
									{link.url}
								</span>
								<span class="truncate">
									{#if link.title}
										- {link.title}
									{/if}
								</span>
							</div>
							<ExternalLink class="ml-2 shrink-0" />
						</div>
					</a>
				{/each}
			{/if}
		</div>
	{:else}
		<!-- Models View -->
		<button
			onclick={handleAddCurrentModel}
			class="mt-4 flex items-center justify-center gap-2 rounded bg-amber-500 p-2 text-slate-900 transition-colors duration-200 hover:bg-amber-600"
		>
			<BookmarkPlus />
			Add Current Model
		</button>

		<div class="mt-8 flex flex-col">
			<label for="model-search" class="text-slate-300">Search</label>
			<input
				id="model-search"
				placeholder="Search models"
				type="text"
				bind:value={modelSearchQuery}
				class="mt-2 rounded bg-slate-600 p-2 text-slate-300 outline-2 transition-all duration-150 focus:outline-2 focus:outline-amber-400"
				style="transition-duration: .15s; transition-property: background, border, color, outline; transition-timing-function: ease-out;"
			/>
		</div>

		<div class="mt-4 flex max-h-80 flex-col gap-2 overflow-y-scroll">
			{#if models.isLoading}
				{#each Array(5) as _, i}
					<div
						class="flex max-h-10 animate-pulse items-center justify-between rounded bg-slate-600 p-2"
					>
						<div class="flex min-w-0 flex-1 items-center gap-2">
							<div class="h-4 w-full rounded bg-slate-500"></div>
						</div>
						<div class="ml-2 h-4 w-4 shrink-0 rounded bg-slate-500"></div>
					</div>
				{/each}
			{:else}
				{#each filteredModels as model}
					<a href={model.url} rel="external" target="_blank">
						<div
							class="wrap flex max-h-10 items-center justify-between rounded bg-slate-600 p-2 text-slate-300 transition-colors duration-200 hover:bg-slate-500"
						>
							<div class="flex min-w-0 flex-1 items-center gap-2">
								<span class="max-w-32 truncate">
									{model.name}
								</span>
								<span class="truncate">
									- {model.url}
								</span>
							</div>
							<ExternalLink class="ml-2 shrink-0" />
						</div>
					</a>
				{/each}
			{/if}
		</div>
	{/if}
</main>
