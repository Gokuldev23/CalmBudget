import { pgTable, serial, text, real, date, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const category = pgTable('category', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	label: text('label').notNull(),
	color: text('color').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const expense = pgTable('expense', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	amount: real('amount').notNull(),
	category: text('category').notNull(),
	notes: text('notes'),
	date: date('date').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export * from './auth.schema';
