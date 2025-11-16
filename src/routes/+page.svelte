<script lang="ts">
	import { onMount } from 'svelte';

	interface Bookmark {
		url: string;
		tags: string[];
	}

	let links = $state<Bookmark[]>([]);

	let url = $state('');
	let tags = $state('');

	onMount(async () => {
		const result = await chrome.storage.local.get('bookmarks');
		if (result.bookmarks) {
			console.log(typeof result.bookmarks);

			links = Array.isArray(result.bookmarks) ? result.bookmarks : Object.values(result.bookmarks);
		}
	});

	function addBookmark(url: string, tags: string) {
		let formattedUrl = url;
		if (!/^https?:\/\//i.test(url)) {
			formattedUrl = `https://${url}`;
		}

		const tagArray = tags
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag !== '');
		links.push({ url: formattedUrl, tags: tagArray });

		chrome.storage.local.set({ bookmarks: [...links] }).then(() => {});
	}

	let SearchQuery = $state('');
	let filteredLinks = $derived<Bookmark[]>(
		(links || []).filter(
			(link) => link.url.includes(SearchQuery) || link.tags.some((tag) => tag.includes(SearchQuery))
		)
	);
</script>

<main>
	<h1>Oh hi mark</h1>
	<form action="">
		<div>
			<label for="url">URL:</label>
			<input id="url" type="text" placeholder="https://example.com" bind:value={url} />
		</div>
		<div>
			<label for="tags">Tags</label>
			<input id="tags" type="text" placeholder="tag1, tag2, tag3" bind:value={tags} />
		</div>
		<button
			type="submit"
			onclick={(e) => {
				e.preventDefault();
				addBookmark(url, tags);
				url = '';
				tags = '';
			}}>Add bookmark</button
		>
	</form>
	<section>
		<h2>Bookmarks</h2>
		<input type="text" placeholder="Search bookmarks..." bind:value={SearchQuery} />
		<ul>
			{#each filteredLinks as link}
				<li>
					<a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
				</li>
			{/each}
		</ul>
	</section>
</main>
