/**
 * Client-side v4 UUIDs for new files and links.
 *
 * A link's btn_uuid is minted once, when it is created, and never again: it
 * is the key every click is counted against.
 */

/** A version 4 UUID, from the platform where it exists and by hand where it does not. */
export const uuid = () => {
	if ( window.crypto?.randomUUID ) {
		return window.crypto.randomUUID();
	}

	const bytes = new Uint8Array( 16 );

	window.crypto.getRandomValues( bytes );
	// RFC 4122 §4.4: version and variant bits, set the way the spec writes them.
	// eslint-disable-next-line no-bitwise
	bytes[ 6 ] = ( bytes[ 6 ] & 0x0f ) | 0x40;
	// eslint-disable-next-line no-bitwise
	bytes[ 8 ] = ( bytes[ 8 ] & 0x3f ) | 0x80;

	const hex = Array.from( bytes, ( byte ) =>
		byte.toString( 16 ).padStart( 2, '0' )
	).join( '' );

	return `${ hex.slice( 0, 8 ) }-${ hex.slice( 8, 12 ) }-${ hex.slice(
		12,
		16
	) }-${ hex.slice( 16, 20 ) }-${ hex.slice( 20 ) }`;
};
