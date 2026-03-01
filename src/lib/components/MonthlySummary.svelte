<script lang="ts">
	import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, MONTH_NAMES } from '$lib/constants';
	import type { Category, Expense } from '$lib/types';

	interface Props {
		expenses: Expense[];
		month: number;
		year: number;
	}

	let { expenses, month, year }: Props = $props();

	const total = $derived(expenses.reduce((sum, e) => sum + e.amount, 0));

	const byCategory = $derived.by(() => {
		const map: Partial<Record<Category, number>> = {};
		for (const e of expenses) {
			map[e.category as Category] = (map[e.category as Category] ?? 0) + e.amount;
		}
		return map;
	});
</script>

<div class="bg-white rounded-xl border border-gray-100 p-6">
	<p class="text-sm text-gray-400 mb-1">{MONTH_NAMES[month - 1]} {year}</p>
	<p class="text-3xl font-bold text-gray-900 mb-6">${total.toFixed(2)}</p>

	{#if expenses.length === 0}
		<p class="text-sm text-gray-400">No expenses yet.</p>
	{:else}
		<div class="space-y-2">
			{#each CATEGORIES as cat (cat)}
				{#if byCategory[cat]}
					<div class="flex items-center justify-between">
						<span class="text-xs px-2 py-0.5 rounded-full {CATEGORY_COLORS[cat]}">
							{CATEGORY_LABELS[cat]}
						</span>
						<span class="text-sm font-medium text-gray-800">${byCategory[cat]!.toFixed(2)}</span>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
