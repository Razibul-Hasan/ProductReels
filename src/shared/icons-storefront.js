/**
 * The icons the storefront draws: the subset of icons.js that tiles, product
 * cards and the player use. Kept apart so the public bundle carries these
 * and not the admin's whole set; icons.js spreads them back in.
 *
 * Icons: Lucide (https://lucide.dev), lucide-static 0.441.0, ISC licence.
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as
 * part of Feather (MIT). All other copyright (c) for Lucide are held by
 * Lucide Contributors 2022.
 *
 * Static strings only: the icon component injects them as markup, so
 * nothing user-supplied may ever be added here.
 */
export const STOREFRONT_ICONS = {
	plus: '<path d="M5 12h14" /><path d="M12 5v14" />',
	play: '<polygon points="6 3 20 12 6 21 6 3" />',
	pause: '<rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" />',
	eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />',
	'arrow-left': '<path d="m12 19-7-7 7-7" /><path d="M19 12H5" />',
	check: '<path d="M20 6 9 17l-5-5" />',
	x: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
	'chevron-left': '<path d="m15 18-6-6 6-6" />',
	'chevron-right': '<path d="m9 18 6-6-6-6" />',
	'chevron-down': '<path d="m6 9 6 6 6-6" />',
	'chevron-up': '<path d="m18 15-6-6-6 6" />',
	cart: '<circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />',
	volume: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.364 18.364a9 9 0 0 0 0-12.728" />',
	mute: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /><line x1="22" x2="16" y1="9" y2="15" /><line x1="16" x2="22" y1="9" y2="15" />',
	star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />',
	zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />',
	loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56" />',
};
