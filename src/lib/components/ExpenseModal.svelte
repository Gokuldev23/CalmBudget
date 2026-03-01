<script lang="ts">
	import { enhance } from '$app/forms';
	import { CATEGORIES, CATEGORY_LABELS, MONTH_NAMES } from '$lib/constants';

	interface Props {
		date: string;
		onClose: () => void;
		onAdded: () => Promise<void>;
	}

	let { date, onClose, onAdded }: Props = $props();

	const [year, month, day] = $derived(date.split('-').map(Number));
	const displayDate = $derived(`${MONTH_NAMES[month - 1]} ${day}, ${year}`);
</script>

<!-- Backdrop -->
<button
	type="button"
	class="fixed inset-0 bg-black/30 z-50 cursor-default"
	onclick={onClose}
	aria-label="Close dialog"
></button>

<!-- Dialog -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
	<div
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 pointer-events-auto"
	>
		<h2 class="font-semibold text-gray-900 mb-1">Add Expense</h2>
		<p class="text-sm text-gray-400 mb-5">{displayDate}</p>

		<form
			method="POST"
			action="?/addExpense"
			class="space-y-4"
			use:enhance={() => async ({ result }) => {
				if (result.type === 'success') {
					await onAdded();
					onClose();
				}
			}}
		>
			<input type="hidden" name="date" value={date} />

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
						<option value={cat}>{CATEGORY_LABELS[cat]}</option>
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
					onclick={onClose}
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
