<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let tab = $state<'login' | 'register'>('login');
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	<div class="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm p-8">
		<h1 class="text-xl font-semibold text-gray-900 mb-1">CalmBudget</h1>
		<p class="text-sm text-gray-400 mb-6">Your calm expense tracker.</p>

		<div class="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
			<button
				onclick={() => {
					tab = 'login';
				}}
				class="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors
					{tab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
			>Sign in</button>
			<button
				onclick={() => {
					tab = 'register';
				}}
				class="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors
					{tab === 'register'
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-500 hover:text-gray-700'}"
			>Create account</button>
		</div>

		{#if form?.error}
			<p class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{form.error}</p>
		{/if}

		{#if tab === 'login'}
			<form method="POST" action="?/login" use:enhance class="space-y-4">
				<div>
					<label for="login-email" class="block text-sm font-medium text-gray-700 mb-1"
						>Email</label
					>
					<input
						id="login-email"
						name="email"
						type="email"
						required
						autocomplete="email"
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label for="login-password" class="block text-sm font-medium text-gray-700 mb-1"
						>Password</label
					>
					<input
						id="login-password"
						name="password"
						type="password"
						required
						autocomplete="current-password"
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
				<button
					type="submit"
					class="w-full py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
				>
					Sign in
				</button>
			</form>
		{:else}
			<form method="POST" action="?/register" use:enhance class="space-y-4">
				<div>
					<label for="reg-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
					<input
						id="reg-name"
						name="name"
						type="text"
						required
						autocomplete="name"
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label for="reg-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
					<input
						id="reg-email"
						name="email"
						type="email"
						required
						autocomplete="email"
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label for="reg-password" class="block text-sm font-medium text-gray-700 mb-1"
						>Password</label
					>
					<input
						id="reg-password"
						name="password"
						type="password"
						required
						autocomplete="new-password"
						minlength="8"
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
				<button
					type="submit"
					class="w-full py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
				>
					Create account
				</button>
			</form>
		{/if}
	</div>
</div>
