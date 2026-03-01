export interface CategoryItem {
	id: number;
	name: string;
	label: string;
	color: string;
}

export interface Budget {
	id: number;
	userId: string;
	amount: number;
	creditDay: number;
}

export interface Plan {
	id: number;
	userId: string;
	title: string;
	amount: number;
	category: string;
	month: number | null;
	year: number | null;
	isRecurring: boolean;
	scheduledDay: number | null;
}

export interface Expense {
	id: number;
	userId: string;
	title: string;
	amount: number;
	category: string;
	notes: string | null;
	date: string;
	planId?: number | null;
	createdAt: Date | string;
}
