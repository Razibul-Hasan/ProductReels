/**
 * Product card step: how tagged products appear, on the reel and in the
 * player.
 *
 * Add to cart and Direct Checkout are one buy button or the other, as in
 * 1.0.0: turning either on turns the other off in the same change, and a
 * polite status line says so. Both may be off.
 *
 * On a modern card the buy button is a round icon or a pill with its text;
 * a classic card always shows the text, so the choice is offered for modern
 * cards only.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Field,
	OptionCards,
	PanelSection,
	Segmented,
	TextField,
	Toggle,
} from '../../components/pr';

const CardArt = ( { kind } ) => (
	<span className={ `pr-cardart pr-cardart--${ kind }` }>
		<span className="pr-cardart__img" />
		<span className="pr-cardart__lines">
			<span />
			<span />
		</span>
		<span className="pr-cardart__btn" />
	</span>
);

export const CardStep = ( { styles, set } ) => {
	const [ status, setStatus ] = useState( '' );

	const setAddToCart = ( on ) => {
		if ( on && styles.directCheckout ) {
			set( { showAddToCart: true, directCheckout: false } );
			setStatus(
				__(
					'Direct Checkout is now off: a card has one buy button.',
					'productreels'
				)
			);

			return;
		}

		set( 'showAddToCart', on );
		setStatus( '' );
	};

	const setCheckout = ( on ) => {
		if ( on && styles.showAddToCart ) {
			set( { directCheckout: true, showAddToCart: false } );
			setStatus(
				__(
					'Add to cart is now off: a card has one buy button.',
					'productreels'
				)
			);

			return;
		}

		set( 'directCheckout', on );
		setStatus( '' );
	};

	return (
		<>
			<PanelSection title={ __( 'Style', 'productreels' ) }>
				<OptionCards
					variant="tile"
					className="pr-cardstyles"
					label={ __( 'Product card style', 'productreels' ) }
					value={ styles.productCardStyle }
					onChange={ ( value ) => set( 'productCardStyle', value ) }
					options={ [
						{
							value: 'modern',
							label: __( 'Modern', 'productreels' ),
							desc: __( 'A compact row', 'productreels' ),
							art: <CardArt kind="modern" />,
						},
						{
							value: 'classic',
							label: __( 'Classic', 'productreels' ),
							desc: __(
								'Opens a product panel beside the reel',
								'productreels'
							),
							art: <CardArt kind="classic" />,
						},
					] }
				/>
			</PanelSection>

			<PanelSection>
				<Toggle
					label={ __( 'Show ratings', 'productreels' ) }
					description={ __(
						'Stars from the product’s reviews.',
						'productreels'
					) }
					checked={ !! styles.showRatings }
					onChange={ ( value ) => set( 'showRatings', value ) }
				/>
			</PanelSection>

			<PanelSection title={ __( 'Buy button', 'productreels' ) }>
				<Toggle
					label={ __( 'Add to cart', 'productreels' ) }
					description={ __(
						'Adds the product and keeps the shopper on the page.',
						'productreels'
					) }
					checked={ !! styles.showAddToCart }
					onChange={ setAddToCart }
				/>
				{ styles.showAddToCart && (
					<div className="pr-subfields">
						<TextField
							label={ __( 'Button text', 'productreels' ) }
							value={ styles.addToCartText }
							onChange={ ( event ) =>
								set( 'addToCartText', event.target.value )
							}
						/>
					</div>
				) }
				<Toggle
					label={ __( 'Direct Checkout', 'productreels' ) }
					description={ __(
						'Adds the product and goes straight to checkout. Turns Add to cart off.',
						'productreels'
					) }
					checked={ !! styles.directCheckout }
					onChange={ setCheckout }
				/>
				{ styles.directCheckout && (
					<div className="pr-subfields">
						<TextField
							label={ __( 'Button text', 'productreels' ) }
							value={ styles.directCheckoutText }
							onChange={ ( event ) =>
								set( 'directCheckoutText', event.target.value )
							}
						/>
					</div>
				) }
				{ styles.productCardStyle !== 'classic' &&
					( styles.showAddToCart || styles.directCheckout ) && (
						<Field
							label={ __( 'Button look', 'productreels' ) }
							help={
								styles.buyButtonDisplay === 'text'
									? __(
											'A button with its text, next to the price.',
											'productreels'
										)
									: __(
											'A round icon button. Screen readers still hear its text.',
											'productreels'
										)
							}
						>
							<Segmented
								block
								label={ __( 'Button look', 'productreels' ) }
								value={ styles.buyButtonDisplay || 'icon' }
								onChange={ ( value ) =>
									set( 'buyButtonDisplay', value )
								}
								options={ [
									{
										value: 'icon',
										label: __( 'Icon', 'productreels' ),
									},
									{
										value: 'text',
										label: __( 'Text', 'productreels' ),
									},
								] }
							/>
						</Field>
					) }
				<p
					className="pr-cardnote pr-t-small"
					role="status"
					aria-live="polite"
				>
					{ status }
				</p>
			</PanelSection>
		</>
	);
};
