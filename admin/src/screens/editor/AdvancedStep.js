/**
 * Advanced step: lazy loading and a class for the merchant's own CSS.
 */

import { __ } from '@wordpress/i18n';
import { PanelSection, TextField, Toggle } from '../../components/pr';

export const AdvancedStep = ( { styles, set } ) => (
	<PanelSection>
		<Toggle
			label={ __( 'Lazy load videos', 'productreels' ) }
			description={ __(
				'Loads each video only when it scrolls into view.',
				'productreels'
			) }
			checked={ !! styles.lazyLoad }
			onChange={ ( value ) => set( 'lazyLoad', value ) }
		/>
		<TextField
			label={ __( 'CSS class', 'productreels' ) }
			help={ __(
				'Added to the widget’s wrapper, for your own CSS. Separate several with spaces.',
				'productreels'
			) }
			placeholder="my-reels"
			spellCheck={ false }
			autoComplete="off"
			value={ styles.customClass || '' }
			onChange={ ( event ) => set( 'customClass', event.target.value ) }
		/>
	</PanelSection>
);
