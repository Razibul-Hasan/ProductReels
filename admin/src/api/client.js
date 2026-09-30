/**
 * The REST client.
 *
 * One place that knows about the nonce, the route base and the error envelope
 * the API returns, so no screen ever builds a URL or unwraps an error itself.
 */

import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

export const boot = window.productreelsAdmin || {};

if ( boot.nonce ) {
	apiFetch.use( apiFetch.createNonceMiddleware( boot.nonce ) );
}

if ( boot.restUrl ) {
	apiFetch.use( apiFetch.createRootURLMiddleware( boot.restUrl ) );
}

const NAMESPACE = 'productreels/v1';

const toQuery = ( params = {} ) => {
	const search = new URLSearchParams();

	Object.entries( params ).forEach( ( [ key, value ] ) => {
		if ( value === undefined || value === null || value === '' ) {
			return;
		}

		if ( Array.isArray( value ) ) {
			value.forEach( ( entry ) => search.append( `${ key }[]`, entry ) );

			return;
		}

		search.append( key, value );
	} );

	const query = search.toString();

	return query ? `?${ query }` : '';
};

/**
 * Turn whatever apiFetch rejected with into an Error worth showing someone.
 *
 * The API deliberately returns a generic message for server faults, so this
 * only has to cope with it being missing entirely — a dropped connection, say.
 *
 * @param {Object} error The rejection.
 * @return {Error} The error to show.
 */
const toError = ( error ) => {
	const message =
		error && typeof error.message === 'string' && error.message
			? error.message
			: __(
					'Something went wrong. Please try again.',
					'productreels'
				);

	const wrapped = new Error( message );

	wrapped.code = error?.code || 'productreels_request_failed';
	wrapped.status = error?.data?.status || 0;

	return wrapped;
};

const request = async ( options ) => {
	try {
		return await apiFetch( options );
	} catch ( error ) {
		throw toError( error );
	}
};

export const get = ( path, params ) =>
	request( { path: `/${ NAMESPACE }${ path }${ toQuery( params ) }` } );

export const post = ( path, data ) =>
	request( { path: `/${ NAMESPACE }${ path }`, method: 'POST', data } );

export const put = ( path, data ) =>
	request( { path: `/${ NAMESPACE }${ path }`, method: 'PUT', data } );

export const del = ( path ) =>
	request( { path: `/${ NAMESPACE }${ path }`, method: 'DELETE' } );

/**
 * A list request that also reports the totals the API sends as headers.
 *
 * @param {string} path   Route path.
 * @param {Object} params Query parameters.
 * @return {Promise<{items: Array, total: number, pages: number}>} The page.
 */
export const getList = async ( path, params ) => {
	let response;

	try {
		response = await apiFetch( {
			path: `/${ NAMESPACE }${ path }${ toQuery( params ) }`,
			parse: false,
		} );
	} catch ( error ) {
		throw toError( error );
	}

	if ( ! response.ok ) {
		let body = {};

		try {
			body = await response.json();
		} catch ( error ) {
			body = {};
		}

		throw toError( body );
	}

	return {
		items: await response.json(),
		total: Number( response.headers.get( 'X-WP-Total' ) || 0 ),
		pages: Number( response.headers.get( 'X-WP-TotalPages' ) || 0 ),
	};
};
