/**
 * ReelCard: one reel in the library grid.
 *
 * The cover (never a playing video), its views and where the video comes
 * from; under it the title, what it sells and how many widgets use it. The
 * title opens the reel, the play button previews it, `more` holds Preview,
 * Edit and Delete. The checkbox shows on hover, on keyboard focus, and on
 * every card once anything is selected.
 *
 * Shared helpers describe a reel the same way in the grid and the list.
 */

import { useRef } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { formatNumber } from '../../format';
import { Checkbox } from './Fields';
import { Menu } from './Menu';

/** Where a reel's first video comes from; uploads carry no badge. */
export const REEL_SOURCES = {
	youtube: { icon: 'youtube', label: __( 'YouTube Shorts', 'productreels' ) },
	vimeo: { icon: 'video', label: __( 'Vimeo', 'productreels' ) },
	hosted: { icon: 'link', label: __( 'Video link', 'productreels' ) },
};

/**
 * Tagged products and custom buttons on a reel.
 *
 * @param {Object} reel A reel from GET /reels.
 * @return {{products: number, buttons: number}} The counts.
 */
export const reelLinkCounts = ( reel ) => {
	const links = Array.isArray( reel.links ) ? reel.links : [];

	return {
		products: links.filter( ( link ) => link.btn_type === 'product' )
			.length,
		buttons: links.filter( ( link ) => link.btn_type === 'custom' ).length,
	};
};

export const productsLabel = ( count ) =>
	sprintf(
		/* translators: %s: number of tagged products. */
		_n( '%s product', '%s products', count, 'productreels' ),
		formatNumber( count )
	);

export const buttonsLabel = ( count ) =>
	sprintf(
		/* translators: %s: number of custom buttons. */
		_n( '%s button', '%s buttons', count, 'productreels' ),
		formatNumber( count )
	);

export const widgetsLabel = ( count ) =>
	count > 0
		? sprintf(
				/* translators: %s: number of widgets the reel is in. */
				_n( 'In %s widget', 'In %s widgets', count, 'productreels' ),
				formatNumber( count )
			)
		: __( 'Not in a widget', 'productreels' );

/**
 * The reel's cover: its own image, its first file's poster, or the first
 * frame of a self-hosted video (paused, metadata only). Nothing when there is
 * none of those; the frame behind it is --pr-surface-sunken.
 *
 * @param {Object} props      Props.
 * @param {Object} props.reel A reel from GET /reels.
 */
export const ReelCover = ( { reel } ) => {
	const poster = reel.thumbnail || reel.file?.poster_url || '';

	if ( poster ) {
		return <img src={ poster } alt="" loading="lazy" decoding="async" />;
	}

	const file = reel.file;

	if (
		file?.url &&
		( file.source === 'native' || file.source === 'hosted' )
	) {
		return (
			<video
				src={ `${ file.url }#t=0.1` }
				preload="metadata"
				muted
				playsInline
				tabIndex={ -1 }
				aria-hidden="true"
			/>
		);
	}

	return null;
};

/**
 * The `more` menu's items for a reel, shared by the grid and the list.
 *
 * @param {Object}   handlers           Handlers.
 * @param {Function} handlers.onPreview Preview in the player.
 * @param {Function} handlers.onOpen    Open in the reel editor.
 * @param {Function} handlers.onDelete  Ask to delete.
 * @return {Array} Menu items.
 */
export const reelMenuItems = ( { onPreview, onOpen, onDelete } ) => [
	{
		icon: 'play',
		label: __( 'Preview', 'productreels' ),
		onSelect: onPreview,
	},
	{ icon: 'pencil', label: __( 'Edit', 'productreels' ), onSelect: onOpen },
	'-',
	{
		icon: 'trash',
		label: __( 'Delete reel', 'productreels' ),
		danger: true,
		onSelect: onDelete,
	},
];

/**
 * @param {Object}   props           Props.
 * @param {Object}   props.reel      A reel from GET /reels (with widget_count).
 * @param {boolean}  props.selected  Whether it is in the bulk selection.
 * @param {Function} props.onSelect  Called with the new checked state.
 * @param {Function} props.onOpen    Open in the reel editor.
 * @param {Function} props.onPreview Preview; gets the element to return focus to.
 * @param {Function} props.onDelete  Ask to delete.
 * @return {Object} The card.
 */
export const ReelCard = ( {
	reel,
	selected = false,
	onSelect,
	onOpen,
	onPreview,
	onDelete,
} ) => {
	const source = REEL_SOURCES[ reel.file?.source ];
	const { products, buttons } = reelLinkCounts( reel );
	const more = useRef( null );

	return (
		<article
			className="pr-reelcard"
			data-selected={ selected ? 'true' : 'false' }
		>
			<div className="pr-reelcard__media">
				<ReelCover reel={ reel } />
				<span className="pr-reelcard__check">
					<Checkbox
						checked={ selected }
						onChange={ onSelect }
						aria-label={ sprintf(
							/* translators: %s: reel title. */
							__( 'Select %s', 'productreels' ),
							reel.title
						) }
					/>
				</span>
				{ source && (
					<span
						className="pr-reelcard__source pr-pill-over pr-t-caption"
						title={ source.label }
					>
						<Icon name={ source.icon } size={ 13 } />
						<span className="pr-sr">{ source.label }</span>
					</span>
				) }
				<span className="pr-reelcard__views pr-pill-over pr-t-caption">
					<Icon name="eye" size={ 13 } />
					<span className="pr-sr">
						{ __( 'Views:', 'productreels' ) }
					</span>
					{ formatNumber( reel.view_count ) }
				</span>
				<button
					type="button"
					className="pr-reelcard__play"
					aria-label={ sprintf(
						/* translators: %s: reel title. */
						__( 'Preview %s', 'productreels' ),
						reel.title
					) }
					onClick={ ( event ) => onPreview( event.currentTarget ) }
				>
					<Icon name="play" size={ 20 } fill="currentColor" />
				</button>
			</div>
			<div className="pr-reelcard__row">
				<button
					type="button"
					className="pr-reelcard__open pr-reelcard__text"
					aria-label={ sprintf(
						/* translators: %s: the name of a reel, widget or button. */
						__( 'Edit %s', 'productreels' ),
						reel.title
					) }
					onClick={ onOpen }
				>
					<span
						className="pr-reelcard__title pr-t-body-strong"
						title={ reel.title }
					>
						{ reel.title }
					</span>
					<span className="pr-reelcard__meta pr-t-small">
						{ products > 0 && (
							<span>
								<Icon name="tag" size={ 13 } />
								{ productsLabel( products ) }
							</span>
						) }
						{ buttons > 0 && (
							<span>
								<Icon name="link" size={ 13 } />
								{ buttonsLabel( buttons ) }
							</span>
						) }
						<span>{ widgetsLabel( reel.widget_count || 0 ) }</span>
					</span>
				</button>
				<div className="pr-reelcard__actions" ref={ more }>
					<Menu
						label={ sprintf(
							/* translators: %s: a reel title or widget name. */
							__( 'More actions for %s', 'productreels' ),
							reel.title
						) }
						items={ reelMenuItems( {
							onPreview: () =>
								onPreview(
									more.current?.querySelector( 'button' )
								),
							onOpen,
							onDelete,
						} ) }
					/>
				</div>
			</div>
		</article>
	);
};
