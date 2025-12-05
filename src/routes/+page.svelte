<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { BookmarkPlus, ExternalLink } from '@lucide/svelte';
	import { api } from '../convex/_generated/api.js';
	import { useQuery } from 'convex-svelte';

	const links = useQuery(api.links.get, {});

	interface Bookmark {
		title: string;
		url: string;
		tags: string[];
		favicon?: string;
	}

	let links = $state<Bookmark[]>([]);

	let url = $state('');
	let tags = $state('');

	onMount(async () => {
		const authResult = await chrome.storage.session.get('authenticated');
		const isAuthenticated = authResult.authenticated === 'true';
		if (!isAuthenticated) {
			goto('/pin');
			return;
		}

		const result = await chrome.storage.local.get('bookmarks');
		if (result.bookmarks) {
			const bookmarksArray = Array.isArray(result.bookmarks)
				? result.bookmarks
				: Object.values(result.bookmarks);
			// Ensure tags are always arrays
			links = bookmarksArray.map((bookmark) => ({
				...bookmark,
				tags: Array.isArray(bookmark.tags) ? bookmark.tags : Object.values(bookmark.tags || {})
			}));
		}
	});

	function addBookmark(url: string, tags: string, title: string = '', favicon?: string) {
		let formattedUrl = url;
		if (!/^https?:\/\//i.test(url)) {
			formattedUrl = `https://${url}`;
		}

		const tagArray = tags
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag !== '');
		links.push({ url: formattedUrl, tags: tagArray, title, favicon });

		// Ensure we're storing plain objects with proper arrays
		const bookmarksToStore = links.map((link) => ({
			url: link.url,
			title: link.title,
			tags: Array.from(link.tags || []),
			favicon: link.favicon
		}));
		chrome.storage.local.set({ bookmarks: bookmarksToStore }).then(() => {});
	}

	let SearchQuery = $state('');
	let filteredLinks = $derived<Bookmark[]>(
		(links || [])
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
</script>

<main
	class="mx-auto flex max-h-[600px] max-w-[500px] flex-col justify-center overflow-hidden bg-slate-700 p-6"
>
	<button
		class="cursor-pointer self-center text-amber-500 transition-colors duration-200 hover:text-amber-400"
		tabindex="0"
	>
		<BookmarkPlus class="size-32" onclick={handleBookmarkCurrentTab} />
	</button>

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
	</div>
</main>
