import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { error: error.message || 'Sign in failed' });
			}
			return fail(500, { error: 'Unexpected error' });
		}

		redirect(302, '/');
	},

	register: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString() ?? '';
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		try {
			await auth.api.signUpEmail({ body: { name, email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { error: error.message || 'Registration failed' });
			}
			return fail(500, { error: 'Unexpected error' });
		}

		redirect(302, '/');
	}
};
