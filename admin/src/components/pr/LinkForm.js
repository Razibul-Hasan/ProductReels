/**
 * LinkForm: a custom button on a reel.
 *
 * Same fields and the same rules as 1.0.0: text, a full http(s) link and a
 * campaign are required; new tab and a CSS class are optional. Errors say
 * what to do ("Add https:// to the start of the link."). The button's
 * btn_uuid is the caller's business: an edit keeps it, so its clicks keep
 * counting.
 */

import { __ } from '@wordpress/i18n';
import { TextField, Toggle } from './Fields';

/**
 * The form's values for a link, or for a new one.
 *
 * @param {Object|null} link A custom link, or null.
 * @return {Object} The draft.
 */
export const linkDraft = ( link ) => ( {
	buttonText: link?.buttonText || '',
	buttonUrl: link?.buttonUrl || '',
	campaignName: link?.campaignName || '',
	// 1.0.0 opened new buttons in a new tab unless told otherwise.
	openInNewTab: link ? link.openInNewTab !== false : true,
	customClass: link?.customClass || '',
} );

const isWebLink = ( value ) => {
	try {
		const parsed = new URL( value );

		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch ( error ) {
		return false;
	}
};

/**
 * What is wrong with a draft, field by field.
 *
 * @param {Object} draft The draft.
 * @return {Object} Messages keyed by field; empty when it can be saved.
 */
export const validateLink = ( draft ) => {
	const errors = {};
	const url = draft.buttonUrl.trim();

	if ( draft.buttonText.trim() === '' ) {
		errors.buttonText = __(
			'Add the words shoppers see on the button.',
			'productreels'
		);
	}

	if ( draft.campaignName.trim() === '' ) {
		errors.campaignName = __(
			"Add a campaign name to group this button's clicks.",
			'productreels'
		);
	}

	if ( url === '' ) {
		errors.buttonUrl = __(
			'Add the link the button opens.',
			'productreels'
		);
	} else if ( ! isWebLink( url ) ) {
		errors.buttonUrl =
			! /^[a-z][a-z0-9+.-]*:/i.test( url ) &&
			isWebLink( `https://${ url }` )
				? __( 'Add https:// to the start of the link.', 'productreels' )
				: __(
						"This isn't a full web link. It should look like https://yourstore.com/sale.",
						'productreels'
					);
	}

	return errors;
};

export const LinkForm = ( { draft, errors, onChange } ) => {
	const set = ( key ) => ( event ) =>
		onChange( { ...draft, [ key ]: event.target.value } );

	return (
		<div className="pr-stackv">
			<div className="pr-fieldgrid">
				<TextField
					label={ __( 'Button text', 'productreels' ) }
					placeholder={ __( 'Shop the look', 'productreels' ) }
					help={ __(
						'Short and specific works best.',
						'productreels'
					) }
					error={ errors.buttonText }
					value={ draft.buttonText }
					onChange={ set( 'buttonText' ) }
					data-field="buttonText"
				/>
				<TextField
					label={ __( 'Campaign', 'productreels' ) }
					placeholder={ __( 'October sale', 'productreels' ) }
					help={ __(
						"Groups this button's clicks in statistics.",
						'productreels'
					) }
					error={ errors.campaignName }
					value={ draft.campaignName }
					onChange={ set( 'campaignName' ) }
					data-field="campaignName"
				/>
			</div>
			<TextField
				label={ __( 'Link', 'productreels' ) }
				icon="link"
				type="url"
				inputMode="url"
				spellCheck="false"
				placeholder="https://"
				error={ errors.buttonUrl }
				value={ draft.buttonUrl }
				onChange={ set( 'buttonUrl' ) }
				data-field="buttonUrl"
			/>
			<Toggle
				label={ __( 'Open in a new tab', 'productreels' ) }
				description={ __(
					'Keeps the reel open behind it.',
					'productreels'
				) }
				checked={ draft.openInNewTab }
				onChange={ ( value ) =>
					onChange( { ...draft, openInNewTab: value } )
				}
			/>
			<TextField
				label={ __( 'CSS class', 'productreels' ) }
				placeholder={ __( 'optional', 'productreels' ) }
				help={ __(
					'For your own styling. Added to the button.',
					'productreels'
				) }
				value={ draft.customClass }
				onChange={ set( 'customClass' ) }
			/>
		</div>
	);
};
