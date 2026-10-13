/**
 * Place it: put this widget on a page.
 *
 * The shortcode, then how to add the widget with the block editor and with
 * Elementor (small pictures of their ProductReels placeholders, drawn with
 * the same pr-builder pieces, not images), then the single-reel shortcode.
 * Before the first save there is nothing to place yet, so the step says so.
 */

import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { Button, PanelSection, ShortcodeChip } from '../../components/pr';

/**
 * A builder's ProductReels placeholder with this widget chosen. A picture,
 * not a control: hidden from assistive technology, the sentence beside it
 * says the same thing.
 *
 * @param {Object} props         Props.
 * @param {string} props.builder "Block editor" or "Elementor".
 * @param {string} props.name    The widget's name.
 * @return {Object} The picture.
 */
const BuilderArt = ( { builder, name } ) => (
	<div className="pr-builder pr-builder--art" aria-hidden="true">
		<div className="pr-builder__head">
			<span className="pr-builder__badge">
				<Icon name="film" size={ 16 } />
			</span>
			<div>
				<div className="pr-t-label">ProductReels</div>
				<div className="pr-t-caption pr-muted">{ builder }</div>
			</div>
		</div>
		<div className="pr-builder__fake pr-t-small">
			<span>{ name }</span>
			<Icon name="chevron-down" size={ 16 } />
		</div>
	</div>
);

export const PlaceStep = ( { id, name, onSave, saving } ) => {
	if ( ! id ) {
		return (
			<PanelSection>
				<div className="pr-placenote">
					<p className="pr-t-body">
						{ __(
							'Save the widget to get its shortcode.',
							'productreels'
						) }
					</p>
					<Button icon="check" busy={ saving } onClick={ onSave }>
						{ __( 'Save widget', 'productreels' ) }
					</Button>
				</div>
			</PanelSection>
		);
	}

	const label = name || __( 'Untitled widget', 'productreels' );

	return (
		<>
			<PanelSection title={ __( 'Shortcode', 'productreels' ) }>
				<ShortcodeChip
					code={ `[productreels id="${ id }"]` }
					size="lg"
				/>
				<p className="pr-t-small pr-muted">
					{ __(
						'Paste it into any page, post or text widget.',
						'productreels'
					) }
				</p>
			</PanelSection>

			<PanelSection title={ __( 'Block editor', 'productreels' ) }>
				<p className="pr-t-body">
					{ sprintf(
						/* translators: %s: the widget's name. */
						__(
							'Add the ProductReels block and choose “%s”.',
							'productreels'
						),
						label
					) }
				</p>
				<BuilderArt
					builder={ __( 'Block editor', 'productreels' ) }
					name={ label }
				/>
			</PanelSection>

			<PanelSection title={ __( 'Elementor', 'productreels' ) }>
				<p className="pr-t-body">
					{ sprintf(
						/* translators: %s: the widget's name. */
						__(
							'Drag the ProductReels widget onto the page and choose “%s”.',
							'productreels'
						),
						label
					) }
				</p>
				<BuilderArt
					builder={ __( 'Elementor', 'productreels' ) }
					name={ label }
				/>
			</PanelSection>

			<PanelSection title={ __( 'Single reels', 'productreels' ) }>
				<p className="pr-t-body">
					{ createInterpolateElement(
						__(
							'To show one reel on its own, use <code>[productreels_reel id="…"]</code> with the reel’s ID from the Reels screen.',
							'productreels'
						),
						{ code: <code className="pr-t-code pr-placecode" /> }
					) }
				</p>
			</PanelSection>
		</>
	);
};
