import { db } from '$lib/server/db';
import { expense } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const month = parseInt(url.searchParams.get('month') ?? '1');
	const year = parseInt(url.searchParams.get('year') ?? String(new Date().getFullYear()));

	const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
	const lastDay = new Date(year, month, 0).getDate();
	const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

	const expenses = await db
		.select()
		.from(expense)
		.where(
			and(
				eq(expense.userId, locals.user.id),
				gte(expense.date, startDate),
				lte(expense.date, endDate)
			)
		)
		.orderBy(expense.date);

	return json(expenses);
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const data = await request.formData();
	const id = parseInt(data.get('id')?.toString() ?? '');
	const title = data.get('title')?.toString().trim() ?? '';
	const amountStr = data.get('amount')?.toString() ?? '';
	const categoryName = data.get('category')?.toString() ?? '';
	const notes = data.get('notes')?.toString().trim() || null;

	if (!id || !title || !amountStr || !categoryName) error(400, 'Missing required fields');

	const amount = parseFloat(amountStr);
	if (isNaN(amount) || amount <= 0) error(400, 'Invalid amount');

	const [updated] = await db
		.update(expense)
		.set({ title, amount, category: categoryName, notes })
		.where(and(eq(expense.id, id), eq(expense.userId, locals.user.id)))
		.returning();

	if (!updated) error(404, 'Expense not found');

	return json(updated);
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const id = parseInt(url.searchParams.get('id') ?? '');
	if (!id) error(400, 'Missing id');

	const [deleted] = await db
		.delete(expense)
		.where(and(eq(expense.id, id), eq(expense.userId, locals.user.id)))
		.returning();

	if (!deleted) error(404, 'Expense not found');

	return json({ success: true });
};
