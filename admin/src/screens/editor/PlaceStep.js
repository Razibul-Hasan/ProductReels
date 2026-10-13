/**
 * Place it: the widget's shortcode. Part 09 adds the block, Elementor and
 * single-reel instructions.
 */

import { __ } from '@wordpress/i18n';
import { Button, PanelSection, ShortcodeChip } from '../../components/pr';

export const PlaceStep = ( { id, onSave, saving } ) =>
	id > 0 ? (
		<PanelSection title={ __( 'Shortcode', 'productreels' ) }>
			<ShortcodeChip code={ `[productreels id="${ id }"]` } />
			<p className="pr-t-small pr-muted">
				{ __(
					'Paste it into any page, post or text widget.',
					'productreels'
				) }
			</p>
		</PanelSection>
	) : (
		<PanelSection>
			<p className="pr-t-body">
				{ __(
					'Save the widget to get its shortcode.',
					'productreels'
				) }
			</p>
			<Button
				variant="secondary"
				icon="check"
				busy={ saving }
				onClick={ onSave }
			>
				{ __( 'Save widget', 'productreels' ) }
			</Button>
		</PanelSection>
	);
