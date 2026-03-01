export interface CategoryItem {
	id: number;
	name: string;
	label: string;
	color: string;
}

export interface Expense {
	id: number;
	userId: string;
	title: string;
	amount: number;
	category: string;
	notes: string | null;
	date: string;
	createdAt: Date | string;
}
