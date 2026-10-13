/**
 * ProductPicker: find store products and tick the ones a reel sells.
 *
 * Searches by name or SKU (the REST search covers both) as you type, thirty
 * at a time with Load more. Every row is a real checkbox, so Tab and Space
 * work the way they do in any form. Out-of-stock products can still be
 * tagged; their badge says why a shopper may not be able to buy.
 *
 * Without WooCommerce there is nothing to tag, and the picker says so with
 * the way out: turn it on, or add a button instead.
 */

import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { products as productsApi } from '../../api';
import { formatNumber } from '../../format';
import { useDebounced } from '../../hooks/use-debounced';
import { Badge } from './Badge';
import { Button } from './Button';
import { Skeleton } from './Data';
import { Checkbox, SearchField } from './Fields';
import { Notice } from './Notice';

const PAGE = 30;

export const ProductPicker = ( {
	chosen,
	onToggle,
	wooActive,
	pluginsUrl,
} ) => {
	const [ search, setSearch ] = useState( '' );
	const [ items, setItems ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ page, setPage ] = useState( 1 );
	const [ state, setState ] = useState( 'loading' );
	const [ attempt, setAttempt ] = useState( 0 );
	const term = useDebounced( search.trim(), 300 );

	useEffect( () => {
		setPage( 1 );
	}, [ term ] );

	useEffect( () => {
		if ( ! wooActive ) {
			return undefined;
		}

		let cancelled = false;

		setState( page === 1 ? 'loading' : 'more' );

		productsApi
			.search( { search: term, per_page: PAGE, page } )
			.then( ( result ) => {
				if ( cancelled ) {
					return;
				}

				setItems( ( current ) =>
					page === 1 ? result.items : [ ...current, ...result.items ]
				);
				setTotal( result.total );
				setState( 'ready' );
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setState( 'error' );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ term, page, attempt, wooActive ] );

	if ( ! wooActive ) {
		return (
			<Notice
				tone="warn"
				title={ __( 'WooCommerce is turned off', 'productreels' ) }
				actions={
					pluginsUrl ? (
						<a
							className="pr-btn pr-btn--secondary pr-btn--sm pr-t-body-strong"
							href={ pluginsUrl }
						>
							<span>
								{ __( 'Open Plugins', 'productreels' ) }
							</span>
						</a>
					) : null
				}
			>
				{ __(
					'Product tags need WooCommerce. Turn it on to tag products, or add a button with any link instead.',
					'productreels'
				) }
			</Notice>
		);
	}

	let list = null;

	if ( state === 'loading' ) {
		list = (
			<Skeleton
				count={ 4 }
				label={ __( 'Loading products…', 'productreels' ) }
			/>
		);
	} else if ( state === 'error' ) {
		list = (
			<Notice
				tone="danger"
				title={ __( "Products couldn't be loaded", 'productreels' ) }
				actions={
					<Button
						size="sm"
						onClick={ () => setAttempt( attempt + 1 ) }
					>
						{ __( 'Try again', 'productreels' ) }
					</Button>
				}
			>
				{ __(
					'Check your connection, then try again.',
					'productreels'
				) }
			</Notice>
		);
	} else if ( items.length === 0 ) {
		list = (
			<p className="pr-plist__empty pr-t-body pr-muted" role="status">
				{ term
					? sprintf(
							/* translators: %s: what was searched for. */
							__(
								'No products match “%s”. Try part of the name, or the SKU.',
								'productreels'
							),
							term
						)
					: __(
							'Your store has no published products yet.',
							'productreels'
						) }
			</p>
		);
	} else {
		list = (
			<div
				className="pr-plist"
				role="group"
				aria-label={ __( 'Products', 'productreels' ) }
			>
				{ items.map( ( product ) => {
					const on = chosen.has( product.id );

					return (
						<label
							className="pr-prow"
							key={ product.id }
							htmlFor={ `pr-product-${ product.id }` }
							data-checked={ on ? 'true' : 'false' }
						>
							<Checkbox
								id={ `pr-product-${ product.id }` }
								checked={ on }
								aria-label={ product.name }
								onChange={ () => onToggle( product ) }
							/>
							<span className="pr-prow__thumb">
								{ product.image && (
									<img
										src={ product.image }
										alt=""
										loading="lazy"
									/>
								) }
							</span>
							<span className="pr-prow__text">
								<span className="pr-t-body-strong">
									{ product.name }
								</span>
								<span className="pr-prow__meta pr-t-small">
									<span
										className="pr-price"
										/* price_html is WooCommerce's own formatted markup. */
										dangerouslySetInnerHTML={ {
											__html: product.price_html,
										} }
									/>
									{ product.sku && (
										<>
											{ ' ' }
											<span aria-hidden="true">
												/
											</span>{ ' ' }
											{ sprintf(
												/* translators: %s: product SKU. */
												__( 'SKU %s', 'productreels' ),
												product.sku
											) }
										</>
									) }
								</span>
							</span>
							{ ! product.in_stock && (
								<Badge tone="warn" icon="alert">
									{ __( 'Out of stock', 'productreels' ) }
								</Badge>
							) }
						</label>
					);
				} ) }
			</div>
		);
	}

	return (
		<div className="pr-stackv pr-picker">
			<SearchField
				placeholder={ __(
					'Search products by name or SKU',
					'productreels'
				) }
				value={ search }
				onChange={ ( event ) => setSearch( event.target.value ) }
			/>
			{ list }
			{ ( state === 'ready' || state === 'more' ) &&
				items.length < total && (
					<div className="pr-rowh pr-picker__more">
						<Button
							size="sm"
							busy={ state === 'more' }
							onClick={ () => setPage( page + 1 ) }
						>
							{ __( 'Load more', 'productreels' ) }
						</Button>
						<span className="pr-t-small pr-muted">
							{ sprintf(
								/* translators: 1: how many are shown, 2: how many there are in all. */
								__( 'Showing %1$s of %2$s', 'productreels' ),
								formatNumber( items.length ),
								formatNumber( total )
							) }
						</span>
					</div>
				) }
		</div>
	);
};
