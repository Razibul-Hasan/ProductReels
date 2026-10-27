/**
 * Number formatting for every count and metric in the admin.
 *
 * One formatter, in the admin's own locale (the `lang` WordPress prints on
 * <html>), so "12,480" reads "12.480" for a German admin and every screen
 * agrees. Falls back to the browser's locale if the tag is one Intl rejects.
 */

const formatters = new Map();

const formatter = ( options = {} ) => {
	const key = JSON.stringify( options );

	if ( ! formatters.has( key ) ) {
		const lang = document.documentElement.lang || undefined;
		let made;

		try {
			made = new Intl.NumberFormat( lang, options );
		} catch ( error ) {
			made = new Intl.NumberFormat( undefined, options );
		}

		formatters.set( key, made );
	}

	return formatters.get( key );
};

/**
 * A whole number with the locale's grouping, e.g. 12480 → "12,480".
 *
 * @param {number} value The number.
 * @return {string} The formatted number, or the input unchanged if it is not a number.
 */
export const formatNumber = ( value ) =>
	typeof value === 'number' && Number.isFinite( value )
		? formatter( { maximumFractionDigits: 0 } ).format( value )
		: value;

/**
 * A percentage from a value that is already a percentage, e.g. 8.25 → "8.3%".
 *
 * @param {number} value  The percentage (0–100).
 * @param {number} digits Fraction digits to show.
 * @return {string} The formatted percentage.
 */
export const formatPercent = ( value, digits = 1 ) =>
	formatter( {
		style: 'percent',
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	} ).format( value / 100 );

/**
 * Click rate as shown in tables and metrics: "—" when nothing was viewed.
 *
 * @param {number} clicks Clicks.
 * @param {number} views  Views.
 * @return {string} The formatted rate.
 */
export const formatRate = ( clicks, views ) =>
	views ? formatPercent( ( clicks / views ) * 100 ) : '—';

/**
 * An amount in the store's currency, e.g. 1249.5 → "$1,249.50".
 *
 * Uses the store's currency code (from the admin bootstrap) with the
 * admin's locale; falls back to the store's symbol and decimals when Intl
 * doesn't know the code.
 *
 * @param {number} value    The amount.
 * @param {Object} currency { code, symbol, position, decimals } from the bootstrap.
 * @return {string} The formatted amount.
 */
export const formatMoney = ( value, currency = {} ) => {
	const amount =
		typeof value === 'number' && Number.isFinite( value ) ? value : 0;
	const decimals = Number.isInteger( currency.decimals )
		? currency.decimals
		: 2;

	try {
		return formatter( {
			style: 'currency',
			currency: currency.code || 'USD',
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		} ).format( amount );
	} catch ( error ) {
		const number = formatter( {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		} ).format( amount );

		return ( currency.position || 'left' ).startsWith( 'right' )
			? `${ number }${ currency.symbol || '' }`
			: `${ currency.symbol || '' }${ number }`;
	}
};

/**
 * A compact amount or count for chart ticks, e.g. 12480 → "12K".
 *
 * @param {number} value The number.
 * @return {string} The formatted number.
 */
export const formatCompact = ( value ) =>
	formatter( { notation: 'compact', maximumFractionDigits: 1 } ).format(
		value
	);
