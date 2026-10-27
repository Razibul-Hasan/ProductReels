/**
 * Place it: put this widget on a page.
 *
 * The shortcode, then how to add the widget with the block editor and with
 * Elementor (small pictures of their ProductReels placeholders, drawn with
 * the same pr-builder pieces, not images), then the single-reel shortcode.
 * Before the first save there is nothing to place yet, so the step says so.
 *
 * With WooCommerce, "Product pages" comes first: show the widget on every
 * product page at a chosen spot, with no shortcode at all. It is a setting
 * like any other, so it is there before the first save too.
 */

import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { boot } from '../../api';
import {
	Button,
	PanelSection,
	ShortcodeChip,
	Toggle,
} from '../../components/pr';
import { SelectField } from './fields';

/**
 * Where on a product page the widget can go, in page order. The values are
 * the keys of Productreels_Product_Pages::POSITIONS.
 *
 * @return {Array<{value:string,label:string}>} The options.
 */
const positions = () => [
	{
		value: 'before_product',
		label: __( 'Above the product', 'productreels' ),
	},
	{
		value: 'after_cart',
		label: __( 'Under Add to cart', 'productreels' ),
	},
	{
		value: 'before_tabs',
		label: __( 'Below the product, above the tabs', 'productreels' ),
	},
	{
		value: 'after_tabs',
		label: __( 'Below the tabs', 'productreels' ),
	},
	{
		value: 'after_product',
		label: __( 'At the end of the page', 'productreels' ),
	},
];

/**
 * "Show on product pages" and where.
 *
 * @param {Object}   props        Props.
 * @param {Object}   props.styles The widget's styles.
 * @param {Function} props.set    Style setter.
 * @return {Object|null} The section, or nothing without WooCommerce.
 */
const ProductPagesSection = ( { styles, set } ) => {
	if ( ! boot.hasWoo ) {
		return null;
	}

	const page = styles.productPage || {};
	const fromProduct = styles.reelSource === 'product';

	return (
		<PanelSection title={ __( 'Product pages', 'productreels' ) }>
			<Toggle
				label={ __( 'Show on product pages', 'productreels' ) }
				description={
					fromProduct
						? __(
								'Adds this widget to every product page, showing each product’s own reels.',
								'productreels'
							)
						: __(
								'Adds this widget to every product page. To show each product’s own reels, choose “Current product’s reels” in the Reels step.',
								'productreels'
							)
				}
				checked={ !! page.show }
				onChange={ ( value ) => set( 'productPage.show', value ) }
			/>
			{ page.show && (
				<SelectField
					label={ __( 'Position', 'productreels' ) }
					help={ __(
						'Where it appears on the page. Applies once you save the widget.',
						'productreels'
					) }
					value={ page.position || 'before_tabs' }
					options={ positions() }
					onChange={ ( value ) =>
						set( 'productPage.position', value )
					}
				/>
			) }
		</PanelSection>
	);
};

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

export const PlaceStep = ( { id, name, styles, set, onSave, saving } ) => {
	if ( ! id ) {
		return (
			<>
				<ProductPagesSection styles={ styles } set={ set } />
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
			</>
		);
	}

	const label = name || __( 'Untitled widget', 'productreels' );

	return (
		<>
			<ProductPagesSection styles={ styles } set={ set } />

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
