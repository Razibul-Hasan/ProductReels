/**
 * Every call the admin app makes, named after what it does.
 *
 * Screens import from here and never build a path themselves.
 */

import { del, get, getList, post, put } from './client';

export { boot } from './client';

export const widgets = {
	list: ( params ) => getList( '/widgets', params ),
	get: ( id ) => get( `/widgets/${ id }` ),
	create: ( data ) => post( '/widgets', data ),
	update: ( id, data ) => put( `/widgets/${ id }`, data ),
	duplicate: ( id ) => post( `/widgets/${ id }/duplicate` ),
	remove: ( id ) => del( `/widgets/${ id }` ),
	stats: ( id, params ) => get( `/widgets/${ id }/stats`, params ),
};

export const reels = {
	list: ( params ) => getList( '/reels', params ),
	get: ( id ) => get( `/reels/${ id }` ),
	create: ( data ) => post( '/reels', data ),
	update: ( id, data ) => put( `/reels/${ id }`, data ),
	remove: ( id ) => del( `/reels/${ id }` ),
	bulkRemove: ( ids ) => post( '/reels/bulk-delete', { ids } ),
	validateUrl: ( url, source ) =>
		post( '/reels/validate-url', { url, source } ),
};

export const files = {
	remove: ( id ) => del( `/files/${ id }` ),
};

export const products = {
	search: ( params ) => getList( '/products', params ),
};

export const settings = {
	get: () => get( '/settings' ),
	update: ( data ) => put( '/settings', data ),
};
