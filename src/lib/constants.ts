export const COLOR_PALETTE = {
	rose:    { classes: 'bg-rose-50 text-rose-600',      swatch: '#fda4af' },
	orange:  { classes: 'bg-orange-50 text-orange-600',  swatch: '#fdba74' },
	amber:   { classes: 'bg-amber-50 text-amber-600',    swatch: '#fcd34d' },
	emerald: { classes: 'bg-emerald-50 text-emerald-600', swatch: '#6ee7b7' },
	blue:    { classes: 'bg-blue-50 text-blue-600',      swatch: '#93c5fd' },
	violet:  { classes: 'bg-violet-50 text-violet-600',  swatch: '#c4b5fd' },
	pink:    { classes: 'bg-pink-50 text-pink-600',      swatch: '#f9a8d4' },
	gray:    { classes: 'bg-gray-100 text-gray-600',     swatch: '#d1d5db' }
} as const;

export type ColorKey = keyof typeof COLOR_PALETTE;

export const COLOR_KEYS = Object.keys(COLOR_PALETTE) as ColorKey[];

export const DEFAULT_CATEGORIES: Array<{ name: string; label: string; color: ColorKey }> = [
	{ name: 'medical',       label: 'Medical',       color: 'rose'    },
	{ name: 'gadgets',       label: 'Gadgets',        color: 'blue'    },
	{ name: 'entertainment', label: 'Entertainment',  color: 'violet'  },
	{ name: 'essentials',    label: 'Essentials',     color: 'emerald' },
	{ name: 'other',         label: 'Other',           color: 'gray'    }
];

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const MONTH_NAMES = [
	'January', 'February', 'March',     'April',
	'May',     'June',     'July',      'August',
	'September', 'October', 'November', 'December'
] as const;
