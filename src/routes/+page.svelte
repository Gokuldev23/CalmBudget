<script lang="ts">
	import Calendar from '$lib/components/Calendar.svelte';
	import ExpenseModal from '$lib/components/ExpenseModal.svelte';
	import MonthlySummary from '$lib/components/MonthlySummary.svelte';
	import MonthlyPlan from '$lib/components/MonthlyPlan.svelte';
	import type { Budget, CategoryItem, Expense, Plan } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const serverMonth = $derived(data.month);
	const serverYear = $derived(data.year);
	const serverExpenses = $derived(data.expenses as Expense[]);
	const serverCategories = $derived(data.categories as CategoryItem[]);
	const serverPlans = $derived(data.plans as Plan[]);

	let navMonth = $state<number | null>(null);
	let navYear = $state<number | null>(null);
	let fetchedExpenses = $state<Expense[] | null>(null);
	let fetchedCategories = $state<CategoryItem[] | null>(null);
	let fetchedPlans = $state<Plan[] | null>(null);

	const month = $derived(navMonth ?? serverMonth);
	const year = $derived(navYear ?? serverYear);
	const expenses = $derived(fetchedExpenses ?? serverExpenses);
	const categories = $derived(fetchedCategories ?? serverCategories);
	const plans = $derived(fetchedPlans ?? serverPlans);

	let selectedDate = $state<string | null>(null);

	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	const expensesByDate = $derived.by(() => {
		const map: Record<string, Expense[]> = {};
		for (const e of expenses) {
			(map[e.date] ??= []).push(e);
		}
		return map;
	});

	async function loadExpensesFor(m: number, y: number) {
		const res = await fetch(`/api/expenses?month=${m}&year=${y}`);
		if (res.ok) fetchedExpenses = await res.json();
	}

	async function loadCategories() {
		const res = await fetch('/api/categories');
		if (res.ok) fetchedCategories = await res.json();
	}

	async function loadPlans(m: number, y: number) {
		const res = await fetch(`/api/plans?month=${m}&year=${y}`);
		if (res.ok) fetchedPlans = await res.json();
	}

	async function prevMonth() {
		const newM = month === 1 ? 12 : month - 1;
		const newY = month === 1 ? year - 1 : year;
		navMonth = newM;
		navYear = newY;
		await Promise.all([loadExpensesFor(newM, newY), loadPlans(newM, newY)]);
	}

	async function nextMonth() {
		const newM = month === 12 ? 1 : month + 1;
		const newY = month === 12 ? year + 1 : year;
		navMonth = newM;
		navYear = newY;
		await Promise.all([loadExpensesFor(newM, newY), loadPlans(newM, newY)]);
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
		<div class="col-span-2">
			<Calendar
				{month}
				{year}
				{expensesByDate}
				{plans}
				{todayStr}
				onPrevMonth={prevMonth}
				onNextMonth={nextMonth}
				onDateClick={(date) => (selectedDate = date)}
			/>
		</div>

		<div class="space-y-6">
			<MonthlySummary
				{expenses}
				{month}
				{year}
				{categories}
				budget={data.budget as Budget | null}
			/>
			<MonthlyPlan
				{plans}
				{expenses}
				{categories}
				{month}
				{year}
				budget={data.budget as Budget | null}
				onPlanChanged={() => loadPlans(month, year)}
			/>
		</div>

		{#if selectedDate}
			<ExpenseModal
				date={selectedDate}
				{categories}
				expenses={expensesByDate[selectedDate] ?? []}
				monthPlans={plans}
				onClose={() => (selectedDate = null)}
				onAdded={() => loadExpensesFor(month, year)}
				onCategoryAdded={loadCategories}
			/>
		{/if}
	</main>
</div>
