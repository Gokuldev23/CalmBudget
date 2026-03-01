<script lang="ts">
	import { enhance } from '$app/forms';
	import { MONTH_NAMES, COLOR_PALETTE, COLOR_KEYS } from '$lib/constants';
	import type { ColorKey } from '$lib/constants';
	import type { CategoryItem } from '$lib/types';

	interface Props {
		date: string;
		categories: CategoryItem[];
		onClose: () => void;
		onAdded: () => Promise<void>;
		onCategoryAdded: () => Promise<void>;
	}

	let { date, categories, onClose, onAdded, onCategoryAdded }: Props = $props();

	const [year, month, day] = $derived(date.split('-').map(Number));
	const displayDate = $derived(`${MONTH_NAMES[month - 1]} ${day}, ${year}`);

	// '' means "use first category from list"; set explicitly when user picks or adds
	let selectedCategory = $state('');
	const effectiveCategory = $derived(selectedCategory || categories[0]?.name || '');

	let addingCategory = $state(false);
	let newLabel = $state('');
	let newColor = $state<ColorKey>(COLOR_KEYS[0]);
	let addError = $state('');

	async function createCategory() {
		if (!newLabel.trim()) return;
		const fd = new FormData();
		fd.append('label', newLabel.trim());
		fd.append('color', newColor);
		const res = await fetch('/api/categories', { method: 'POST', body: fd });
		if (res.ok) {
			const cat = await res.json();
			await onCategoryAdded();
			selectedCategory = cat.name;
			addingCategory = false;
			newLabel = '';
			newColor = COLOR_KEYS[0];
			addError = '';
		} else {
			const err = await res.json();
			addError = err.message ?? 'Failed to add category';
		}
	}
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
					>Amount (₹)</label
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
				<div class="flex items-center justify-between mb-1">
					<label for="expense-category" class="text-sm font-medium text-gray-700">Category</label>
					{#if !addingCategory}
						<button
							type="button"
							onclick={() => (addingCategory = true)}
							class="text-xs text-indigo-500 hover:text-indigo-700"
						>
							+ New category
						</button>
					{/if}
				</div>

				<!-- Always submit via hidden input so select needs no name -->
				<input type="hidden" name="category" value={effectiveCategory} />

				{#if !addingCategory}
					<select
						id="expense-category"
						onchange={(e) => (selectedCategory = (e.currentTarget as HTMLSelectElement).value)}
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						{#each categories as cat (cat.id)}
							<option value={cat.name} selected={cat.name === effectiveCategory}
								>{cat.label}</option
							>
						{/each}
					</select>
				{:else}
					<div class="border border-gray-200 rounded-lg p-3 space-y-2.5">
						<input
							bind:value={newLabel}
							type="text"
							placeholder="Category name"
							class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>

						<div class="flex gap-1.5 flex-wrap">
							{#each COLOR_KEYS as key (key)}
								<label class="cursor-pointer">
									<input type="radio" bind:group={newColor} value={key} class="sr-only" />
									<span
										class="block w-5 h-5 rounded-full transition-all {newColor === key
											? 'ring-2 ring-offset-1 ring-indigo-500'
											: ''}"
										style="background-color: {COLOR_PALETTE[key].swatch}"
									></span>
								</label>
							{/each}
						</div>

						{#if addError}
							<p class="text-xs text-red-500">{addError}</p>
						{/if}

						<div class="flex gap-2">
							<button
								type="button"
								onclick={createCategory}
								class="flex-1 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
							>
								Add
							</button>
							<button
								type="button"
								onclick={() => {
									addingCategory = false;
									addError = '';
								}}
								class="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
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
