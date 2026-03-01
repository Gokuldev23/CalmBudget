<script lang="ts">
	import { COLOR_PALETTE } from '$lib/constants';
	import type { ColorKey } from '$lib/constants';
	import type { Budget, CategoryItem, Expense, Plan } from '$lib/types';

	interface Props {
		plans: Plan[];
		expenses: Expense[];
		categories: CategoryItem[];
		budget: Budget | null;
	}

	let { plans, expenses, categories, budget }: Props = $props();

	const totalPlanned = $derived(plans.reduce((sum, p) => sum + p.amount, 0));
	const totalActual = $derived(expenses.reduce((sum, e) => sum + e.amount, 0));

	const plannedByCategory = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const p of plans) map[p.category] = (map[p.category] ?? 0) + p.amount;
		return map;
	});

	const actualByCategory = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const e of expenses) map[e.category] = (map[e.category] ?? 0) + e.amount;
		return map;
	});

	const activeCategoryNames = $derived(
		new Set([...Object.keys(plannedByCategory), ...Object.keys(actualByCategory)])
	);

	const expectedBalance = $derived(budget ? budget.amount - totalPlanned : null);
</script>

{#if plans.length === 0 && expenses.length === 0}
	<p class="text-sm text-gray-400 text-center py-4">No data yet this month.</p>
{:else}
	{#if budget && totalPlanned > 0}
		<div
			class="mb-4 p-3 rounded-lg {expectedBalance !== null && expectedBalance < 0
				? 'bg-red-50 border border-red-100'
				: 'bg-emerald-50 border border-emerald-100'}"
		>
			<p class="text-xs text-gray-500 mb-0.5">If plans followed, balance will be</p>
			<p
				class="text-lg font-bold {expectedBalance !== null && expectedBalance < 0
					? 'text-red-600'
					: 'text-emerald-700'}"
			>
				{expectedBalance !== null && expectedBalance < 0 ? '-' : ''}₹{Math.abs(
					expectedBalance ?? 0
				).toFixed(2)}
			</p>
			<p class="text-xs text-gray-400 mt-0.5">
				Salary ₹{budget.amount.toFixed(0)} − Planned ₹{totalPlanned.toFixed(0)}
			</p>
		</div>
	{/if}

	<p class="text-xs text-gray-400 uppercase tracking-wide mb-2">Planned vs Actual</p>
	<div class="space-y-3">
		{#each categories as cat (cat.id)}
			{@const planned = plannedByCategory[cat.name] ?? 0}
			{@const actual = actualByCategory[cat.name] ?? 0}
			{#if activeCategoryNames.has(cat.name)}
				{@const diff = planned - actual}
				{@const barPct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0}
				<div>
					<div class="flex items-center justify-between mb-1">
						<span
							class="text-xs px-1.5 py-0.5 rounded-full {COLOR_PALETTE[cat.color as ColorKey]
								?.classes ?? 'bg-gray-100 text-gray-600'}">{cat.label}</span
						>
						{#if planned > 0 && actual > 0}
							<span class="text-xs font-medium {diff < 0 ? 'text-red-500' : 'text-emerald-600'}">
								{diff < 0 ? '↑' : '↓'} ₹{Math.abs(diff).toFixed(0)}
							</span>
						{/if}
					</div>
					<div class="flex items-center gap-2 text-xs text-gray-500">
						<span>₹{actual.toFixed(0)} spent</span>
						{#if planned > 0}
							<span class="text-gray-300">/</span>
							<span>₹{planned.toFixed(0)} planned</span>
						{:else}
							<span class="text-amber-500">⚠ not planned</span>
						{/if}
					</div>
					{#if planned > 0}
						<div class="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
							<div
								class="h-full rounded-full {barPct >= 100
									? 'bg-red-400'
									: barPct >= 80
										? 'bg-amber-400'
										: 'bg-indigo-400'}"
								style="width: {barPct}%"
							></div>
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>

	{#if totalPlanned > 0 || totalActual > 0}
		<div class="mt-4 pt-3 border-t border-gray-100 space-y-1 text-xs">
			<div class="flex justify-between text-gray-500">
				<span>Total planned</span>
				<span class="font-medium text-gray-700">₹{totalPlanned.toFixed(2)}</span>
			</div>
			<div class="flex justify-between text-gray-500">
				<span>Total actual</span>
				<span class="font-medium {totalActual > totalPlanned ? 'text-red-500' : 'text-gray-700'}"
					>₹{totalActual.toFixed(2)}</span
				>
			</div>
			{#if totalPlanned > 0}
				<div class="flex justify-between">
					<span class="text-gray-500">Difference</span>
					<span
						class="font-semibold {totalPlanned - totalActual < 0
							? 'text-red-500'
							: 'text-emerald-600'}"
					>
						{totalPlanned - totalActual < 0 ? '↑' : '↓'} ₹{Math.abs(
							totalPlanned - totalActual
						).toFixed(2)}
					</span>
				</div>
			{/if}
		</div>
	{/if}
{/if}
