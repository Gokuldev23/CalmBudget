import { db } from '$lib/server/db';
import { category } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import { COLOR_PALETTE } from '$lib/constants';
import type { ColorKey } from '$lib/constants';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const categories = await db
		.select()
		.from(category)
		.where(eq(category.userId, locals.user.id));

	return json(categories);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const data = await request.formData();
	const label = data.get('label')?.toString().trim() ?? '';
	const color = data.get('color')?.toString() ?? '';

	if (!label) error(400, 'Label is required');
	if (!(color in COLOR_PALETTE)) error(400, 'Invalid color');

	const name = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
	if (!name) error(400, 'Invalid label');

	const [existing] = await db
		.select({ id: category.id })
		.from(category)
		.where(and(eq(category.userId, locals.user.id), eq(category.name, name)))
		.limit(1);
	if (existing) error(400, 'Category already exists');

	const [created] = await db
		.insert(category)
		.values({ userId: locals.user.id, name, label, color: color as ColorKey })
		.returning();

	return json(created, { status: 201 });
};
