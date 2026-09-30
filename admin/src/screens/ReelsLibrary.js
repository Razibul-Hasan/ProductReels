/**
 * The reels library.
 *
 * A card grid rather than a table, because a reel is a picture first and a
 * record second. Cards preview on hover — muted, and only the first file, so
 * browsing forty reels does not pull forty videos.
 */

import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Player } from '@shared/player/Player';
import { boot, reels as reelsApi } from '../api';
import {
	IconEdit,
	IconEye,
	IconLink,
	IconPlus,
	IconTag,
	IconTrash,
	IconVideo,
} from '../components/icons';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { Checkbox, SearchInput } from '../components/ui/Fields';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToasts } from '../components/ui/Toasts';
import { useDebounced } from '../hooks/use-debounced';
import { editorServices } from '../preview-services';
import { ReelEditor } from './ReelEditor';

/** How many reels one page of the library holds. */
const PAGE_SIZE = 60;

const formatNumber = ( value ) =>
	new Intl.NumberFormat( document.documentElement.lang || undefined ).format(
		value
	);

const posterOf = ( reel ) => reel.thumbnail || reel.file?.poster_url || '';

const playableOf = ( reel ) => {
	const file = reel.file;

	if ( ! file || ( file.source !== 'native' && file.source !== 'hosted' ) ) {
		return '';
	}

	return file.url;
};

const ReelCard = ( {
	reel,
	selected,
	onSelect,
	onEdit,
	onPreview,
	onDelete,
} ) => {
	const video = useRef( null );
	const poster = posterOf( reel );
	const playable = playableOf( reel );
	const linkCount = Array.isArray( reel.links ) ? reel.links.length : 0;
	const productCount = ( reel.links || [] ).filter(
		( link ) => link.btn_type === 'product'
	).length;

	const play = () => {
		if (
			video.current &&
			! window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
		) {
			video.current.play().catch( () => {} );
		}
	};

	const stop = () => {
		if ( video.current ) {
			video.current.pause();
			video.current.currentTime = 0;
		}
	};

	return (
		<div
			className={ `wr-reel-card${ selected ? ' is-selected' : '' }` }
			onPointerEnter={ play }
			onPointerLeave={ stop }
		>
			<div className="wr-reel-card__frame">
				{ playable && (
					<video
						ref={ video }
						className="wr-reel-card__media"
						src={ playable }
						poster={ poster || undefined }
						muted
						loop
						playsInline
						preload="metadata"
					/>
				) }
				{ ! playable && poster && (
					<img
						className="wr-reel-card__media"
						src={ poster }
						alt=""
						loading="lazy"
						decoding="async"
					/>
				) }
				{ ! playable && ! poster && (
					<span className="wr-reel-card__placeholder">
						<IconVideo size={ 22 } />
					</span>
				) }

				<span className="wr-reel-card__check">
					<Checkbox
						checked={ selected }
						onChange={ onSelect }
						label={ sprintf(
							/* translators: %s: reel title. */ __(
								'Select %s',
								'productreels'
							),
							reel.title
						) }
					/>
				</span>

				{ reel.view_count > 0 && (
					<span className="wr-reel-card__views">
						<IconEye size={ 12 } />
						{ formatNumber( reel.view_count ) }
					</span>
				) }

				<div className="wr-reel-card__hover">
					<IconButton
						icon={ IconEye }
						label={ __(
							'Preview',
							'productreels'
						) }
						onClick={ onPreview }
					/>
					<IconButton
						icon={ IconEdit }
						label={ __(
							'Edit',
							'productreels'
						) }
						onClick={ onEdit }
					/>
					<IconButton
						icon={ IconTrash }
						label={ __(
							'Delete',
							'productreels'
						) }
						tone="danger"
						onClick={ onDelete }
					/>
				</div>
			</div>

			<div className="wr-reel-card__foot">
				<span className="wr-reel-card__title" title={ reel.title }>
					{ reel.title }
				</span>
				{ linkCount > 0 && (
					<span className="wr-reel-card__chip">
						{ productCount > 0 ? (
							<IconTag size={ 12 } />
						) : (
							<IconLink size={ 12 } />
						) }
						{ linkCount }
					</span>
				) }
			</div>
		</div>
	);
};

const SkeletonCards = () => (
	<>
		{ [ 0, 1, 2, 3, 4, 5 ].map( ( card ) => (
			<div key={ card } className="wr-reel-card">
				<div className="wr-reel-card__frame wr-skeleton" />
				<div className="wr-reel-card__foot">
					<Skeleton width="70%" height={ 13 } />
				</div>
			</div>
		) ) }
	</>
);

export const ReelsLibrary = () => {
	const toasts = useToasts();
	const [ search, setSearch ] = useState( '' );
	const [ items, setItems ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( '' );
	const [ selected, setSelected ] = useState( [] );
	const [ editing, setEditing ] = useState( null );
	const [ previewing, setPreviewing ] = useState( null );
	const [ confirming, setConfirming ] = useState( null );
	const [ deleting, setDeleting ] = useState( false );
	const [ page, setPage ] = useState( 1 );
	const [ pages, setPages ] = useState( 1 );
	const [ loadingMore, setLoadingMore ] = useState( false );

	const term = useDebounced( search, 300 );

	const fetchPage = useCallback(
		( number ) =>
			reelsApi.list( {
				search: term,
				page: number,
				per_page: PAGE_SIZE,
				orderby: 'id',
				order: 'DESC',
			} ),
		[ term ]
	);

	/** Start over from the first page: a new search, or after a change. */
	const load = useCallback( async () => {
		setLoading( true );
		setError( '' );

		try {
			const first = await fetchPage( 1 );

			setItems( first.items );
			setTotal( first.total );
			setPage( 1 );
			setPages( first.pages );
			setSelected( ( current ) =>
				current.filter( ( id ) =>
					first.items.some( ( reel ) => reel.id === id )
				)
			);
		} catch ( requestError ) {
			setError( requestError.message );
		} finally {
			setLoading( false );
		}
	}, [ fetchPage ] );

	useEffect( () => {
		load();
	}, [ load ] );

	const loadMore = async () => {
		const next = page + 1;

		setLoadingMore( true );

		try {
			const more = await fetchPage( next );

			setItems( ( current ) => {
				const seen = new Set( current.map( ( reel ) => reel.id ) );

				return current.concat(
					more.items.filter( ( reel ) => ! seen.has( reel.id ) )
				);
			} );
			setPage( next );
			setPages( more.pages );
		} catch ( requestError ) {
			toasts.error( requestError.message );
		} finally {
			setLoadingMore( false );
		}
	};

	const toggle = ( id ) =>
		setSelected( ( current ) =>
			current.includes( id )
				? current.filter( ( entry ) => entry !== id )
				: [ ...current, id ]
		);

	const removeOne = async () => {
		setDeleting( true );

		try {
			await reelsApi.remove( confirming.reel.id );
			toasts.success(
				__(
					'Reel deleted successfully!',
					'productreels'
				)
			);
			setConfirming( null );
			await load();
		} catch ( requestError ) {
			toasts.error( requestError.message );
		} finally {
			setDeleting( false );
		}
	};

	const removeMany = async () => {
		setDeleting( true );

		try {
			const result = await reelsApi.bulkRemove( selected );

			if ( result.deleted > 0 ) {
				toasts.success(
					sprintf(
						/* translators: %d: number of reels deleted. */
						_n(
							'%d reel deleted successfully!',
							'%d reels deleted successfully!',
							result.deleted,
							'productreels'
						),
						result.deleted
					)
				);
			}

			if ( result.failed.length > 0 ) {
				toasts.error(
					sprintf(
						/* translators: %d: number of reels that could not be deleted. */
						_n(
							'%d reel failed to delete.',
							'%d reels failed to delete.',
							result.failed.length,
							'productreels'
						),
						result.failed.length
					)
				);
			}

			setConfirming( null );
			setSelected( [] );
			await load();
		} catch ( requestError ) {
			toasts.error( requestError.message );
		} finally {
			setDeleting( false );
		}
	};

	const isEmpty = ! loading && items.length === 0;

	/**
	 * Open the real player on one reel, with every file and link it has.
	 *
	 * @param {Object}      reel The reel as listed.
	 * @param {HTMLElement} from The button that opened it, for focus return.
	 */
	const preview = async ( reel, from ) => {
		try {
			const full = await reelsApi.get( reel.id );

			setPreviewing( { reel: full, from } );
		} catch ( requestError ) {
			toasts.error( requestError.message );
		}
	};

	return (
		<>
			<div className="wr-page-head">
				<div className="wr-page-head__titles">
					<h1 className="wr-page-head__title">
						{ __(
							'All Reels',
							'productreels'
						) }
						{ ! loading && total > 0 && (
							<span className="wr-count-chip">
								{ formatNumber( total ) }
							</span>
						) }
					</h1>
					<p className="wr-page-head__sub">
						{ __(
							'Each reel lives on its own and can appear in as many widgets as you like.',
							'productreels'
						) }
					</p>
				</div>
				<div className="wr-page-head__actions">
					{ selected.length > 0 && (
						<Button
							variant="danger"
							icon={ IconTrash }
							onClick={ () => setConfirming( { bulk: true } ) }
						>
							{ sprintf(
								/* translators: %d: number of selected reels. */
								__(
									'Delete Selected (%d)',
									'productreels'
								),
								selected.length
							) }
						</Button>
					) }
					<SearchInput
						value={ search }
						onChange={ setSearch }
						placeholder={ __(
							'Search reels…',
							'productreels'
						) }
					/>
					<Button
						variant="primary"
						icon={ IconPlus }
						onClick={ () => setEditing( { id: 0 } ) }
					>
						{ __(
							'Add Reel',
							'productreels'
						) }
					</Button>
				</div>
			</div>

			<div className="wr-app__body">
				{ error !== '' && (
					<div className="wr-card wr-error-card">
						<p>{ error }</p>
						<Button onClick={ load }>
							{ __(
								'Try again',
								'productreels'
							) }
						</Button>
					</div>
				) }

				{ error === '' && isEmpty && (
					<div className="wr-card">
						<EmptyState
							title={
								search === ''
									? __(
											"You don't have any reels yet.",
											'productreels'
										)
									: __(
											'No reels match that search.',
											'productreels'
										)
							}
							text={
								search === ''
									? __(
											'A reel is one vertical video, a title, and the buttons or products you want to sell from it.',
											'productreels'
										)
									: __(
											'Try a different title, or clear the search to see everything.',
											'productreels'
										)
							}
							action={
								search === '' ? (
									<Button
										variant="primary"
										icon={ IconPlus }
										onClick={ () =>
											setEditing( { id: 0 } )
										}
									>
										{ __(
											'Add Reel',
											'productreels'
										) }
									</Button>
								) : (
									<Button onClick={ () => setSearch( '' ) }>
										{ __(
											'Clear',
											'productreels'
										) }
									</Button>
								)
							}
						/>
					</div>
				) }

				{ error === '' && ( loading || items.length > 0 ) && (
					<div className="wr-reel-grid">
						{ loading ? (
							<SkeletonCards />
						) : (
							items.map( ( reel ) => (
								<ReelCard
									key={ reel.id }
									reel={ reel }
									selected={ selected.includes( reel.id ) }
									onSelect={ () => toggle( reel.id ) }
									onEdit={ () => setEditing( reel ) }
									onPreview={ ( event ) =>
										preview( reel, event.currentTarget )
									}
									onDelete={ () => setConfirming( { reel } ) }
								/>
							) )
						) }
					</div>
				) }

				{ error === '' && ! loading && page < pages && (
					<div className="wr-load-more">
						<Button
							busy={ loadingMore }
							disabled={ loadingMore }
							onClick={ loadMore }
						>
							{ sprintf(
								/* translators: 1: reels shown so far, 2: total reels. */
								__(
									'Load more (%1$s of %2$s)',
									'productreels'
								),
								formatNumber( items.length ),
								formatNumber( total )
							) }
						</Button>
					</div>
				) }
			</div>

			{ editing && (
				<ReelEditor
					reelId={ editing.id }
					onClose={ () => setEditing( null ) }
					onSaved={ async () => {
						setEditing( null );
						await load();
					} }
				/>
			) }

			{ previewing && (
				<Player
					widget={ {
						id: 0,
						name: previewing.reel.title,
						reels: [ previewing.reel ],
					} }
					styles={ boot.defaults }
					services={ editorServices }
					returnFocusTo={ previewing.from }
					onClose={ () => setPreviewing( null ) }
				/>
			) }

			{ confirming && (
				<ConfirmDialog
					title={
						confirming.bulk
							? sprintf(
									/* translators: %d: number of reels. */
									__(
										'Are you sure you want to remove %d reels?',
										'productreels'
									),
									selected.length
								)
							: __(
									'Are you sure you want to remove this reel?',
									'productreels'
								)
					}
					busy={ deleting }
					onConfirm={ confirming.bulk ? removeMany : removeOne }
					onClose={ () => setConfirming( null ) }
				>
					{ __(
						'This also removes it from every widget it appears in. Widgets themselves are kept.',
						'productreels'
					) }
				</ConfirmDialog>
			) }
		</>
	);
};
