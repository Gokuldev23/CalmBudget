import {
	pgTable,
	serial,
	text,
	real,
	date,
	timestamp,
	integer,
	boolean
} from 'drizzle-orm/pg-core';
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

export const budget = pgTable('budget', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	amount: real('amount').notNull(),
	creditDay: integer('credit_day').notNull().default(1)
});

// plan must be defined before expense (expense.planId references plan.id)
export const plan = pgTable('plan', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	amount: real('amount').notNull(),
	category: text('category').notNull(),
	month: integer('month'), // null = recurring every month
	year: integer('year'), // null = recurring every month
	isRecurring: boolean('is_recurring').notNull().default(false),
	scheduledDay: integer('scheduled_day'), // day of month to auto-create expense when recurring
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
	planId: integer('plan_id').references(() => plan.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export * from './auth.schema';
