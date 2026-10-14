/**
 * The product panel: the classic card's product, opened up.
 *
 * On a wide screen it is docked beside the stage, the same height as the
 * reel, for as long as the reel has a tagged product; on a phone it is a
 * sheet that rises over the reel when the card's "Shop now" is pressed.
 * Either way it is one product at a time: its pictures, name, price, its
 * options when it has variations, and the one buy button. A reel that tags
 * several products opens on the list of them, and the back arrow returns
 * there.
 *
 * What a tile already knows — name, price, picture — paints at once from the
 * batch lookup. The rest (the gallery, attributes, variations) comes from
 * the WooCommerce Store API when the panel opens; until it answers, or if it
 * never does, the panel is the product with its one picture, and a product
 * that needs its options chosen links to its own page.
 *
 * The buy button follows the card settings: Add to cart, or Buy now when
 * Direct Checkout is on; with both off it is a link to the product page.
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Price, Stars } from '../ProductCard';
import { ReelIcon } from '../ReelIcon';

const ARROWS = [ 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown' ];

const same = ( a, b ) =>
	String( a ).toLowerCase() === String( b ).toLowerCase();

/* The term of an attribute a variation's value names: a slug for a global
   attribute, the option text itself for a product's own. */
const termFor = ( attribute, value ) =>
	( attribute.terms || [] ).find(
		( term ) => same( term.slug, value ) || same( term.name, value )
	);

/* Whether a variation fits the chosen terms. An empty value is "any". */
const fits = ( variation, choices, picks ) =>
	( variation.attributes || [] ).every( ( item ) => {
		if ( ! item.value ) {
			return true;
		}

		const attribute = choices.find( ( choice ) =>
			same( choice.name, item.name )
		);

		if ( ! attribute ) {
			return true;
		}

		const term = termFor( attribute, item.value );

		return !! term && picks[ attribute.name ] === term.slug;
	} );

/* The first choice: the product's defaults, else its first variation. */
const firstPicks = ( choices, variations ) => {
	const first = variations[ 0 ];
	const picks = {};

	choices.forEach( ( attribute ) => {
		let term = attribute.terms.find( ( item ) => item.default );

		if ( ! term && first ) {
			const item = ( first.attributes || [] ).find( ( value ) =>
				same( value.name, attribute.name )
			);

			term = item && item.value ? termFor( attribute, item.value ) : null;
		}

		picks[ attribute.name ] = ( term || attribute.terms[ 0 ] ).slug;
	} );

	return picks;
};

/* One lookup through the services; null while it runs, false if it fails. */
const useStoreProduct = ( id, services ) => {
	const [ data, setData ] = useState( null );

	useEffect( () => {
		if ( ! id ) {
			setData( null );

			return undefined;
		}

		let live = true;

		setData( null );
		services
			.getProduct( id )
			.then( ( value ) => live && setData( value || false ) )
			.catch( () => live && setData( false ) );

		return () => {
			live = false;
		};
	}, [ id, services ] );

	return data;
};

/**
 * The pictures, one per swipe, with a dot for each.
 *
 * @param {Object} props        Props.
 * @param {Array}  props.images Store API images: { id, src, srcset, sizes, alt }.
 * @param {string} props.name   The product's name, the first picture's fallback alt.
 * @param {number} props.focus  The picture to show, when it changes (-1: none).
 * @return {Object} The gallery.
 */
const Gallery = ( { images, name, focus } ) => {
	const track = useRef( null );
	const [ index, setIndex ] = useState( 0 );

	const go = ( to, smooth = true ) => {
		const node = track.current;

		if ( ! node ) {
			return;
		}

		const rtl = window.getComputedStyle( node ).direction === 'rtl';

		node.scrollTo( {
			left: to * node.clientWidth * ( rtl ? -1 : 1 ),
			behavior: smooth ? 'smooth' : 'auto',
		} );
		setIndex( to );
	};

	useEffect( () => {
		if ( focus >= 0 ) {
			go( focus );
		}
		// Only a new picture to show moves the gallery, not a re-render.
	}, [ focus ] );

	const onScroll = () => {
		const node = track.current;

		if ( node && node.clientWidth ) {
			setIndex(
				Math.round( Math.abs( node.scrollLeft ) / node.clientWidth )
			);
		}
	};

	return (
		<div className="prs-pp__gallery">
			<div
				ref={ track }
				className="prs-pp__track"
				onScroll={ images.length > 1 ? onScroll : undefined }
			>
				{ images.length === 0 && <span className="prs-pp__shot" /> }
				{ images.map( ( image, position ) => (
					<span
						key={ `${ image.id }-${ image.src }` }
						className="prs-pp__shot"
					>
						<img
							src={ image.src }
							srcSet={ image.srcset || undefined }
							sizes={
								image.srcset
									? '(max-width: 782px) 100vw, 520px'
									: undefined
							}
							alt={ image.alt || ( position === 0 ? name : '' ) }
							loading={ position === 0 ? undefined : 'lazy' }
							decoding="async"
						/>
					</span>
				) ) }
			</div>

			{ images.length > 1 && (
				<div className="prs-pp__dots">
					{ images.map( ( image, position ) => (
						<button
							key={ `${ image.id }-${ image.src }` }
							type="button"
							className={ `prs-pp__dot${
								position === index ? ' is-on' : ''
							}` }
							aria-current={
								position === index ? 'true' : undefined
							}
							aria-label={ sprintf(
								/* translators: 1: picture number, 2: how many pictures there are. */
								__(
									'Show picture %1$d of %2$d',
									'productreels'
								),
								position + 1,
								images.length
							) }
							onClick={ () => go( position ) }
						/>
					) ) }
				</div>
			) }
		</div>
	);
};

/**
 * One product, opened up.
 *
 * @param {Object}   props          Props.
 * @param {Object}   props.link     The reel's product link.
 * @param {Object}   props.base     The product from the batch lookup.
 * @param {Object}   props.styles   The widget's styles.
 * @param {Object}   props.services The services.
 * @param {Function} props.onTrack  (link) => void — a click on the product.
 * @param {Function} props.onToast  (tone, message) => void.
 * @return {Object} The product.
 */
const Detail = ( { link, base, styles, services, onTrack, onToast } ) => {
	const info = useStoreProduct( Number( link.product_id ), services );
	const [ picks, setPicks ] = useState( {} );
	const [ state, setState ] = useState( 'idle' );

	const variable =
		!! info &&
		info.type === 'variable' &&
		Array.isArray( info.variations ) &&
		info.variations.length > 0;
	const choices = variable
		? ( info.attributes || [] ).filter(
				( attribute ) =>
					attribute.has_variations &&
					attribute.terms &&
					attribute.terms.length > 0
			)
		: [];
	const chosen =
		variable && choices.every( ( attribute ) => picks[ attribute.name ] );
	const variation = chosen
		? info.variations.find( ( item ) => fits( item, choices, picks ) )
		: null;
	const variationId = variation ? variation.id : 0;
	const picked = useStoreProduct( variationId, services );

	useEffect( () => {
		setPicks( variable ? firstPicks( choices, info.variations ) : {} );
		// The product's answer sets the first choice, once.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ info ] );

	// A new choice is a new thing to buy.
	useEffect( () => setState( 'idle' ), [ variationId ] );

	const gallery =
		info && info.images && info.images.length
			? info.images
			: [ { id: 0, src: base.image, alt: '' } ].filter(
					( image ) => image.src
				);
	const shot = picked && picked.images && picked.images[ 0 ];
	const images =
		shot &&
		! gallery.some(
			( image ) => image.id === shot.id || image.src === shot.src
		)
			? [ shot, ...gallery ]
			: gallery;
	const focus = shot
		? images.findIndex(
				( image ) => image.id === shot.id || image.src === shot.src
			)
		: -1;

	const priceHtml = ( picked && picked.price_html ) || base.price_html;
	const description =
		info && info.short_description ? info.short_description.trim() : '';

	const wantsBuy = !! ( styles.directCheckout || styles.showAddToCart );
	const busy = state === 'adding';

	const add = async () => {
		if ( busy ) {
			return;
		}

		onTrack( link );
		setState( 'adding' );

		try {
			await services.addToCart(
				variation ? { ...base, id: variation.id } : base,
				link,
				1,
				variation
					? choices.map( ( attribute ) => ( {
							attribute: attribute.taxonomy || attribute.name,
							value: picks[ attribute.name ],
						} ) )
					: undefined
			);

			if ( styles.directCheckout ) {
				// Busy until the page changes underneath it.
				window.location.assign(
					services.checkoutUrl || services.cartUrl || base.permalink
				);

				return;
			}

			setState( 'added' );
			onToast(
				'success',
				__( 'Product added to cart!', 'productreels' )
			);
		} catch ( error ) {
			setState( 'idle' );
			onToast(
				'error',
				error && error.message
					? sprintf(
							/* translators: %s: the error message from WooCommerce. */
							__( 'Failed to add to cart: %s', 'productreels' ),
							error.message
						)
					: __(
							'Failed to add to cart. Please try again.',
							'productreels'
						)
			);
		}
	};

	const visit = () => onTrack( link );

	// What the one button is: a button, a link, or a word in its place.
	let action;

	if ( ! wantsBuy ) {
		action = {
			href: base.permalink,
			text: __( 'View product', 'productreels' ),
		};
	} else if ( state === 'added' ) {
		action = {
			href: services.cartUrl || base.permalink,
			text: __( 'View cart', 'productreels' ),
			icon: 'check',
			done: true,
		};
	} else if ( variable ) {
		if ( ! variation ) {
			action = {
				off: true,
				text: __( 'Unavailable', 'productreels' ),
			};
		} else if ( picked && ! picked.is_in_stock ) {
			action = {
				off: true,
				text: __( 'Out of stock', 'productreels' ),
			};
		} else {
			action = { buy: true };
		}
	} else if ( ! base.in_stock ) {
		action = { off: true, text: __( 'Out of stock', 'productreels' ) };
	} else if ( base.purchasable ) {
		action = { buy: true };
	} else if ( info === null ) {
		// A product that needs choices, before its choices are known.
		action = {
			off: true,
			wait: true,
			text: __( 'Loading…', 'productreels' ),
		};
	} else {
		action = {
			href: base.permalink,
			text: __( 'Select options', 'productreels' ),
			icon: 'chevron-right',
		};
	}

	let main;

	if ( action.buy ) {
		const text = styles.directCheckout
			? styles.directCheckoutText || __( 'Buy now', 'productreels' )
			: styles.addToCartText || __( 'Add to cart', 'productreels' );

		main = (
			<button
				type="button"
				className="prs-pp__buy pr-t-body-strong"
				disabled={ busy }
				aria-busy={ busy ? 'true' : undefined }
				onClick={ add }
			>
				{ busy && (
					<ReelIcon name="loader" size={ 18 } className="prs-spin" />
				) }
				{ busy && ! styles.directCheckout
					? __( 'Adding…', 'productreels' )
					: text }
			</button>
		);
	} else if ( action.href ) {
		main = (
			<a
				className={ `prs-pp__buy pr-t-body-strong${
					action.done ? ' is-done' : ''
				}` }
				href={ action.href }
				onClick={ action.done ? undefined : visit }
			>
				{ action.icon && <ReelIcon name={ action.icon } size={ 18 } /> }
				{ action.text }
			</a>
		);
	} else {
		main = (
			<span
				className="prs-pp__buy pr-t-body-strong is-disabled"
				aria-disabled="true"
			>
				{ action.wait && (
					<ReelIcon name="loader" size={ 18 } className="prs-spin" />
				) }
				{ action.text }
			</span>
		);
	}

	return (
		<>
			<div className="prs-pp__scroll">
				<Gallery images={ images } name={ base.name } focus={ focus } />

				<div className="prs-pp__body">
					<div className="prs-pp__head">
						<h2 className="prs-pp__name pr-t-display">
							<a href={ base.permalink } onClick={ visit }>
								{ base.name }
							</a>
						</h2>
						{ styles.showRatings && base.rating_count > 0 && (
							<Stars
								rating={ base.rating }
								reviews={ base.rating_count }
							/>
						) }
						<Price html={ priceHtml } className="pr-t-title" />
					</div>

					{ choices.map( ( attribute ) => (
						<div
							key={ attribute.name }
							className="prs-pp__option"
							role="group"
							aria-label={ attribute.name }
						>
							<span
								className="prs-pp__label pr-t-body-strong"
								aria-hidden="true"
							>
								{ attribute.name }
							</span>
							<div className="prs-pp__pills">
								{ attribute.terms.map( ( term ) => {
									const on =
										picks[ attribute.name ] === term.slug;
									const open = info.variations.some(
										( item ) =>
											fits( item, choices, {
												...picks,
												[ attribute.name ]: term.slug,
											} )
									);

									return (
										<button
											key={ term.slug }
											type="button"
											className={ `prs-pp__pill pr-t-body${
												on ? ' is-on' : ''
											}${ open ? '' : ' is-off' }` }
											aria-pressed={ on }
											onClick={ () =>
												setPicks( ( value ) => ( {
													...value,
													[ attribute.name ]:
														term.slug,
												} ) )
											}
										>
											{ term.name }
										</button>
									);
								} ) }
							</div>
						</div>
					) ) }

					{ description && (
						<div
							className="prs-pp__desc pr-t-body"
							// The Store API's own short description: the product's
							// excerpt, already passed through wp_kses_post.
							dangerouslySetInnerHTML={ { __html: description } }
						/>
					) }

					<a
						className="prs-pp__more pr-t-body-strong"
						href={ base.permalink }
						onClick={ visit }
					>
						{ __( 'View full details', 'productreels' ) }
						<ReelIcon name="chevron-right" size={ 16 } />
					</a>
				</div>
			</div>

			<div className="prs-pp__foot">
				{ main }
				{ wantsBuy && services.cartUrl && (
					<a
						className="prs-pp__cart"
						href={ services.cartUrl }
						aria-label={ __( 'View cart', 'productreels' ) }
					>
						<ReelIcon name="cart" size={ 22 } />
					</a>
				) }
			</div>
		</>
	);
};

/* Grey blocks where the product will be, while the batch lookup runs. */
const Skeleton = () => (
	<div className="prs-pp__scroll is-loading" aria-busy="true">
		<div className="prs-pp__gallery">
			<div className="prs-pp__track">
				<span className="prs-pp__shot" />
			</div>
		</div>
		<div className="prs-pp__body">
			<span className="prs-line" />
			<span className="prs-line prs-line--short" />
		</div>
	</div>
);

/**
 * Every product the reel tags, to pick one.
 *
 * @param {Object}   props        Props.
 * @param {Array}    props.items  { link, product } for each tagged product.
 * @param {Function} props.onPick (id) => void.
 * @return {Object} The list.
 */
const List = ( { items, onPick } ) => (
	<div className="prs-pp__scroll prs-pp__scroll--list">
		<h2 className="prs-pp__heading pr-t-title">
			{ __( 'Shop this reel', 'productreels' ) }
		</h2>
		<ul className="prs-pp__list">
			{ items.map( ( { link, product } ) => (
				<li key={ link.btn_uuid }>
					<button
						type="button"
						className="prs-pp__row"
						data-product={ Number( link.product_id ) }
						disabled={ ! product }
						onClick={ () => onPick( Number( link.product_id ) ) }
					>
						<span className="prs-pp__thumb">
							{ product && product.image && (
								<img
									src={ product.image }
									alt=""
									decoding="async"
								/>
							) }
						</span>
						<span className="prs-pp__rowtext">
							{ product ? (
								<>
									<span className="prs-pp__rowname pr-t-body-strong">
										{ product.name }
									</span>
									<Price html={ product.price_html } />
								</>
							) : (
								<>
									<span className="prs-line" />
									<span className="prs-line prs-line--short" />
								</>
							) }
						</span>
						<ReelIcon name="chevron-right" size={ 18 } />
					</button>
				</li>
			) ) }
		</ul>
	</div>
);

/**
 * @param {Object}      props          Props.
 * @param {Array}       props.items    { link, product } for each product the reel tags.
 * @param {number|null} props.picked   The product being shown, or null for the
 *                                     list (a reel with one product shows it).
 * @param {Function}    props.onPick   (id|null) => void — show a product, or the list.
 * @param {Function}    props.onClose  Hide the panel.
 * @param {boolean}     props.sheet    A phone's sheet rather than the docked panel.
 * @param {Object}      props.styles   The widget's styles.
 * @param {Object}      props.services The services.
 * @param {Function}    props.onTrack  (link) => void — a click on a product.
 * @param {Function}    props.onToast  (tone, message) => void.
 * @return {Object} The panel.
 */
export const ProductPanel = ( {
	items,
	picked,
	onPick,
	onClose,
	sheet = false,
	styles,
	services,
	onTrack,
	onToast,
} ) => {
	const root = useRef( null );
	const many = items.length > 1;
	let item = null;

	if ( picked !== null && picked !== undefined ) {
		item =
			items.find(
				( entry ) => Number( entry.link.product_id ) === picked
			) || null;
	} else if ( ! many ) {
		item = items[ 0 ] || null;
	}

	// A sheet takes focus when it rises and hands it back when it goes.
	useEffect( () => {
		const node = root.current;

		if ( ! sheet || ! node ) {
			return undefined;
		}

		const before = node.ownerDocument.activeElement;
		const first = node.querySelector( 'button, a[href]' );

		if ( first ) {
			first.focus();
		}

		return () => {
			if (
				before &&
				before.isConnected &&
				typeof before.focus === 'function'
			) {
				before.focus();
			}
		};
	}, [ sheet ] );

	// Between the list and a product the pressed control goes away, so focus
	// follows: to the back arrow on the way in, to the product's row on the
	// way out. Only when it was in the panel, not on a step of the reel.
	const shown = useRef( picked );

	useEffect( () => {
		const node = root.current;
		const from = shown.current;

		shown.current = picked;

		if ( ! node || from === picked ) {
			return;
		}

		const active = node.ownerDocument.activeElement;

		if (
			active &&
			active !== node.ownerDocument.body &&
			! node.contains( active )
		) {
			return;
		}

		const target =
			picked !== null && picked !== undefined
				? node.querySelector( '.prs-pp__bar button' )
				: node.querySelector( `[data-product="${ Number( from ) }"]` );

		if ( target ) {
			target.focus();
		}
	}, [ picked ] );

	// Escape lowers a sheet before it would close the player.
	useEffect( () => {
		if ( ! sheet ) {
			return undefined;
		}

		const onKeyDown = ( event ) => {
			if ( event.key === 'Escape' ) {
				event.preventDefault();
				event.stopPropagation();
				onClose();
			}
		};

		document.addEventListener( 'keydown', onKeyDown, true );

		return () => document.removeEventListener( 'keydown', onKeyDown, true );
	}, [ sheet, onClose ] );

	// The arrows scroll the panel and move between its pills; they do not
	// step the reel behind it.
	const onKeyDown = ( event ) => {
		if ( ARROWS.includes( event.key ) ) {
			event.stopPropagation();
		}
	};

	let body;

	if ( item && item.product ) {
		body = (
			<Detail
				key={ item.link.btn_uuid }
				link={ item.link }
				base={ item.product }
				styles={ styles }
				services={ services }
				onTrack={ onTrack }
				onToast={ onToast }
			/>
		);
	} else if ( item ) {
		body = <Skeleton />;
	} else {
		body = <List items={ items } onPick={ onPick } />;
	}

	return (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		<section
			ref={ root }
			className={ `prs-pp ${ sheet ? 'prs-pp--sheet' : 'prs-pp--dock' }` }
			aria-label={ __( 'Product details', 'productreels' ) }
			data-wr-no-swipe=""
			onKeyDown={ onKeyDown }
		>
			<div className="prs-pp__bar">
				{ many && item && (
					<button
						type="button"
						className="prs-pp__round"
						aria-label={ __( 'Back to products', 'productreels' ) }
						onClick={ () => onPick( null ) }
					>
						<ReelIcon
							name="arrow-left"
							size={ 20 }
							strokeWidth={ 2.25 }
						/>
					</button>
				) }
				<button
					type="button"
					className="prs-pp__round prs-pp__x"
					aria-label={
						sheet
							? __( 'Close product details', 'productreels' )
							: __( 'Hide product details', 'productreels' )
					}
					onClick={ onClose }
				>
					<ReelIcon name="x" size={ 20 } strokeWidth={ 2.25 } />
				</button>
			</div>

			{ body }
		</section>
	);
};
