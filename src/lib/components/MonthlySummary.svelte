<script lang="ts">
	import { MONTH_NAMES, COLOR_PALETTE } from '$lib/constants';
	import type { ColorKey } from '$lib/constants';
	import type { CategoryItem, Expense } from '$lib/types';

	interface Props {
		expenses: Expense[];
		month: number;
		year: number;
		categories: CategoryItem[];
	}

	let { expenses, month, year, categories }: Props = $props();

	const total = $derived(expenses.reduce((sum, e) => sum + e.amount, 0));

	const byCategory = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const e of expenses) {
			map[e.category] = (map[e.category] ?? 0) + e.amount;
		}
		return map;
	});
</script>

<div class="bg-white rounded-xl border border-gray-100 p-6">
	<p class="text-sm text-gray-400 mb-1">{MONTH_NAMES[month - 1]} {year}</p>
	<p class="text-3xl font-bold text-gray-900 mb-6">₹{total.toFixed(2)}</p>

	{#if expenses.length === 0}
		<p class="text-sm text-gray-400">No expenses yet.</p>
	{:else}
		<div class="space-y-2">
			{#each categories as cat (cat.id)}
				{#if byCategory[cat.name]}
					<div class="flex items-center justify-between">
						<span
							class="text-xs px-2 py-0.5 rounded-full {COLOR_PALETTE[cat.color as ColorKey]?.classes ?? 'bg-gray-100 text-gray-600'}"
						>
							{cat.label}
						</span>
						<span class="text-sm font-medium text-gray-800">₹{byCategory[cat.name].toFixed(2)}</span>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
