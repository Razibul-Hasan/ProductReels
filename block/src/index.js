/**
 * The productreels/reels block editor script.
 *
 * A dynamic block: it saves nothing but a widget id (`save` is null) and PHP
 * prints the mount node, so the saved markup of every 1.0.0 block is still
 * valid. In the editor it follows the editor's own conventions: core
 * Placeholder with a searchable picker until a widget is chosen, then the
 * live widget, drawn by the same renderer and stylesheet as the storefront,
 * with the picker and the links in the sidebar.
 */

import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import {
	ComboboxControl,
	Disabled,
	ExternalLink,
	Flex,
	Notice,
	PanelBody,
	Placeholder,
	Spinner,
} from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { WidgetRenderer } from '@shared/WidgetRenderer';
import metadata from '../block.json';
import { ProductReelsIcon } from './icon';
import './editor.scss';

const config = window.productreelsBlock || {};

/* Products for the preview's cards: the same batch route the storefront
   reads, with the editor's REST nonce. Nothing is tracked in the editor. */
const services = {
	hasWoo: !! config.hasWoo,
	getProducts: ( ids ) =>
		apiFetch( {
			path: `/productreels/v1/products/batch?${ ids
				.map( ( id ) => `ids[]=${ encodeURIComponent( id ) }` )
				.join( '&' ) }`,
		} ),
};

/** Every widget on the site, once per editor session. */
let widgetsPromise = null;

const loadWidgets = () => {
	if ( ! widgetsPromise ) {
		widgetsPromise = apiFetch( {
			path: '/productreels/v1/widgets?per_page=100&orderby=name&order=ASC',
		} ).catch( () => {
			widgetsPromise = null;

			return [];
		} );
	}

	return widgetsPromise;
};

/* Links into the admin, for people who can open it. */
const adminLink = ( hash = '' ) => `${ config.adminUrl }${ hash }`;

const Links = ( { widgetId } ) => {
	if ( ! config.canManage ) {
		return null;
	}

	return (
		<Flex justify="flex-start" wrap gap={ 4 }>
			{ widgetId ? (
				<ExternalLink
					href={ adminLink( `#/widgets/${ Number( widgetId ) }` ) }
				>
					{ __( 'Edit widget', 'productreels' ) }
				</ExternalLink>
			) : (
				<ExternalLink href={ adminLink( '#/widgets/new' ) }>
					{ __( 'Create widget', 'productreels' ) }
				</ExternalLink>
			) }
			<ExternalLink href={ adminLink() }>
				{ __( 'Open ProductReels', 'productreels' ) }
			</ExternalLink>
		</Flex>
	);
};

const Edit = ( { attributes, setAttributes } ) => {
	const { widgetId } = attributes;
	const blockProps = useBlockProps( { className: 'prs-block' } );

	const [ widgets, setWidgets ] = useState( null );
	const [ widget, setWidget ] = useState( null );
	// 'deleted' when the chosen widget is gone, 'failed' for any other error.
	const [ problem, setProblem ] = useState( '' );

	useEffect( () => {
		let cancelled = false;

		loadWidgets().then( ( list ) => {
			if ( ! cancelled ) {
				setWidgets( list );
			}
		} );

		return () => {
			cancelled = true;
		};
	}, [] );

	useEffect( () => {
		setWidget( null );
		setProblem( '' );

		if ( ! widgetId ) {
			return undefined;
		}

		let cancelled = false;

		apiFetch( { path: `/productreels/v1/widgets/${ Number( widgetId ) }` } )
			.then( ( full ) => {
				if ( ! cancelled ) {
					setWidget( full );
				}
			} )
			.catch( ( error ) => {
				if ( ! cancelled ) {
					setProblem(
						error && error.data && error.data.status === 404
							? 'deleted'
							: 'failed'
					);
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ widgetId ] );

	const options = useMemo(
		() =>
			( widgets || [] ).map( ( entry ) => ( {
				value: String( entry.id ),
				label: sprintf(
					/* translators: 1: widget name, 2: reel count. */
					__( '%1$s (%2$s)', 'productreels' ),
					entry.name,
					sprintf(
						/* translators: %d: number of reels. */
						_n(
							'%d reel',
							'%d reels',
							entry.reel_count,
							'productreels'
						),
						entry.reel_count
					)
				),
			} ) ),
		[ widgets ]
	);

	const noWidgets = widgets !== null && widgets.length === 0;

	const picker = noWidgets ? (
		<Notice status="info" isDismissible={ false }>
			{ __( 'You haven’t created a widget yet.', 'productreels' ) }
		</Notice>
	) : (
		<ComboboxControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Widget', 'productreels' ) }
			value={ widgetId || null }
			options={ options }
			onChange={ ( value ) =>
				setAttributes( { widgetId: value ? String( value ) : '' } )
			}
			placeholder={
				widgets === null
					? __( 'Loading…', 'productreels' )
					: __( 'Search widgets', 'productreels' )
			}
		/>
	);

	let body;

	if ( ! widgetId || problem ) {
		body = (
			<Placeholder
				icon={ <ProductReelsIcon /> }
				label={ __( 'ProductReels', 'productreels' ) }
				instructions={
					problem
						? undefined
						: __(
								'Choose which widget shows here.',
								'productreels'
							)
				}
			>
				<Flex
					className="prs-block__picker"
					direction="column"
					align="stretch"
					gap={ 3 }
				>
					{ problem && (
						<Notice status="error" isDismissible={ false }>
							{ problem === 'deleted'
								? __(
										'This widget was deleted. Choose another or create one.',
										'productreels'
									)
								: __(
										'This widget couldn’t be loaded. Choose it again or try later.',
										'productreels'
									) }
						</Notice>
					) }
					{ picker }
					<Links />
				</Flex>
			</Placeholder>
		);
	} else if ( ! widget ) {
		body = (
			<div className="prs-block__loading">
				<Spinner />
			</div>
		);
	} else if ( ! widget.reels || widget.reels.length === 0 ) {
		body = (
			<Placeholder
				icon={ <ProductReelsIcon /> }
				label={ widget.name }
				instructions={ __(
					'No reels have been added to this widget yet.',
					'productreels'
				) }
			>
				<Links widgetId={ widgetId } />
			</Placeholder>
		);
	} else {
		// The live widget, as visitors will see it. Disabled: in the canvas a
		// click selects the block; it does not open the player.
		body = (
			<Disabled>
				<WidgetRenderer
					widget={ widget }
					styles={ widget.styles }
					services={ services }
					inEditor
				/>
			</Disabled>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'ProductReels', 'productreels' ) }>
					<Flex direction="column" align="stretch" gap={ 3 }>
						{ picker }
						<Links widgetId={ widget ? widgetId : '' } />
					</Flex>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>{ body }</div>
		</>
	);
};

registerBlockType( metadata.name, {
	icon: ProductReelsIcon,
	edit: Edit,
	save: () => null,
} );
