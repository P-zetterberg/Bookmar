<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { BookmarkPlus, ExternalLink } from '@lucide/svelte';

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
			links = Array.isArray(result.bookmarks) ? result.bookmarks : Object.values(result.bookmarks);
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

		chrome.storage.local.set({ bookmarks: [...links] }).then(() => {});
	}

	let SearchQuery = $state('');
	let filteredLinks = $derived<Bookmark[]>(
		(links || []).filter((link) => {
			const query = SearchQuery.toLowerCase();
			return (
				link.url.toLowerCase().includes(query) ||
				link.title?.toLowerCase().includes(query) ||
				(Array.isArray(link.tags) && link.tags.some((tag) => tag.toLowerCase().includes(query)))
			);
		})
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
	class="bg-slate-700 max-w-[500px] max-h-[600px] mx-auto p-6 flex flex-col justify-center overflow-hidden"
>
	<button
		class="text-amber-500 cursor-pointer transition-colors duration-200 hover:text-amber-400 self-center"
		tabindex="0"
	>
		<BookmarkPlus class="size-32" onclick={handleBookmarkCurrentTab} />
	</button>

	<div class="flex flex-col mt-4">
		<label for="tags" class="text-slate-300">Tags</label>
		<input
			id="tags"
			placeholder="Comma, seperated, tags"
			type="text"
			bind:value={tags}
			class="focus:outline-amber-400 mt-2 p-2 outline-2 rounded text-slate-300 focus:outline-2 transition-all duration-150 bg-slate-600"
			style="transition-duration: .15s; transition-property: background, border, color, outline; transition-timing-function: ease-out;"
		/>
	</div>

	<div class="flex flex-col mt-8">
		<label for="search" class="text-slate-300">Search</label>
		<input
			id="search"
			placeholder="Search bookmarks"
			type="text"
			bind:value={SearchQuery}
			class="focus:outline-amber-400 mt-2 p-2 outline-2 rounded text-slate-300 focus:outline-2 transition-all duration-150 bg-slate-600"
			style="transition-duration: .15s; transition-property: background, border, color, outline; transition-timing-function: ease-out;"
		/>
	</div>

	<div class="flex flex-col gap-2 mt-4 overflow-y-scroll max-h-80">
		{#each filteredLinks as link}
			<a href={link.url} rel="external" target="_blank">
				<div
					class="hover:bg-slate-500 flex items-center justify-between bg-slate-600 rounded p-2 text-slate-300 transition-colors duration-200 max-h-10 wrap"
				>
					<div class="flex items-center gap-2 flex-1 min-w-0">
						{#if link.favicon}
							<img src={link.favicon} alt="favicon" class="w-4 h-4 shrink-0" />
						{/if}
						<span class="truncate max-w-32">
							{link.url}
						</span>
						<span class="truncate">
							{#if link.title}
								- {link.title}
							{/if}
						</span>
					</div>
					<ExternalLink class="shrink-0 ml-2" />
				</div>
			</a>
		{/each}
	</div>
</main>
