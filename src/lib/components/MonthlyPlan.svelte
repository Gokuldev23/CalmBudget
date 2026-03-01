<script lang="ts">
	import type { Budget, CategoryItem, Expense, Plan } from '$lib/types';
	import PlanAddForm from './PlanAddForm.svelte';
	import PlanInsights from './PlanInsights.svelte';
	import PlanItem from './PlanItem.svelte';

	interface Props {
		plans: Plan[];
		expenses: Expense[];
		categories: CategoryItem[];
		month: number;
		year: number;
		budget: Budget | null;
		onPlanChanged: () => Promise<void>;
	}

	let { plans, expenses, categories, month, year, budget, onPlanChanged }: Props = $props();

	const totalPlanned = $derived(plans.reduce((sum, p) => sum + p.amount, 0));
	const expectedBalance = $derived(budget ? budget.amount - totalPlanned : null);

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

	let showAddForm = $state(false);
	let activeTab = $state<'plans' | 'insights'>('plans');
</script>

<div class="bg-white rounded-xl border border-gray-100 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-4">
		<h3 class="font-semibold text-gray-900 text-sm">Monthly Plan</h3>
		{#if !showAddForm}
			<button
				type="button"
				onclick={() => (showAddForm = true)}
				class="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
			>
				+ Add plan
			</button>
		{/if}
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
		<button
			type="button"
			onclick={() => (activeTab = 'plans')}
			class="flex-1 py-1 text-xs font-medium rounded-md transition-colors {activeTab === 'plans'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-500 hover:text-gray-700'}"
		>
			Plans
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'insights')}
			class="flex-1 py-1 text-xs font-medium rounded-md transition-colors {activeTab === 'insights'
				? 'bg-white text-gray-900 shadow-sm'
				: 'text-gray-500 hover:text-gray-700'}"
		>
			Insights
		</button>
	</div>

	{#if showAddForm}
		<PlanAddForm
			{categories}
			{month}
			{year}
			onSaved={onPlanChanged}
			onCancel={() => (showAddForm = false)}
		/>
	{/if}

	<!-- Plans tab -->
	{#if activeTab === 'plans'}
		{#if plans.length === 0 && !showAddForm}
			<p class="text-sm text-gray-400 text-center py-4">
				No plans for this month.<br />
				<button
					type="button"
					onclick={() => (showAddForm = true)}
					class="text-indigo-500 hover:underline mt-1">Add your first plan</button
				>
			</p>
		{:else}
			{@const recurringPlans = plans.filter((p) => p.isRecurring)}
			{@const monthlyPlans = plans.filter((p) => !p.isRecurring)}

			{#if recurringPlans.length > 0}
				<p class="text-xs text-gray-400 uppercase tracking-wide mb-2">Recurring</p>
				<div class="space-y-2 mb-3">
					{#each recurringPlans as p (p.id)}
						<PlanItem
							plan={p}
							{categories}
							actual={actualByCategory[p.category] ?? 0}
							planned={plannedByCategory[p.category] ?? 0}
							onChanged={onPlanChanged}
						/>
					{/each}
				</div>
			{/if}

			{#if monthlyPlans.length > 0}
				{#if recurringPlans.length > 0}
					<p class="text-xs text-gray-400 uppercase tracking-wide mb-2">This month</p>
				{/if}
				<div class="space-y-2">
					{#each monthlyPlans as p (p.id)}
						<PlanItem
							plan={p}
							{categories}
							actual={actualByCategory[p.category] ?? 0}
							planned={plannedByCategory[p.category] ?? 0}
							onChanged={onPlanChanged}
						/>
					{/each}
				</div>
			{/if}

			{#if plans.length > 0}
				<div
					class="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500"
				>
					<span>Total planned</span>
					<span class="font-semibold text-gray-700">₹{totalPlanned.toFixed(2)}</span>
				</div>
				{#if expectedBalance !== null}
					<div class="mt-1 flex justify-between text-xs">
						<span class="text-gray-500">Expected balance</span>
						<span
							class="font-semibold {expectedBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}"
						>
							{expectedBalance >= 0 ? '' : '-'}₹{Math.abs(expectedBalance).toFixed(2)}
						</span>
					</div>
				{/if}
			{/if}
		{/if}

	<!-- Insights tab -->
	{:else}
		<PlanInsights {plans} {expenses} {categories} {budget} />
	{/if}
</div>
