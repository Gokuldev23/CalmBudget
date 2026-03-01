<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	type Expense = PageData['expenses'][0];

	const CATEGORIES = ['medical', 'gadgets', 'entertainment', 'essentials', 'other'] as const;
	type Category = (typeof CATEGORIES)[number];

	const LABELS: Record<Category, string> = {
		medical: 'Medical',
		gadgets: 'Gadgets',
		entertainment: 'Entertainment',
		essentials: 'Essentials',
		other: 'Other'
	};
	const COLORS: Record<Category, string> = {
		medical: 'bg-rose-50 text-rose-600',
		gadgets: 'bg-blue-50 text-blue-600',
		entertainment: 'bg-violet-50 text-violet-600',
		essentials: 'bg-emerald-50 text-emerald-600',
		other: 'bg-gray-100 text-gray-600'
	};

	const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const MONTH_NAMES = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	// Server-derived base values
	const serverMonth = $derived(data.month);
	const serverYear = $derived(data.year);
	const serverExpenses = $derived(data.expenses);

	// Local navigation overrides (null = use server value)
	let navMonth = $state<number | null>(null);
	let navYear = $state<number | null>(null);
	let fetchedExpenses = $state<Expense[] | null>(null);

	const month = $derived(navMonth ?? serverMonth);
	const year = $derived(navYear ?? serverYear);
	const expenses = $derived(fetchedExpenses ?? serverExpenses);
	let selectedDate = $state<string | null>(null);

	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	const calendarDays = $derived.by(() => {
		const firstDay = new Date(year, month - 1, 1);
		const totalDays = new Date(year, month, 0).getDate();
		const cells: (string | null)[] = Array(firstDay.getDay()).fill(null);
		for (let d = 1; d <= totalDays; d++) {
			cells.push(
				`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
			);
		}
		return cells;
	});

	const expensesByDate = $derived.by(() => {
		const map: Record<string, Expense[]> = {};
		for (const e of expenses) {
			(map[e.date] ??= []).push(e);
		}
		return map;
	});

	const total = $derived(expenses.reduce((s, e) => s + e.amount, 0));

	const byCategory = $derived.by(() => {
		const map: Partial<Record<Category, number>> = {};
		for (const e of expenses) {
			map[e.category as Category] = (map[e.category as Category] ?? 0) + e.amount;
		}
		return map;
	});

	async function loadExpensesFor(m: number, y: number) {
		const res = await fetch(`/api/expenses?month=${m}&year=${y}`);
		if (res.ok) fetchedExpenses = await res.json();
	}

	async function prevMonth() {
		const m = month;
		const y = year;
		const newM = m === 1 ? 12 : m - 1;
		const newY = m === 1 ? y - 1 : y;
		navMonth = newM;
		navYear = newY;
		await loadExpensesFor(newM, newY);
	}

	async function nextMonth() {
		const m = month;
		const y = year;
		const newM = m === 12 ? 1 : m + 1;
		const newY = m === 12 ? y + 1 : y;
		navMonth = newM;
		navYear = newY;
		await loadExpensesFor(newM, newY);
	}

	function formatDay(d: string) {
		return parseInt(d.split('-')[2]);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white border-b border-gray-100 px-6 py-4">
		<div class="max-w-5xl mx-auto flex items-center justify-between">
			<span class="font-semibold text-gray-900">CalmBudget</span>
			<div class="flex items-center gap-3 text-sm">
				<span class="text-gray-500">{data.user?.name}</span>
				<form method="POST" action="?/signout">
					<button class="text-gray-400 hover:text-gray-700">Sign out</button>
				</form>
			</div>
		</div>
	</header>

	<main class="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
		<!-- Calendar -->
		<div class="col-span-2 bg-white rounded-xl border border-gray-100 p-6">
			<div class="flex items-center justify-between mb-6">
				<button
					onclick={prevMonth}
					class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg"
					aria-label="Previous month">‹</button
				>
				<h2 class="font-medium text-gray-900">{MONTH_NAMES[month - 1]} {year}</h2>
				<button
					onclick={nextMonth}
					class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg"
					aria-label="Next month">›</button
				>
			</div>

			<div class="grid grid-cols-7 gap-1">
				{#each DAYS as d (d)}
					<div class="text-center text-xs text-gray-400 font-medium py-2">{d}</div>
				{/each}
				{#each calendarDays as dateStr, i (i)}
					{#if dateStr === null}
						<div></div>
					{:else}
						{@const isToday = dateStr === todayStr}
						{@const hasDot = (expensesByDate[dateStr]?.length ?? 0) > 0}
						<button
							onclick={() => {
								selectedDate = dateStr;
							}}
							class="relative aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
								{isToday
								? 'bg-indigo-600 text-white font-semibold hover:bg-indigo-700'
								: 'text-gray-700 hover:bg-gray-50'}"
						>
							{formatDay(dateStr)}
							{#if hasDot}
								<span
									class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full {isToday
										? 'bg-indigo-200'
										: 'bg-indigo-400'}"
								></span>
							{/if}
						</button>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Monthly Summary -->
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
								<span class="text-xs px-2 py-0.5 rounded-full {COLORS[cat]}">{LABELS[cat]}</span>
								<span class="text-sm font-medium text-gray-800">${byCategory[cat]!.toFixed(2)}</span>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

<!-- Add Expense Modal -->
{#if selectedDate}
	<button
		type="button"
		class="fixed inset-0 bg-black/30 z-50 cursor-default"
		onclick={() => {
			selectedDate = null;
		}}
		aria-label="Close dialog"
	></button>

	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 pointer-events-auto"
		>
			<h2 class="font-semibold text-gray-900 mb-1">Add Expense</h2>
			<p class="text-sm text-gray-400 mb-5">
				{MONTH_NAMES[parseInt(selectedDate.split('-')[1]) - 1]}
				{parseInt(selectedDate.split('-')[2])}, {selectedDate.split('-')[0]}
			</p>

			<form
				method="POST"
				action="?/addExpense"
				class="space-y-4"
				use:enhance={() => async ({ result }) => {
					if (result.type === 'success') {
						await loadExpensesFor(month, year);
						selectedDate = null;
					}
				}}
			>
				<input type="hidden" name="date" value={selectedDate} />

				<div>
					<label for="expense-title" class="block text-sm font-medium text-gray-700 mb-1"
						>Title</label
					>
					<input
						id="expense-title"
						name="title"
						type="text"
						required
						placeholder="e.g. Grocery run"
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label for="expense-amount" class="block text-sm font-medium text-gray-700 mb-1"
						>Amount ($)</label
					>
					<input
						id="expense-amount"
						name="amount"
						type="number"
						step="0.01"
						min="0.01"
						required
						placeholder="0.00"
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label for="expense-category" class="block text-sm font-medium text-gray-700 mb-1"
						>Category</label
					>
					<select
						id="expense-category"
						name="category"
						required
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						{#each CATEGORIES as cat (cat)}
							<option value={cat}>{LABELS[cat]}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="expense-notes" class="block text-sm font-medium text-gray-700 mb-1">
						Notes <span class="text-gray-400 font-normal">(optional)</span>
					</label>
					<textarea
						id="expense-notes"
						name="notes"
						rows="2"
						placeholder="Any additional details..."
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
					></textarea>
				</div>

				<div class="flex gap-3 pt-2">
					<button
						type="button"
						onclick={() => {
							selectedDate = null;
						}}
						class="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
					>
						Add Expense
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
