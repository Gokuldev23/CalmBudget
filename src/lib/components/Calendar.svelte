<script lang="ts">
	import { DAYS, MONTH_NAMES } from '$lib/constants';
	import type { Expense } from '$lib/types';

	interface Props {
		month: number;
		year: number;
		expensesByDate: Record<string, Expense[]>;
		todayStr: string;
		onPrevMonth: () => void;
		onNextMonth: () => void;
		onDateClick: (date: string) => void;
	}

	let { month, year, expensesByDate, todayStr, onPrevMonth, onNextMonth, onDateClick }: Props =
		$props();

	const calendarDays = $derived.by(() => {
		const firstDay = new Date(year, month - 1, 1);
		const totalDays = new Date(year, month, 0).getDate();
		const cells: (string | null)[] = Array(firstDay.getDay()).fill(null);
		for (let d = 1; d <= totalDays; d++) {
			cells.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
		}
		return cells;
	});

	function dayNum(dateStr: string) {
		return parseInt(dateStr.split('-')[2]);
	}
</script>

<div class="bg-white rounded-xl border border-gray-100 p-6">
	<!-- Month navigation -->
	<div class="flex items-center justify-between mb-6">
		<button
			onclick={onPrevMonth}
			class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg"
			aria-label="Previous month"
		>‹</button>
		<h2 class="font-medium text-gray-900">{MONTH_NAMES[month - 1]} {year}</h2>
		<button
			onclick={onNextMonth}
			class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-lg"
			aria-label="Next month"
		>›</button>
	</div>

	<!-- Day headers + date cells -->
	<div class="grid grid-cols-7 gap-1">
		{#each DAYS as d (d)}
			<div class="text-center text-xs text-gray-400 font-medium py-2">{d}</div>
		{/each}

		{#each calendarDays as dateStr, i (i)}
			{#if dateStr === null}
				<div></div>
			{:else}
				{@const isToday = dateStr === todayStr}
				{@const dayExpenses = expensesByDate[dateStr] ?? []}
				{@const hasExpenses = dayExpenses.length > 0}
				{@const hasPlanDot = dayExpenses.some((e) => e.planId != null)}
				<button
					onclick={() => onDateClick(dateStr)}
					class="relative aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
						{isToday
						? 'bg-indigo-600 text-white font-semibold hover:bg-indigo-700'
						: 'text-gray-700 hover:bg-gray-50'}"
				>
					{dayNum(dateStr)}
					{#if hasExpenses || hasPlanDot}
						<span class="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 items-center">
							{#if hasExpenses}
								<span
									class="w-1 h-1 rounded-full {isToday ? 'bg-indigo-200' : 'bg-indigo-400'}"
								></span>
							{/if}
							{#if hasPlanDot}
								<span
									class="w-1 h-1 rounded-full {isToday ? 'bg-violet-300' : 'bg-violet-500'}"
								></span>
							{/if}
						</span>
					{/if}
				</button>
			{/if}
		{/each}
	</div>
</div>
