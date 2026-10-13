/**
 * ShopLinks: what a reel sells, and the two ways to add to it.
 *
 * "Tag products" and "Add a button" open their pickers; below them every
 * link in the order the player shows it. A product row shows the product's
 * own photo, name and price; a button row its text, link and campaign.
 * Buttons can be edited, anything removed, and with more than one link the
 * order can be changed (1.0.0 could too).
 */

import { forwardRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { IconButton } from './Button';

/**
 * A link as people say it: the path for this site's own pages, the host and
 * path for anywhere else.
 *
 * @param {string} url The link.
 * @return {string} The short form.
 */
export const shortUrl = ( url ) => {
	try {
		const parsed = new URL( url );
		const path = `${ parsed.pathname }${ parsed.search }`.replace(
			/\/$/,
			''
		);

		if ( parsed.host === window.location.host ) {
			return path || '/';
		}

		return `${ parsed.host.replace( /^www\./, '' ) }${ path }`;
	} catch ( error ) {
		return url;
	}
};

const productMeta = ( link, product, wooActive ) => {
	if ( ! wooActive ) {
		return __( 'Hidden while WooCommerce is turned off', 'productreels' );
	}

	if ( product === undefined ) {
		return __( 'Loading…', 'productreels' );
	}

	if ( product === null ) {
		return __(
			'No longer for sale, so its card is hidden',
			'productreels'
		);
	}

	return (
		<span
			className="pr-price"
			/* price_html is WooCommerce's own formatted markup. */
			dangerouslySetInnerHTML={ { __html: product.price_html } }
		/>
	);
};

export const ShopLinks = forwardRef(
	(
		{
			links,
			products,
			wooActive,
			onTag,
			onAddButton,
			onEdit,
			onRemove,
			onMove,
		},
		tagRef
	) => (
		<div className="pr-stackv pr-shoplinks">
			<div className="pr-linkopts">
				<button
					ref={ tagRef }
					type="button"
					className="pr-linkopt"
					aria-haspopup="dialog"
					onClick={ onTag }
				>
					<span className="pr-linkopt__icon">
						<Icon name="tag" size={ 18 } />
					</span>
					<span className="pr-linkopt__text">
						<span className="pr-t-body-strong">
							{ __( 'Tag products', 'productreels' ) }
						</span>
						<span className="pr-t-small">
							{ __(
								'From your WooCommerce store',
								'productreels'
							) }
						</span>
					</span>
				</button>
				<button
					type="button"
					className="pr-linkopt"
					aria-haspopup="dialog"
					onClick={ onAddButton }
				>
					<span className="pr-linkopt__icon">
						<Icon name="link" size={ 18 } />
					</span>
					<span className="pr-linkopt__text">
						<span className="pr-t-body-strong">
							{ __( 'Add a button', 'productreels' ) }
						</span>
						<span className="pr-t-small">
							{ __(
								'Any link, with a campaign',
								'productreels'
							) }
						</span>
					</span>
				</button>
			</div>

			{ links.length > 0 && (
				<ul className="pr-attached">
					{ links.map( ( link, index ) => {
						const isProduct = link.btn_type === 'product';
						const product = isProduct
							? products[ Number( link.product_id ) ]
							: null;
						const name = isProduct
							? product?.name || link.buttonText
							: link.buttonText;

						return (
							<li className="pr-attach" key={ link.btn_uuid }>
								<span className="pr-attach__thumb">
									{ isProduct && product?.image ? (
										<img src={ product.image } alt="" />
									) : (
										<Icon
											name={ isProduct ? 'tag' : 'link' }
											size={ 18 }
										/>
									) }
								</span>
								<span className="pr-attach__text">
									<span className="pr-t-body-strong">
										{ name }
									</span>
									<span className="pr-attach__meta pr-t-small">
										{ isProduct
											? productMeta(
													link,
													product,
													wooActive
												)
											: sprintf(
													/* translators: 1: a link, 2: campaign name. */
													__(
														'%1$s in campaign “%2$s”',
														'productreels'
													),
													shortUrl( link.buttonUrl ),
													link.campaignName
												) }
									</span>
								</span>
								{ links.length > 1 && (
									<>
										<IconButton
											icon="arrow-up"
											label={ __(
												'Move up',
												'productreels'
											) }
											disabled={ index === 0 }
											onClick={ () =>
												onMove( index, index - 1 )
											}
										/>
										<IconButton
											icon="arrow-down"
											label={ __(
												'Move down',
												'productreels'
											) }
											disabled={
												index === links.length - 1
											}
											onClick={ () =>
												onMove( index, index + 1 )
											}
										/>
									</>
								) }
								{ ! isProduct && (
									<IconButton
										icon="pencil"
										label={ sprintf(
											/* translators: %s: button text. */
											__( 'Edit %s', 'productreels' ),
											name
										) }
										aria-haspopup="dialog"
										onClick={ () => onEdit( link ) }
									/>
								) }
								<IconButton
									icon="x"
									label={ sprintf(
										/* translators: %s: product name or button text. */
										__( 'Remove %s', 'productreels' ),
										name
									) }
									onClick={ () => onRemove( index ) }
								/>
							</li>
						);
					} ) }
				</ul>
			) }
		</div>
	)
);
