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
