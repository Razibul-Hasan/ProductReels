/**
 * The wooreels/reels block editor script.
 *
 * A dynamic block: it saves nothing but a widget id and PHP prints the
 * mount node. In the editor it shows which widget is chosen and a strip of
 * its reels, so a page full of blocks stays readable without rendering five
 * video players inside the canvas.
 */

import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import {
	ComboboxControl,
	ExternalLink,
	Notice,
	PanelBody,
	Placeholder,
	Spinner,
} from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import metadata from '../block.json';
import { WooReelsIcon } from './icon';
import './editor.scss';

const config = window.wooreelsBlock || {};

const posterOf = ( reel ) =>
	reel.thumbnail ||
	( reel.files && reel.files[ 0 ] && reel.files[ 0 ].poster_url ) ||
	'';

/** Every widget on the site, once per editor session. */
let widgetsPromise = null;

const loadWidgets = () => {
	if ( ! widgetsPromise ) {
		widgetsPromise = apiFetch( {
			path: '/wooreels/v1/widgets?per_page=100&orderby=name&order=ASC',
		} ).catch( () => {
			widgetsPromise = null;

			return [];
		} );
	}

	return widgetsPromise;
};

const Edit = ( { attributes, setAttributes } ) => {
	const { widgetId } = attributes;
	const blockProps = useBlockProps( { className: 'wr-block' } );

	const [ widgets, setWidgets ] = useState( null );
	const [ widget, setWidget ] = useState( null );
	const [ missing, setMissing ] = useState( false );

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
		if ( ! widgetId ) {
			setWidget( null );
			setMissing( false );

			return undefined;
		}

		let cancelled = false;

		setWidget( null );

		apiFetch( { path: `/wooreels/v1/widgets/${ Number( widgetId ) }` } )
			.then( ( full ) => {
				if ( ! cancelled ) {
					setWidget( full );
					setMissing( false );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setMissing( true );
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
					__( '%1$s (%2$s)', 'wooreels' ),
					entry.name,
					sprintf(
						/* translators: %d: number of reels. */
						_n(
							'%d reel',
							'%d reels',
							entry.reel_count,
							'wooreels'
						),
						entry.reel_count
					)
				),
			} ) ),
		[ widgets ]
	);

	const picker = (
		<ComboboxControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Widget', 'wooreels' ) }
			value={ widgetId || null }
			options={ options }
			onChange={ ( value ) =>
				setAttributes( { widgetId: value ? String( value ) : '' } )
			}
			placeholder={
				widgets === null
					? __( 'Loading…', 'wooreels' )
					: __( 'Search widgets…', 'wooreels' )
			}
		/>
	);

	const editLink = widgetId
		? `${ config.adminUrl }#/widgets/${ Number( widgetId ) }`
		: config.adminUrl;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'WooReels', 'wooreels' ) }>
					{ picker }
					<p className="wr-block__open">
						<ExternalLink href={ editLink }>
							{ widgetId
								? __( 'Open in WooReels', 'wooreels' )
								: __( 'Create Widget', 'wooreels' ) }
						</ExternalLink>
					</p>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ ! widgetId && (
					<Placeholder
						icon={ <WooReelsIcon /> }
						label={ __( 'WooReels', 'wooreels' ) }
						instructions={ __(
							'Choose which widget to show here.',
							'wooreels'
						) }
					>
						<div className="wr-block__picker">
							{ widgets !== null && widgets.length === 0 ? (
								<Notice status="info" isDismissible={ false }>
									{ __(
										"You haven't created any widget yet!",
										'wooreels'
									) }{ ' ' }
									<ExternalLink href={ config.adminUrl }>
										{ __( 'Create Widget', 'wooreels' ) }
									</ExternalLink>
								</Notice>
							) : (
								picker
							) }
						</div>
					</Placeholder>
				) }

				{ widgetId && missing && (
					<Notice status="warning" isDismissible={ false }>
						{ sprintf(
							/* translators: %d: widget id. */
							__(
								'Widget #%d no longer exists. Choose another one.',
								'wooreels'
							),
							Number( widgetId )
						) }
					</Notice>
				) }

				{ widgetId && ! missing && ! widget && (
					<div className="wr-block__loading">
						<Spinner />
					</div>
				) }

				{ widget && (
					<div className="wr-block__card">
						<div className="wr-block__head">
							<span className="wr-block__icon">
								<WooReelsIcon />
							</span>
							<span className="wr-block__titles">
								<strong className="wr-block__name">
									{ widget.name }
								</strong>
								<span className="wr-block__meta">
									{ sprintf(
										/* translators: 1: number of reels (already pluralised), 2: template name. */
										__( '%1$s · %2$s', 'wooreels' ),
										sprintf(
											/* translators: %d: number of reels. */
											_n(
												'%d reel',
												'%d reels',
												widget.reels.length,
												'wooreels'
											),
											widget.reels.length
										),
										widget.styles.template
									) }
								</span>
							</span>
							<ExternalLink
								className="wr-block__edit"
								href={ editLink }
							>
								{ __( 'Edit', 'wooreels' ) }
							</ExternalLink>
						</div>

						{ widget.reels.length > 0 ? (
							<div
								className={ `wr-block__strip wr-block__strip--${ widget.styles.shape }` }
							>
								{ widget.reels.slice( 0, 8 ).map( ( reel ) => {
									const poster = posterOf( reel );

									return (
										<span
											key={ reel.id }
											className="wr-block__frame"
											title={ reel.title }
										>
											{ poster ? (
												<img
													src={ poster }
													alt=""
													loading="lazy"
												/>
											) : (
												<span className="wr-block__frame-blank" />
											) }
										</span>
									);
								} ) }
								{ widget.reels.length > 8 && (
									<span className="wr-block__more">
										+{ widget.reels.length - 8 }
									</span>
								) }
							</div>
						) : (
							<p className="wr-block__empty">
								{ __(
									'No reels have been added to this widget yet.',
									'wooreels'
								) }
							</p>
						) }
					</div>
				) }
			</div>
		</>
	);
};

registerBlockType( metadata.name, {
	icon: WooReelsIcon,
	edit: Edit,
	save: () => null,
} );
