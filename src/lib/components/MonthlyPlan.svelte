<script lang="ts">
	import { COLOR_PALETTE, COLOR_KEYS } from '$lib/constants';
	import type { ColorKey } from '$lib/constants';
	import type { Budget, CategoryItem, Expense, Plan } from '$lib/types';

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

	// ── derived ──────────────────────────────────────────────
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

	// categories that appear in either plans or expenses this month
	const activeCategoryNames = $derived(
		new Set([...Object.keys(plannedByCategory), ...Object.keys(actualByCategory)])
	);

	const expectedBalance = $derived(budget ? budget.amount - totalPlanned : null);

	// ── add form ──────────────────────────────────────────────
	let showAddForm = $state(false);
	let addTitle = $state('');
	let addCategory = $state('');
	const effectiveAddCategory = $derived(addCategory || categories[0]?.name || '');
	let addAmount = $state(0);
	let addIsRecurring = $state(false);
	let addScheduledDay = $state(1);
	let addError = $state('');

	function resetAddForm() {
		addTitle = '';
		addCategory = '';
		addAmount = 0;
		addIsRecurring = false;
		addScheduledDay = 1;
		addError = '';
		showAddForm = false;
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
			await onPlanChanged();
			resetAddForm();
		} else {
			addError = 'Failed to save. Try again.';
		}
	}

	// ── edit ──────────────────────────────────────────────────
	let editingPlan = $state<Plan | null>(null);
	let editTitle = $state('');
	let editAmount = $state(0);
	let editCategory = $state('');
	let editScheduledDay = $state(1);
	const effectiveEditCategory = $derived(editCategory || categories[0]?.name || '');

	function startEdit(p: Plan) {
		editingPlan = { ...p };
		editTitle = p.title;
		editAmount = p.amount;
		editCategory = p.category;
		editScheduledDay = p.scheduledDay ?? 1;
	}

	function cancelEdit() {
		editingPlan = null;
	}

	async function updatePlan() {
		if (!editingPlan) return;
		const fd = new FormData();
		fd.append('id', String(editingPlan.id));
		fd.append('title', editTitle.trim());
		fd.append('amount', String(editAmount));
		fd.append('category', effectiveEditCategory);
		if (editingPlan.isRecurring) fd.append('scheduledDay', String(editScheduledDay));
		const res = await fetch('/api/plans', { method: 'PATCH', body: fd });
		if (res.ok) {
			await onPlanChanged();
			cancelEdit();
		}
	}

	async function deletePlan(id: number) {
		if (!confirm('Delete this plan?')) return;
		const res = await fetch(`/api/plans?id=${id}`, { method: 'DELETE' });
		if (res.ok) await onPlanChanged();
	}

	function getCat(name: string) {
		return categories.find((c) => c.name === name);
	}

	function ordinal(n: number) {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return n + (s[(v - 20) % 10] || s[v] || s[0]);
	}

	// ── tabs ──────────────────────────────────────────────────
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

	<!-- Add plan form -->
	{#if showAddForm}
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
					<label for="add-scheduled-day" class="block text-xs text-gray-500 mb-1">Auto-add on day (1–28)</label>
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
					onclick={resetAddForm}
					class="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
					>Cancel</button
				>
			</div>
		</div>
	{/if}

	<!-- ── PLANS TAB ── -->
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
			<!-- Recurring plans section -->
			{@const recurringPlans = plans.filter((p) => p.isRecurring)}
			{@const monthlyPlans = plans.filter((p) => !p.isRecurring)}

			{#if recurringPlans.length > 0}
				<p class="text-xs text-gray-400 uppercase tracking-wide mb-2">Recurring</p>
				<div class="space-y-2 mb-3">
					{#each recurringPlans as p (p.id)}
						{@const cat = getCat(p.category)}
						{#if editingPlan?.id === p.id}
							<!-- Inline edit form -->
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
									onchange={(e) =>
										(editCategory = (e.currentTarget as HTMLSelectElement).value)}
									class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
								>
									{#each categories as cat (cat.id)}
										<option value={cat.name} selected={cat.name === effectiveEditCategory}
											>{cat.label}</option
										>
									{/each}
								</select>
								<div>
									<label for="edit-scheduled-day" class="block text-xs text-gray-500 mb-1">Auto-add on day</label>
									<input
										id="edit-scheduled-day"
										bind:value={editScheduledDay}
										type="number"
										min="1"
										max="28"
										class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
									/>
								</div>
								<div class="flex gap-2">
									<button
										type="button"
										onclick={updatePlan}
										class="flex-1 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
										>Save</button
									>
									<button
										type="button"
										onclick={cancelEdit}
										class="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
										>Cancel</button
									>
								</div>
							</div>
						{:else}
							<div class="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 group">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-1.5 flex-wrap">
										<span class="text-sm font-medium text-gray-800">{p.title}</span>
										{#if cat}
											<span
												class="text-xs px-1.5 py-0.5 rounded-full {COLOR_PALETTE[
													cat.color as ColorKey
												]?.classes ?? 'bg-gray-100 text-gray-600'}">{cat.label}</span
											>
										{/if}
										<span
											class="text-xs px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600"
											>🔄 {p.scheduledDay ? ordinal(p.scheduledDay) : 'Monthly'}</span
										>
									</div>
									<p class="text-xs text-gray-400 mt-0.5">
										Auto-creates expense {p.scheduledDay ? `on the ${ordinal(p.scheduledDay)}` : 'monthly'}
									</p>
								</div>
								<span class="text-sm font-semibold text-gray-900 shrink-0"
									>₹{p.amount.toFixed(2)}</span
								>
								<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
									<button
										type="button"
										onclick={() => startEdit(p)}
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
											<path
												d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
											/>
											<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
										</svg>
									</button>
									<button
										type="button"
										onclick={() => deletePlan(p.id)}
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
					{/each}
				</div>
			{/if}

			{#if monthlyPlans.length > 0}
				{#if recurringPlans.length > 0}
					<p class="text-xs text-gray-400 uppercase tracking-wide mb-2">This month</p>
				{/if}
				<div class="space-y-2">
					{#each monthlyPlans as p (p.id)}
						{@const cat = getCat(p.category)}
						{#if editingPlan?.id === p.id}
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
									onchange={(e) =>
										(editCategory = (e.currentTarget as HTMLSelectElement).value)}
									class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
								>
									{#each categories as cat (cat.id)}
										<option value={cat.name} selected={cat.name === effectiveEditCategory}
											>{cat.label}</option
										>
									{/each}
								</select>
								<div class="flex gap-2">
									<button
										type="button"
										onclick={updatePlan}
										class="flex-1 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
										>Save</button
									>
									<button
										type="button"
										onclick={cancelEdit}
										class="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
										>Cancel</button
									>
								</div>
							</div>
						{:else}
							<div class="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 group">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-1.5 flex-wrap">
										<span class="text-sm font-medium text-gray-800">{p.title}</span>
										{#if cat}
											<span
												class="text-xs px-1.5 py-0.5 rounded-full {COLOR_PALETTE[
													cat.color as ColorKey
												]?.classes ?? 'bg-gray-100 text-gray-600'}">{cat.label}</span
											>
										{/if}
									</div>
								</div>
								<span class="text-sm font-semibold text-gray-900 shrink-0"
									>₹{p.amount.toFixed(2)}</span
								>
								<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
									<button
										type="button"
										onclick={() => startEdit(p)}
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
											<path
												d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
											/>
											<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
										</svg>
									</button>
									<button
										type="button"
										onclick={() => deletePlan(p.id)}
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
					{/each}
				</div>
			{/if}

			<!-- Totals row -->
			{#if plans.length > 0}
				<div class="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
					<span>Total planned</span>
					<span class="font-semibold text-gray-700">₹{totalPlanned.toFixed(2)}</span>
				</div>
				{#if expectedBalance !== null}
					<div class="mt-1 flex justify-between text-xs">
						<span class="text-gray-500">Expected balance</span>
						<span class="font-semibold {expectedBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}">
							{expectedBalance >= 0 ? '' : '-'}₹{Math.abs(expectedBalance).toFixed(2)}
						</span>
					</div>
				{/if}
			{/if}
		{/if}

	<!-- ── INSIGHTS TAB ── -->
	{:else}
		{#if plans.length === 0 && expenses.length === 0}
			<p class="text-sm text-gray-400 text-center py-4">No data yet this month.</p>
		{:else}
			<!-- Expected balance -->
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

			<!-- Category comparison -->
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
									class="text-xs px-1.5 py-0.5 rounded-full {COLOR_PALETTE[
										cat.color as ColorKey
									]?.classes ?? 'bg-gray-100 text-gray-600'}">{cat.label}</span
								>
								<div class="text-right">
									{#if planned > 0 && actual > 0}
										<span
											class="text-xs font-medium {diff < 0 ? 'text-red-500' : 'text-emerald-600'}"
										>
											{diff < 0 ? '↑' : '↓'} ₹{Math.abs(diff).toFixed(0)}
										</span>
									{/if}
								</div>
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

			<!-- Totals comparison -->
			{#if totalPlanned > 0 || totalActual > 0}
				<div class="mt-4 pt-3 border-t border-gray-100 space-y-1 text-xs">
					<div class="flex justify-between text-gray-500">
						<span>Total planned</span>
						<span class="font-medium text-gray-700">₹{totalPlanned.toFixed(2)}</span>
					</div>
					<div class="flex justify-between text-gray-500">
						<span>Total actual</span>
						<span
							class="font-medium {totalActual > totalPlanned ? 'text-red-500' : 'text-gray-700'}"
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
	{/if}
</div>
