<script lang="ts">
	import { COLOR_PALETTE } from '$lib/constants';
	import type { ColorKey } from '$lib/constants';
	import type { CategoryItem, Plan } from '$lib/types';

	interface Props {
		plan: Plan;
		categories: CategoryItem[];
		actual: number;
		planned: number;
		onChanged: () => Promise<void>;
	}

	let { plan, categories, actual, planned, onChanged }: Props = $props();

	const diff = $derived(planned - actual);
	const cat = $derived(categories.find((c) => c.name === plan.category));

	let editing = $state(false);
	let editTitle = $state('');
	let editAmount = $state(0);
	let editCategory = $state('');
	let editScheduledDay = $state(1);
	const effectiveEditCategory = $derived(editCategory || categories[0]?.name || '');

	function startEdit() {
		editTitle = plan.title;
		editAmount = plan.amount;
		editCategory = plan.category;
		editScheduledDay = plan.scheduledDay ?? 1;
		editing = true;
	}

	async function updatePlan() {
		const fd = new FormData();
		fd.append('id', String(plan.id));
		fd.append('title', editTitle.trim());
		fd.append('amount', String(editAmount));
		fd.append('category', effectiveEditCategory);
		if (plan.isRecurring) fd.append('scheduledDay', String(editScheduledDay));
		const res = await fetch('/api/plans', { method: 'PATCH', body: fd });
		if (res.ok) {
			await onChanged();
			editing = false;
		}
	}

	async function deletePlan() {
		if (!confirm('Delete this plan?')) return;
		const res = await fetch(`/api/plans?id=${plan.id}`, { method: 'DELETE' });
		if (res.ok) await onChanged();
	}

	function ordinal(n: number) {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return n + (s[(v - 20) % 10] || s[v] || s[0]);
	}
</script>

{#if editing}
	<div class="border border-indigo-200 rounded-lg p-3 space-y-2 bg-indigo-50/30">
		<input
			bind:value={editTitle}
			type="text"
			class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
		/>
		<input
			bind:value={editAmount}
			type="number"
			step="0.01"
			min="0.01"
			class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
		/>
		<select
			onchange={(e) => (editCategory = (e.currentTarget as HTMLSelectElement).value)}
			class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
		>
			{#each categories as c (c.id)}
				<option value={c.name} selected={c.name === effectiveEditCategory}>{c.label}</option>
			{/each}
		</select>
		{#if plan.isRecurring}
			<div>
				<label for="edit-scheduled-day-{plan.id}" class="block text-xs text-gray-500 mb-1"
					>Auto-add on day</label
				>
				<input
					id="edit-scheduled-day-{plan.id}"
					bind:value={editScheduledDay}
					type="number"
					min="1"
					max="28"
					class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>
		{/if}
		<div class="flex gap-2">
			<button
				type="button"
				onclick={updatePlan}
				class="flex-1 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
				>Save</button
			>
			<button
				type="button"
				onclick={() => (editing = false)}
				class="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
				>Cancel</button
			>
		</div>
	</div>
{:else}
	<div class="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 group">
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-1.5 flex-wrap">
				<span class="text-sm font-medium text-gray-800">{plan.title}</span>
				{#if cat}
					<span
						class="text-xs px-1.5 py-0.5 rounded-full {COLOR_PALETTE[cat.color as ColorKey]
							?.classes ?? 'bg-gray-100 text-gray-600'}">{cat.label}</span
					>
				{/if}
				{#if plan.isRecurring}
					<span class="text-xs px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600"
						>🔄 {plan.scheduledDay ? ordinal(plan.scheduledDay) : 'Monthly'}</span
					>
				{/if}
			</div>
			{#if plan.isRecurring}
				<p class="text-xs text-gray-400 mt-0.5">
					Auto-creates expense {plan.scheduledDay
						? `on the ${ordinal(plan.scheduledDay)}`
						: 'monthly'}
				</p>
			{/if}
			<p
				class="text-xs mt-0.5 font-medium {actual === 0
					? 'text-gray-300'
					: Math.abs(diff) < 0.01
						? 'text-indigo-500'
						: diff > 0
							? 'text-emerald-600'
							: 'text-red-500'}"
			>
				{#if actual === 0}No spending yet{:else if Math.abs(diff) < 0.01}✓ Exact match · ₹{actual.toFixed(
						0
					)} spent{:else if diff > 0}↓ ₹{diff.toFixed(0)} under · ₹{actual.toFixed(
						0
					)} of ₹{planned.toFixed(0)} planned{:else}↑ ₹{Math.abs(diff).toFixed(
						0
					)} over · ₹{actual.toFixed(0)} of ₹{planned.toFixed(0)} planned{/if}
			</p>
		</div>
		<span class="text-sm font-semibold text-gray-900 shrink-0">₹{plan.amount.toFixed(2)}</span>
		<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
			<button
				type="button"
				onclick={startEdit}
				class="p-1 text-gray-400 hover:text-indigo-600 rounded"
				aria-label="Edit"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-3.5 h-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
				</svg>
			</button>
			<button
				type="button"
				onclick={deletePlan}
				class="p-1 text-gray-400 hover:text-red-500 rounded"
				aria-label="Delete"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-3.5 h-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="3 6 5 6 21 6" />
					<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
					<path d="M10 11v6M14 11v6" />
					<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
				</svg>
			</button>
		</div>
	</div>
{/if}
