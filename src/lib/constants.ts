import type { Category } from './types';

export const CATEGORIES = [
	'medical',
	'gadgets',
	'entertainment',
	'essentials',
	'other'
] as const satisfies readonly Category[];

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const MONTH_NAMES = [
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
] as const;

export const CATEGORY_LABELS: Record<Category, string> = {
	medical: 'Medical',
	gadgets: 'Gadgets',
	entertainment: 'Entertainment',
	essentials: 'Essentials',
	other: 'Other'
};

export const CATEGORY_COLORS: Record<Category, string> = {
	medical: 'bg-rose-50 text-rose-600',
	gadgets: 'bg-blue-50 text-blue-600',
	entertainment: 'bg-violet-50 text-violet-600',
	essentials: 'bg-emerald-50 text-emerald-600',
	other: 'bg-gray-100 text-gray-600'
};
