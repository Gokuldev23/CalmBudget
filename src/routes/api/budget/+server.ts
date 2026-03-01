import { db } from '$lib/server/db';
import { budget } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	const [b] = await db.select().from(budget).where(eq(budget.userId, locals.user.id)).limit(1);
	return json(b ?? null);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const data = await request.formData();
	const amountStr = data.get('amount')?.toString() ?? '';
	const creditDayStr = data.get('creditDay')?.toString() ?? '1';

	const amount = parseFloat(amountStr);
	if (isNaN(amount) || amount <= 0) error(400, 'Invalid amount');

	const creditDay = parseInt(creditDayStr);
	if (isNaN(creditDay) || creditDay < 1 || creditDay > 28) error(400, 'Invalid credit day');

	const [upserted] = await db
		.insert(budget)
		.values({ userId: locals.user.id, amount, creditDay })
		.onConflictDoUpdate({ target: budget.userId, set: { amount, creditDay } })
		.returning();

	return json(upserted);
};
