export type Category = 'medical' | 'gadgets' | 'entertainment' | 'essentials' | 'other';

export interface Expense {
	id: number;
	userId: string;
	title: string;
	amount: number;
	category: Category;
	notes: string | null;
	date: string;
	createdAt: Date | string;
}
