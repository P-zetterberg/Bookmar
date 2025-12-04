<script lang="ts">
	import { goto } from '$app/navigation';

	const CORRECT_PIN = '7832';
	let pinInput = $state('');
	let pinError = $state(false);

	function handlePinSubmit(e: Event) {
		e.preventDefault();
		if (pinInput === CORRECT_PIN) {
			chrome.storage.session.set({ authenticated: 'true' });
			goto('/');
		} else {
			pinError = true;
			pinInput = '';
		}
	}

	function handlePinInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = target.value.replace(/\D/g, '').slice(0, 4);
		pinInput = value;
	}
</script>

<!-- svelte-ignore a11y_autofocus -->
<main class="bg-slate-700 max-w-[500px] mx-auto p-6 flex flex-col justify-center min-h-screen">
	<div class="flex flex-col items-center">
		<h1 class="text-3xl font-semibold text-amber-500 mb-8">Enter PIN</h1>
		<form onsubmit={handlePinSubmit} class="flex flex-col gap-4 w-full">
			<div class="flex flex-col">
				<input
					type="password"
					inputmode="numeric"
					maxlength="4"
					placeholder="••••"
					bind:value={pinInput}
					oninput={handlePinInput}
					autocomplete="off"
					autofocus
					class="focus:outline-amber-400 p-4 outline-2 rounded text-slate-300 text-center text-4xl tracking-widest focus:outline-2 transition-all duration-150 bg-slate-600"
					style="transition-duration: .15s; transition-property: background, border, color, outline; transition-timing-function: ease-out;"
				/>
			</div>
			<button
				type="submit"
				disabled={pinInput.length !== 4}
				class="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-500 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-6 rounded transition-colors duration-200 mt-2"
			>
				Submit
			</button>
			{#if pinError}
				<p class="text-red-400 text-sm text-center mt-2">Incorrect PIN. Please try again.</p>
			{/if}
		</form>
	</div>
</main>
