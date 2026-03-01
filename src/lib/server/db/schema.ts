import { pgTable, serial, text, real, date, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const expense = pgTable('expense', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	amount: real('amount').notNull(),
	category: text('category', {
		enum: ['medical', 'gadgets', 'entertainment', 'essentials', 'other']
	}).notNull(),
	notes: text('notes'),
	date: date('date').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export * from './auth.schema';
