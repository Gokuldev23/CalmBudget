import { db } from '$lib/server/db';
import { expense, category } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { DEFAULT_CATEGORIES } from '$lib/constants';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(302, '/login');

	const userId = locals.user.id;

	// Seed default categories if user has none
	let categories = await db.select().from(category).where(eq(category.userId, userId));
	if (categories.length === 0) {
		await db
			.insert(category)
			.values(DEFAULT_CATEGORIES.map((c) => ({ userId, name: c.name, label: c.label, color: c.color })));
		categories = await db.select().from(category).where(eq(category.userId, userId));
	}

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
			and(eq(expense.userId, userId), gte(expense.date, startDate), lte(expense.date, endDate))
		)
		.orderBy(expense.date);

	return { expenses, categories, month, year };
};

export const actions: Actions = {
	addExpense: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const data = await request.formData();
		const title = data.get('title')?.toString().trim() ?? '';
		const amountStr = data.get('amount')?.toString() ?? '';
		const categoryName = data.get('category')?.toString() ?? '';
		const notes = data.get('notes')?.toString().trim() || null;
		const date = data.get('date')?.toString() ?? '';

		if (!title || !amountStr || !categoryName || !date) {
			return fail(400, { error: 'Missing required fields' });
		}

		const amount = parseFloat(amountStr);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Invalid amount' });
		}

		// Verify category exists for this user
		const [cat] = await db
			.select({ id: category.id })
			.from(category)
			.where(and(eq(category.userId, locals.user.id), eq(category.name, categoryName)))
			.limit(1);
		if (!cat) return fail(400, { error: 'Invalid category' });

		const [newExpense] = await db
			.insert(expense)
			.values({ userId: locals.user.id, title, amount, category: categoryName, notes, date })
			.returning();

		return { expense: newExpense };
	},

	signout: async ({ request }) => {
		await auth.api.signOut({ headers: request.headers });
		redirect(302, '/login');
	}
};
