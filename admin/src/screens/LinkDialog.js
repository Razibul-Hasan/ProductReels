/**
 * The add-link dialog: a custom button on one tab, WooCommerce products on the
 * other.
 *
 * btn_uuid is minted here, once, and never changes again. It is the key every
 * click is counted against, so regenerating it would silently reset a button's
 * statistics — editing a button's label keeps its history.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { boot, products as productsApi } from '../api';
import { IconTag } from '../components/icons';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Choice';
import { EmptyState, Notice, Skeleton } from '../components/ui/Feedback';
import {
	Checkbox,
	SearchInput,
	Switch,
	TextField,
} from '../components/ui/Fields';
import { Modal } from '../components/ui/Modal';
import { useDebounced } from '../hooks/use-debounced';

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

const isValidUrl = ( value ) => {
	try {
		const parsed = new URL( value );

		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch ( error ) {
		return false;
	}
};

const CustomTab = ( { draft, setDraft, errors } ) => (
	<div className="wr-form">
		<TextField
			label={ __(
				'Button Text',
				'productreels-shoppable-video-reels-for-woocommerce'
			) }
			placeholder={ __(
				'e.g Buy Now',
				'productreels-shoppable-video-reels-for-woocommerce'
			) }
			value={ draft.buttonText }
			error={ errors.buttonText }
			onChange={ ( value ) =>
				setDraft( { ...draft, buttonText: value } )
			}
		/>
		<TextField
			label={ __(
				'Url',
				'productreels-shoppable-video-reels-for-woocommerce'
			) }
			type="url"
			placeholder={ __(
				'e.g https://example.com',
				'productreels-shoppable-video-reels-for-woocommerce'
			) }
			value={ draft.buttonUrl }
			error={ errors.buttonUrl }
			onChange={ ( value ) => setDraft( { ...draft, buttonUrl: value } ) }
		/>
		<TextField
			label={ __(
				'Campaign Name',
				'productreels-shoppable-video-reels-for-woocommerce'
			) }
			placeholder={ __(
				'e.g Summer sale',
				'productreels-shoppable-video-reels-for-woocommerce'
			) }
			help={ __(
				'Groups this button in your statistics so you can tell campaigns apart.',
				'productreels-shoppable-video-reels-for-woocommerce'
			) }
			value={ draft.campaignName }
			error={ errors.campaignName }
			onChange={ ( value ) =>
				setDraft( { ...draft, campaignName: value } )
			}
		/>
		<Switch
			label={ __(
				'Open in new tab',
				'productreels-shoppable-video-reels-for-woocommerce'
			) }
			checked={ draft.openInNewTab }
			onChange={ ( value ) =>
				setDraft( { ...draft, openInNewTab: value } )
			}
		/>
		<TextField
			label={ __(
				'Custom class',
				'productreels-shoppable-video-reels-for-woocommerce'
			) }
			value={ draft.customClass }
			onChange={ ( value ) =>
				setDraft( { ...draft, customClass: value } )
			}
		/>
	</div>
);

const ProductsTab = ( { chosen, setChosen } ) => {
	const [ search, setSearch ] = useState( '' );
	const [ items, setItems ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const term = useDebounced( search, 350 );

	useEffect( () => {
		let cancelled = false;

		if ( ! boot.hasWoo ) {
			setLoading( false );

			return undefined;
		}

		setLoading( true );

		productsApi
			.search( { search: term, per_page: 30 } )
			.then( ( page ) => {
				if ( ! cancelled ) {
					setItems( page.items );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setItems( [] );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ term ] );

	if ( ! boot.hasWoo ) {
		return (
			<Notice tone="info">
				{ __(
					'Product tagging needs WooCommerce. Activate WooCommerce and this tab will list your products — every other part of ProductReels works without it.',
					'productreels-shoppable-video-reels-for-woocommerce'
				) }
			</Notice>
		);
	}

	const toggle = ( product ) =>
		setChosen( ( current ) =>
			current.some( ( entry ) => entry.id === product.id )
				? current.filter( ( entry ) => entry.id !== product.id )
				: [ ...current, product ]
		);

	return (
		<div className="wr-form">
			<SearchInput
				value={ search }
				onChange={ setSearch }
				placeholder={ __(
					'Search products…',
					'productreels-shoppable-video-reels-for-woocommerce'
				) }
			/>

			{ loading && (
				<div className="wr-product-list">
					{ [ 0, 1, 2, 3 ].map( ( row ) => (
						<div key={ row } className="wr-product-row">
							<Skeleton width={ 40 } height={ 40 } radius="6px" />
							<Skeleton width="50%" height={ 13 } />
						</div>
					) ) }
				</div>
			) }

			{ ! loading && items.length === 0 && (
				<EmptyState
					title={ __(
						'No products are available to add.',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
				/>
			) }

			{ ! loading && items.length > 0 && (
				<div
					className="wr-product-list"
					role="group"
					aria-label={ __(
						'Select Products',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
				>
					{ items.map( ( product ) => {
						const picked = chosen.some(
							( entry ) => entry.id === product.id
						);

						return (
							<button
								type="button"
								key={ product.id }
								className={ `wr-product-row${
									picked ? ' is-picked' : ''
								}` }
								aria-pressed={ picked ? 'true' : 'false' }
								onClick={ () => toggle( product ) }
							>
								<Checkbox
									checked={ picked }
									onChange={ () => toggle( product ) }
									label={ product.name }
								/>
								{ product.image ? (
									<img
										className="wr-product-row__img"
										src={ product.image }
										alt=""
										loading="lazy"
									/>
								) : (
									<span className="wr-product-row__img wr-product-row__img--empty">
										<IconTag size={ 16 } />
									</span>
								) }
								<span className="wr-product-row__text">
									<span className="wr-product-row__name">
										{ product.name }
									</span>
									<span
										className="wr-product-row__price"
										/* price_html is WooCommerce's own formatted markup. */
										dangerouslySetInnerHTML={ {
											__html: product.price_html,
										} }
									/>
								</span>
								{ ! product.in_stock && (
									<span className="wr-product-row__stock">
										{ __(
											'Out of stock',
											'productreels-shoppable-video-reels-for-woocommerce'
										) }
									</span>
								) }
							</button>
						);
					} ) }
				</div>
			) }
		</div>
	);
};

export const LinkDialog = ( {
	editing,
	onAdd,
	onClose,
	initialTab = 'custom',
} ) => {
	const [ tab, setTab ] = useState( initialTab );
	const [ chosen, setChosen ] = useState( [] );
	const [ errors, setErrors ] = useState( {} );
	const [ draft, setDraft ] = useState( () => ( {
		buttonText: editing?.buttonText || '',
		buttonUrl: editing?.buttonUrl || '',
		campaignName: editing?.campaignName || '',
		openInNewTab: editing ? editing.openInNewTab !== false : true,
		customClass: editing?.customClass || '',
	} ) );

	const tabs = useMemo(
		() => [
			{
				value: 'custom',
				label: __(
					'Add Custom Link',
					'productreels-shoppable-video-reels-for-woocommerce'
				),
			},
			{
				value: 'product',
				label: __(
					'Tag Products',
					'productreels-shoppable-video-reels-for-woocommerce'
				),
			},
		],
		[]
	);

	const submit = () => {
		if ( tab === 'product' && ! editing ) {
			onAdd(
				chosen.map( ( product ) => ( {
					btn_type: 'product',
					btn_uuid: uuid(),
					product_id: product.id,
					buttonText: product.name,
				} ) )
			);

			return;
		}

		const found = {};

		if ( draft.buttonText.trim() === '' ) {
			found.buttonText = __(
				'Button text is required!',
				'productreels-shoppable-video-reels-for-woocommerce'
			);
		}

		if ( ! isValidUrl( draft.buttonUrl.trim() ) ) {
			found.buttonUrl = __(
				'A valid url is required!',
				'productreels-shoppable-video-reels-for-woocommerce'
			);
		}

		if ( draft.campaignName.trim() === '' ) {
			found.campaignName = __(
				'Campaign name is required!',
				'productreels-shoppable-video-reels-for-woocommerce'
			);
		}

		setErrors( found );

		if ( Object.keys( found ).length > 0 ) {
			return;
		}

		onAdd( [
			{
				btn_type: 'custom',
				// An edit keeps the original key so its click history survives.
				btn_uuid: editing?.btn_uuid || uuid(),
				buttonText: draft.buttonText.trim(),
				buttonUrl: draft.buttonUrl.trim(),
				openInNewTab: draft.openInNewTab,
				campaignName: draft.campaignName.trim(),
				customClass: draft.customClass.trim(),
			},
		] );
	};

	let confirmLabel = __(
		'Save',
		'productreels-shoppable-video-reels-for-woocommerce'
	);

	if ( editing ) {
		confirmLabel = __(
			'Update',
			'productreels-shoppable-video-reels-for-woocommerce'
		);
	} else if ( tab === 'product' ) {
		confirmLabel =
			chosen.length > 0
				? sprintf(
						/* translators: %d: number of selected products. */
						__(
							'Select Products (%d)',
							'productreels-shoppable-video-reels-for-woocommerce'
						),
						chosen.length
					)
				: __(
						'Select Products',
						'productreels-shoppable-video-reels-for-woocommerce'
					);
	}

	return (
		<Modal
			title={
				! editing && tab === 'product'
					? __(
							'Tag Products',
							'productreels-shoppable-video-reels-for-woocommerce'
						)
					: __(
							'Add Custom Link',
							'productreels-shoppable-video-reels-for-woocommerce'
						)
			}
			onClose={ onClose }
			footer={
				<>
					<Button variant="ghost" onClick={ onClose }>
						{ __(
							'Cancel',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
					</Button>
					<Button
						variant="primary"
						onClick={ submit }
						disabled={
							tab === 'product' &&
							! editing &&
							chosen.length === 0
						}
					>
						{ confirmLabel }
					</Button>
				</>
			}
		>
			<div className="wr-form">
				{ ! editing && (
					<Tabs
						value={ tab }
						tabs={ tabs }
						onChange={ setTab }
						label={ __(
							'Add Custom Link',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
					/>
				) }

				{ tab === 'custom' || editing ? (
					<CustomTab
						draft={ draft }
						setDraft={ setDraft }
						errors={ errors }
					/>
				) : (
					<ProductsTab chosen={ chosen } setChosen={ setChosen } />
				) }
			</div>
		</Modal>
	);
};
