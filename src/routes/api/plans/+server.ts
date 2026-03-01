import { db } from '$lib/server/db';
import { plan } from '$lib/server/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const month = parseInt(url.searchParams.get('month') ?? '1');
	const year = parseInt(url.searchParams.get('year') ?? String(new Date().getFullYear()));

	// Return plans for this specific month/year + all recurring plans
	const plans = await db
		.select()
		.from(plan)
		.where(
			and(
				eq(plan.userId, locals.user.id),
				or(
					and(eq(plan.month, month), eq(plan.year, year)),
					and(isNull(plan.month), isNull(plan.year), eq(plan.isRecurring, true))
				)
			)
		)
		.orderBy(plan.createdAt);

	return json(plans);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const data = await request.formData();
	const title = data.get('title')?.toString().trim() ?? '';
	const amountStr = data.get('amount')?.toString() ?? '';
	const category = data.get('category')?.toString() ?? '';
	const isRecurring = data.get('isRecurring') === 'true';
	const scheduledDayStr = data.get('scheduledDay')?.toString() ?? '';
	const monthStr = data.get('month')?.toString() ?? '';
	const yearStr = data.get('year')?.toString() ?? '';

	if (!title || !amountStr || !category) error(400, 'Missing required fields');

	const amount = parseFloat(amountStr);
	if (isNaN(amount) || amount <= 0) error(400, 'Invalid amount');

	const scheduledDay = scheduledDayStr ? parseInt(scheduledDayStr) : null;
	const month = isRecurring ? null : parseInt(monthStr) || null;
	const year = isRecurring ? null : parseInt(yearStr) || null;

	const [newPlan] = await db
		.insert(plan)
		.values({
			userId: locals.user.id,
			title,
			amount,
			category,
			month,
			year,
			isRecurring,
			scheduledDay: isRecurring ? scheduledDay : null
		})
		.returning();

	return json(newPlan);
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const data = await request.formData();
	const id = parseInt(data.get('id')?.toString() ?? '');
	const title = data.get('title')?.toString().trim() ?? '';
	const amountStr = data.get('amount')?.toString() ?? '';
	const category = data.get('category')?.toString() ?? '';
	const scheduledDayStr = data.get('scheduledDay')?.toString() ?? '';

	if (!id || !title || !amountStr || !category) error(400, 'Missing required fields');

	const amount = parseFloat(amountStr);
	if (isNaN(amount) || amount <= 0) error(400, 'Invalid amount');

	const scheduledDay = scheduledDayStr ? parseInt(scheduledDayStr) : null;

	const [updated] = await db
		.update(plan)
		.set({ title, amount, category, scheduledDay })
		.where(and(eq(plan.id, id), eq(plan.userId, locals.user.id)))
		.returning();

	if (!updated) error(404, 'Plan not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const id = parseInt(url.searchParams.get('id') ?? '');
	if (!id) error(400, 'Missing id');

	const [deleted] = await db
		.delete(plan)
		.where(and(eq(plan.id, id), eq(plan.userId, locals.user.id)))
		.returning();

	if (!deleted) error(404, 'Plan not found');
	return json({ success: true });
};
