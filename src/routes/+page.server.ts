import { db } from '$lib/server/db';
import { expense } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(302, '/login');

	const now = new Date();
	const month = parseInt(url.searchParams.get('month') ?? String(now.getMonth() + 1));
	const year = parseInt(url.searchParams.get('year') ?? String(now.getFullYear()));

	const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
	const lastDay = new Date(year, month, 0).getDate();
	const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

	const expenses = await db
		.select()
		.from(expense)
		.where(
			and(eq(expense.userId, locals.user.id), gte(expense.date, startDate), lte(expense.date, endDate))
		)
		.orderBy(expense.date);

	return { expenses, month, year };
};

const VALID_CATEGORIES = ['medical', 'gadgets', 'entertainment', 'essentials', 'other'] as const;
type Category = (typeof VALID_CATEGORIES)[number];

export const actions: Actions = {
	addExpense: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const data = await request.formData();
		const title = data.get('title')?.toString().trim() ?? '';
		const amountStr = data.get('amount')?.toString() ?? '';
		const category = data.get('category')?.toString() ?? '';
		const notes = data.get('notes')?.toString().trim() || null;
		const date = data.get('date')?.toString() ?? '';

		if (!title || !amountStr || !category || !date) {
			return fail(400, { error: 'Missing required fields' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		if (!VALID_CATEGORIES.includes(category as Category)) {
			return fail(400, { error: 'Invalid category' });
		}

		const [newExpense] = await db
			.insert(expense)
			.values({
				userId: locals.user.id,
				title,
				amount,
				category: category as Category,
				notes,
				date
			})
			.returning();

		return { expense: newExpense };
	},

	signout: async ({ request }) => {
		await auth.api.signOut({ headers: request.headers });
		redirect(302, '/login');
	}
};
