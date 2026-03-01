<script lang="ts">
	import { enhance } from '$app/forms';
	import { MONTH_NAMES, COLOR_PALETTE, COLOR_KEYS } from '$lib/constants';
	import type { ColorKey } from '$lib/constants';
	import type { CategoryItem, Expense } from '$lib/types';
	import { fly } from 'svelte/transition';

	interface Props {
		date: string;
		categories: CategoryItem[];
		expenses: Expense[];
		onClose: () => void;
		onAdded: () => Promise<void>;
		onCategoryAdded: () => Promise<void>;
	}

	let { date, categories, expenses, onClose, onAdded, onCategoryAdded }: Props = $props();

	const [year, month, day] = $derived(date.split('-').map(Number));
	const displayDate = $derived(`${MONTH_NAMES[month - 1]} ${day}, ${year}`);

	// '' means "use first category from list"; set explicitly when user picks or adds
	let selectedCategory = $state('');
	const effectiveCategory = $derived(selectedCategory || categories[0]?.name || '');

	let addingCategory = $state(false);
	let newLabel = $state('');
	let newColor = $state<ColorKey>(COLOR_KEYS[0]);
	let addError = $state('');

	// Edit state
	let editingExpense = $state<Expense | null>(null);
	let editTitle = $state('');
	let editAmount = $state(0);
	let editNotes = $state('');
	let editCategory = $state('');
	const effectiveEditCategory = $derived(editCategory || categories[0]?.name || '');

	function startEdit(e: Expense) {
		editingExpense = { ...e };
		editTitle = e.title;
		editAmount = e.amount;
		editNotes = e.notes ?? '';
		editCategory = e.category;
		addingCategory = false;
	}

	function cancelEdit() {
		editingExpense = null;
	}

	async function deleteExpense(id: number) {
		if (!confirm('Delete this expense?')) return;
		const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
		if (res.ok) {
			if (editingExpense?.id === id) cancelEdit();
			await onAdded();
		}
	}

	async function updateExpense(ev: SubmitEvent) {
		ev.preventDefault();
		if (!editingExpense) return;
		const fd = new FormData(ev.currentTarget as HTMLFormElement);
		const res = await fetch('/api/expenses', { method: 'PATCH', body: fd });
		if (res.ok) {
			await onAdded();
			cancelEdit();
		}
	}

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

	function getCat(name: string) {
		return categories.find((c) => c.name === name);
	}
</script>

<!-- Backdrop -->
<button
	type="button"
	class="fixed inset-0 bg-black/30 z-50 cursor-default"
	onclick={onClose}
	aria-label="Close dialog"
	transition:fly={{ duration: 200 }}
></button>

<!-- Dialog -->
<div
	transition:fly={{ duration: 500 }}
	class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
>
	<div
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		class="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 pointer-events-auto"
	>
		<h2 class="font-semibold text-gray-900 mb-1">
			{editingExpense ? 'Edit Expense' : 'Add Expense'}
		</h2>
		<p class="text-sm text-gray-400 mb-5">{displayDate}</p>

		<!-- Existing expenses list -->
		{#if expenses.length > 0}
			<div class="mb-4 space-y-2">
				{#each expenses as exp (exp.id)}
					{@const cat = getCat(exp.category)}
					<div
						class="flex items-center gap-2 p-2.5 rounded-lg border {editingExpense?.id === exp.id
							? 'border-indigo-200 bg-indigo-50'
							: 'border-gray-100 hover:border-gray-200'} transition-colors"
					>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-800 truncate">{exp.title}</p>
							<div class="flex items-center gap-1.5 mt-0.5">
								{#if cat}
									<span
										class="text-xs px-1.5 py-0.5 rounded-full {COLOR_PALETTE[
											cat.color as ColorKey
										]?.classes ?? 'bg-gray-100 text-gray-600'}">{cat.label}</span
									>
								{/if}
								{#if exp.notes}
									<span class="text-xs text-gray-400 truncate">{exp.notes}</span>
								{/if}
							</div>
						</div>
						<span class="text-sm font-semibold text-gray-900 shrink-0"
							>₹{exp.amount.toFixed(2)}</span
						>
						<button
							type="button"
							onclick={() => startEdit(exp)}
							class="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
							aria-label="Edit expense"
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
						<button
							type="button"
							onclick={() => deleteExpense(exp.id)}
							class="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
							aria-label="Delete expense"
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
								<polyline points="3 6 5 6 21 6" />
								<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
								<path d="M10 11v6M14 11v6" />
								<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
			<hr class="mb-4 border-gray-100" />
		{/if}

		<!-- Edit form -->
		{#if editingExpense}
			<form class="space-y-4" onsubmit={updateExpense}>
				<input type="hidden" name="id" value={editingExpense.id} />
				<input type="hidden" name="category" value={effectiveEditCategory} />

				<div>
					<label for="edit-title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
					<input
						id="edit-title"
						name="title"
						type="text"
						required
						bind:value={editTitle}
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label for="edit-amount" class="block text-sm font-medium text-gray-700 mb-1"
						>Amount (₹)</label
					>
					<input
						id="edit-amount"
						name="amount"
						type="number"
						step="0.01"
						min="0.01"
						required
						bind:value={editAmount}
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label for="edit-category" class="block text-sm font-medium text-gray-700 mb-1"
						>Category</label
					>
					<select
						id="edit-category"
						onchange={(e) => (editCategory = (e.currentTarget as HTMLSelectElement).value)}
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						{#each categories as cat (cat.id)}
							<option value={cat.name} selected={cat.name === effectiveEditCategory}
								>{cat.label}</option
							>
						{/each}
					</select>
				</div>

				<div>
					<label for="edit-notes" class="block text-sm font-medium text-gray-700 mb-1">
						Notes <span class="text-gray-400 font-normal">(optional)</span>
					</label>
					<textarea
						id="edit-notes"
						name="notes"
						rows="2"
						bind:value={editNotes}
						class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
					></textarea>
				</div>

				<div class="flex gap-3 pt-2">
					<button
						type="button"
						onclick={cancelEdit}
						class="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
					>
						Update Expense
					</button>
				</div>
			</form>

		<!-- Add form -->
		{:else}
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
		{/if}
	</div>
</div>
