<script lang="ts">
	import type { CategoryItem } from '$lib/types';

	interface Props {
		categories: CategoryItem[];
		month: number;
		year: number;
		onSaved: () => Promise<void>;
		onCancel: () => void;
	}

	let { categories, month, year, onSaved, onCancel }: Props = $props();

	let addTitle = $state('');
	let addCategory = $state('');
	const effectiveAddCategory = $derived(addCategory || categories[0]?.name || '');
	let addAmount = $state(0);
	let addIsRecurring = $state(false);
	let addScheduledDay = $state(1);
	let addError = $state('');

	function ordinal(n: number) {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return n + (s[(v - 20) % 10] || s[v] || s[0]);
	}

	async function createPlan() {
		if (!addTitle.trim() || addAmount <= 0) {
			addError = 'Title and amount are required.';
			return;
		}
		const fd = new FormData();
		fd.append('title', addTitle.trim());
		fd.append('amount', String(addAmount));
		fd.append('category', effectiveAddCategory);
		fd.append('isRecurring', String(addIsRecurring));
		if (addIsRecurring) fd.append('scheduledDay', String(addScheduledDay));
		else {
			fd.append('month', String(month));
			fd.append('year', String(year));
		}
		const res = await fetch('/api/plans', { method: 'POST', body: fd });
		if (res.ok) {
			addTitle = '';
			addCategory = '';
			addAmount = 0;
			addIsRecurring = false;
			addScheduledDay = 1;
			addError = '';
			await onSaved();
			onCancel();
		} else {
			addError = 'Failed to save. Try again.';
		}
	}
</script>

<div class="mb-4 border border-indigo-100 rounded-lg p-3 space-y-2.5 bg-indigo-50/30">
	<p class="text-xs font-semibold text-gray-700">New Plan</p>

	<input
		bind:value={addTitle}
		type="text"
		placeholder="e.g. Rent, Groceries…"
		class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
	/>

	<input
		bind:value={addAmount}
		type="number"
		step="0.01"
		min="0.01"
		placeholder="Expected amount (₹)"
		class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
	/>

	<select
		onchange={(e) => (addCategory = (e.currentTarget as HTMLSelectElement).value)}
		class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
	>
		{#each categories as cat (cat.id)}
			<option value={cat.name} selected={cat.name === effectiveAddCategory}>{cat.label}</option>
		{/each}
	</select>

	<label class="flex items-center gap-2 cursor-pointer">
		<input
			type="checkbox"
			bind:checked={addIsRecurring}
			class="rounded text-indigo-600 focus:ring-indigo-500"
		/>
		<span class="text-xs text-gray-700">Recurring every month</span>
	</label>

	{#if addIsRecurring}
		<div>
			<label for="add-scheduled-day" class="block text-xs text-gray-500 mb-1"
				>Auto-add on day (1–28)</label
			>
			<input
				id="add-scheduled-day"
				bind:value={addScheduledDay}
				type="number"
				min="1"
				max="28"
				placeholder="e.g. 1"
				class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
			/>
			<p class="text-xs text-gray-400 mt-1">
				An expense will be auto-created on the {ordinal(addScheduledDay)} each month.
			</p>
		</div>
	{/if}

	{#if addError}<p class="text-xs text-red-500">{addError}</p>{/if}

	<div class="flex gap-2">
		<button
			type="button"
			onclick={createPlan}
			class="flex-1 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
			>Save</button
		>
		<button
			type="button"
			onclick={onCancel}
			class="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
			>Cancel</button
		>
	</div>
</div>
