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
<div class="pin-container">
	<h1>Enter PIN</h1>
	<form onsubmit={handlePinSubmit}>
		<input
			type="password"
			inputmode="numeric"
			maxlength="4"
			placeholder="Enter PIN"
			bind:value={pinInput}
			oninput={handlePinInput}
			autocomplete="off"
			autofocus
		/>
		<button type="submit" disabled={pinInput.length !== 4}>Submit</button>
		{#if pinError}
			<p class="error">Incorrect PIN. Please try again.</p>
		{/if}
	</form>
</div>

<style>
	.pin-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 20px;
	}

	.pin-container h1 {
		margin-bottom: 20px;
	}

	.pin-container form {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15px;
	}

	.pin-container input[type='password'] {
		font-size: 24px;
		letter-spacing: 10px;
		text-align: center;
		padding: 10px;
		width: 200px;
		border: 2px solid #ccc;
		border-radius: 5px;
	}

	.pin-container button {
		padding: 10px 30px;
		font-size: 16px;
		cursor: pointer;
		border: none;
		border-radius: 5px;
		background-color: #007bff;
		color: white;
	}

	.pin-container button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.pin-container button:not(:disabled):hover {
		background-color: #0056b3;
	}

	.error {
		color: red;
		font-size: 14px;
		margin: 0;
	}
</style>
