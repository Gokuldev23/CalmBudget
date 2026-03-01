<script lang="ts">
	import { MONTH_NAMES, COLOR_PALETTE } from '$lib/constants';
	import type { ColorKey } from '$lib/constants';
	import type { Budget, CategoryItem, Expense } from '$lib/types';

	interface Props {
		expenses: Expense[];
		month: number;
		year: number;
		categories: CategoryItem[];
		budget: Budget | null;
	}

	let { expenses, month, year, categories, budget: initialBudget }: Props = $props();

	const total = $derived(expenses.reduce((sum, e) => sum + e.amount, 0));

	const byCategory = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const e of expenses) {
			map[e.category] = (map[e.category] ?? 0) + e.amount;
		}
		return map;
	});

	// undefined = not overridden; null/Budget = local override after save
	let _savedBudget = $state<Budget | null | undefined>(undefined);
	const currentBudget = $derived(_savedBudget !== undefined ? _savedBudget : initialBudget);

	let editingBudget = $state(false);
	let editAmount = $state(0);
	let editCreditDay = $state(1);
	let saveError = $state('');

	const remaining = $derived(currentBudget ? currentBudget.amount - total : null);
	const spentPercent = $derived(
		currentBudget ? Math.min((total / currentBudget.amount) * 100, 100) : 0
	);

	function startEditBudget() {
		editAmount = currentBudget?.amount ?? 0;
		editCreditDay = currentBudget?.creditDay ?? 1;
		saveError = '';
		editingBudget = true;
	}

	async function saveBudget() {
		saveError = '';
		const fd = new FormData();
		fd.append('amount', String(editAmount));
		fd.append('creditDay', String(editCreditDay));
		const res = await fetch('/api/budget', { method: 'POST', body: fd });
		if (res.ok) {
			_savedBudget = await res.json();
			editingBudget = false;
		} else {
			saveError = 'Failed to save. Try again.';
		}
	}

	function ordinal(n: number) {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return n + (s[(v - 20) % 10] || s[v] || s[0]);
	}
</script>

<div class="bg-white rounded-xl border border-gray-100 p-6">
	<p class="text-sm text-gray-400 mb-4">{MONTH_NAMES[month - 1]} {year}</p>

	<!-- Budget edit form -->
	{#if editingBudget}
		<div class="mb-5 space-y-3">
			<p class="text-sm font-semibold text-gray-800">Monthly Salary</p>
			<div>
				<label for="budget-amount" class="block text-xs text-gray-500 mb-1">Amount (₹)</label>
				<input
					id="budget-amount"
					type="number"
					step="0.01"
					min="1"
					bind:value={editAmount}
					placeholder="e.g. 50000"
					class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>
			<div>
				<label for="budget-credit-day" class="block text-xs text-gray-500 mb-1"
					>Salary credit day (1–28)</label
				>
				<input
					id="budget-credit-day"
					type="number"
					min="1"
					max="28"
					bind:value={editCreditDay}
					placeholder="e.g. 1"
					class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>
			{#if saveError}<p class="text-xs text-red-500">{saveError}</p>{/if}
			<div class="flex gap-2">
				<button
					type="button"
					onclick={saveBudget}
					class="flex-1 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
					>Save</button
				>
				<button
					type="button"
					onclick={() => (editingBudget = false)}
					class="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
					>Cancel</button
				>
			</div>
		</div>
		<hr class="mb-4 border-gray-100" />

	<!-- Budget display -->
	{:else if currentBudget}
		<div class="mb-5">
			<div class="flex items-start justify-between mb-3">
				<div>
					<p class="text-xs text-gray-400 mb-0.5">Monthly Salary</p>
					<p class="text-2xl font-bold text-gray-900">
						₹{currentBudget.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
					</p>
					<p class="text-xs text-gray-400 mt-1">
						Credited on the {ordinal(currentBudget.creditDay)} every month
					</p>
				</div>
				<button
					type="button"
					onclick={startEditBudget}
					class="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors mt-0.5"
					aria-label="Edit salary"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-4 h-4"
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
			</div>

			<div class="bg-gray-50 rounded-lg p-3 space-y-2">
				<div class="flex justify-between text-sm">
					<span class="text-gray-500">Spent</span>
					<span class="font-medium text-gray-800">₹{total.toFixed(2)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-gray-500">Remaining</span>
					<span class="font-semibold {(remaining ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}">
						{#if (remaining ?? 0) < 0}
							-₹{Math.abs(remaining ?? 0).toFixed(2)}
						{:else}
							₹{(remaining ?? 0).toFixed(2)}
						{/if}
					</span>
				</div>
				<div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
					<div
						class="h-full rounded-full transition-all {spentPercent >= 100
							? 'bg-red-500'
							: spentPercent >= 80
								? 'bg-amber-500'
								: 'bg-indigo-500'}"
						style="width: {spentPercent}%"
					></div>
				</div>
			</div>
		</div>
		<hr class="mb-4 border-gray-100" />

	<!-- No budget set -->
	{:else}
		<button
			type="button"
			onclick={startEditBudget}
			class="w-full mb-4 py-2.5 text-sm font-medium text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
		>
			+ Set monthly salary
		</button>
		<div class="flex items-center justify-between mb-4">
			<p class="text-xs text-gray-400">Spent this month</p>
			<p class="text-xl font-bold text-gray-900">₹{total.toFixed(2)}</p>
		</div>
	{/if}

	<!-- Category breakdown -->
	{#if expenses.length === 0}
		<p class="text-sm text-gray-400">No expenses yet.</p>
	{:else}
		{#if currentBudget && !editingBudget}
			<p class="text-xs text-gray-400 mb-2">By category</p>
		{/if}
		<div class="space-y-2">
			{#each categories as cat (cat.id)}
				{#if byCategory[cat.name]}
					<div class="flex items-center justify-between">
						<span
							class="text-xs px-2 py-0.5 rounded-full {COLOR_PALETTE[cat.color as ColorKey]?.classes ??
								'bg-gray-100 text-gray-600'}">{cat.label}</span
						>
						<span class="text-sm font-medium text-gray-800">₹{byCategory[cat.name].toFixed(2)}</span>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
