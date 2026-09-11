/**
 * The widgets list.
 *
 * The first screen anyone sees, so it carries its own weight: an overview
 * strip with the numbers that matter, rows you can recognise by their reels
 * rather than only by name, sortable columns, a shortcode chip that copies in
 * one click, and — on a fresh install — a three-step start rather than an
 * empty table.
 */

import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { reels as reelsApi, widgets as widgetsApi } from '../api';
import {
	IconChart,
	IconCheck,
	IconChevronDown,
	IconChevronRight,
	IconCopy,
	IconDuplicate,
	IconEdit,
	IconLayout,
	IconPlus,
	IconTrash,
	IconVideo,
} from '../components/icons';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { SearchInput } from '../components/ui/Fields';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToasts } from '../components/ui/Toasts';
import { useDebounced } from '../hooks/use-debounced';
import { ReelEditor } from './ReelEditor';

const locale = () => document.documentElement.lang || undefined;

const formatNumber = ( value ) =>
	new Intl.NumberFormat( locale() ).format( Number( value ) || 0 );

const formatPercent = ( value ) =>
	new Intl.NumberFormat( locale(), {
		style: 'percent',
		maximumFractionDigits: 1,
	} ).format( Number( value ) || 0 );

const formatDate = ( value ) => {
	const date = new Date( value.replace( ' ', 'T' ) );

	return Number.isNaN( date.getTime() )
		? value
		: new Intl.DateTimeFormat( locale(), { dateStyle: 'medium' } ).format(
				date
		  );
};

const TEMPLATE_LABELS = {
	grid: __( 'Grid', 'wooreels' ),
	carousel: __( 'Carousel', 'wooreels' ),
	marquee: __( 'Marquee', 'wooreels' ),
	stacked: __( 'Stacked', 'wooreels' ),
	popup: __( 'Popup', 'wooreels' ),
};

const ctrOf = ( widget ) =>
	widget.view_total > 0 ? widget.click_total / widget.view_total : 0;

/**
 * Copy text with a fallback for browsers that refuse the clipboard API.
 *
 * @param {string} text What to copy.
 */
const copyText = async ( text ) => {
	try {
		await window.navigator.clipboard.writeText( text );
	} catch ( error ) {
		const field = document.createElement( 'textarea' );

		field.value = text;
		document.body.appendChild( field );
		field.select();
		document.execCommand( 'copy' );
		document.body.removeChild( field );
	}
};

const ShortcodeChip = ( { id, onCopied } ) => {
	const [ copied, setCopied ] = useState( false );
	const shortcode = `[wooreels id="${ id }"]`;

	const copy = async () => {
		await copyText( shortcode );
		setCopied( true );
		onCopied();
		setTimeout( () => setCopied( false ), 1600 );
	};

	return (
		<button
			type="button"
			className="wr-shortcode"
			onClick={ copy }
			aria-label={ sprintf(
				/* translators: %s: the shortcode. */
				__( 'Copy %s', 'wooreels' ),
				shortcode
			) }
		>
			<code>{ shortcode }</code>
			{ copied ? <IconCheck size={ 13 } /> : <IconCopy size={ 13 } /> }
		</button>
	);
};

/**
 * Up to three reel posters, fanned, so a row is recognisable at a glance.
 *
 * @param {Object}   props         Props.
 * @param {string[]} props.posters Poster URLs, in reel order.
 * @param {number}   props.count   How many reels the widget has in total.
 * @return {Object} The stack.
 */
const PosterStack = ( { posters, count } ) => (
	<span className="wr-stack" aria-hidden="true">
		{ ( posters.length ? posters : [ '' ] ).map( ( poster, index ) => (
			<span key={ index } className="wr-stack__frame">
				{ poster ? (
					<img
						src={ poster }
						alt=""
						loading="lazy"
						decoding="async"
					/>
				) : (
					<IconVideo size={ 12 } />
				) }
			</span>
		) ) }
		{ count > posters.length && posters.length > 0 && (
			<span className="wr-stack__more">+{ count - posters.length }</span>
		) }
	</span>
);

const SortHeader = ( { column, label, sort, onSort, numeric = false } ) => {
	const active = sort.column === column;
	let ariaSort = 'none';

	if ( active ) {
		ariaSort = sort.direction === 'asc' ? 'ascending' : 'descending';
	}

	return (
		<th
			scope="col"
			aria-sort={ ariaSort }
			className={ numeric ? 'wr-table__num' : '' }
		>
			<button
				type="button"
				className={ `wr-sort${ active ? ' is-active' : '' }${
					active && sort.direction === 'asc' ? ' is-asc' : ''
				}` }
				onClick={ () => onSort( column ) }
			>
				{ label }
				<IconChevronDown size={ 12 } />
			</button>
		</th>
	);
};

const Overview = ( { items, loading } ) => {
	const totals = useMemo( () => {
		const views = items.reduce( ( sum, w ) => sum + w.view_total, 0 );
		const clicks = items.reduce( ( sum, w ) => sum + w.click_total, 0 );
		const reels = items.reduce( ( sum, w ) => sum + w.reel_count, 0 );

		return {
			widgets: items.length,
			reels,
			views,
			clicks,
			ctr: views > 0 ? clicks / views : 0,
		};
	}, [ items ] );

	const tiles = [
		{
			label: __( 'Widgets', 'wooreels' ),
			value: formatNumber( totals.widgets ),
			hint: sprintf(
				/* translators: %d: number of reel placements across all widgets. */
				_n(
					'%d reel placed',
					'%d reels placed',
					totals.reels,
					'wooreels'
				),
				totals.reels
			),
		},
		{
			label: __( 'Total Views', 'wooreels' ),
			value: formatNumber( totals.views ),
			hint: __( 'Across every widget', 'wooreels' ),
		},
		{
			label: __( 'Total Clicks', 'wooreels' ),
			value: formatNumber( totals.clicks ),
			hint: __( 'Buttons and product cards', 'wooreels' ),
		},
		{
			label: __( 'CTR', 'wooreels' ),
			value: formatPercent( totals.ctr ),
			hint: __( 'Clicks per view', 'wooreels' ),
		},
	];

	return (
		<div className="wr-overview">
			{ tiles.map( ( tile ) => (
				<div key={ tile.label } className="wr-overview__tile">
					<span className="wr-overview__label">{ tile.label }</span>
					{ loading ? (
						<Skeleton width={ 72 } height={ 26 } />
					) : (
						<span className="wr-overview__value">
							{ tile.value }
						</span>
					) }
					<span className="wr-overview__hint">{ tile.hint }</span>
				</div>
			) ) }
		</div>
	);
};

const SkeletonRows = () => (
	<>
		{ [ 0, 1, 2, 3, 4 ].map( ( row ) => (
			<tr key={ row } className="wr-table__row">
				<td>
					<span className="wr-table__widget">
						<Skeleton width={ 56 } height={ 44 } radius="6px" />
						<span className="wr-table__widget-text">
							<Skeleton width={ 160 } height={ 14 } />
							<Skeleton width={ 90 } height={ 11 } />
						</span>
					</span>
				</td>
				<td>
					<Skeleton width={ 24 } height={ 14 } />
				</td>
				<td>
					<Skeleton width={ 148 } height={ 26 } radius="6px" />
				</td>
				<td>
					<Skeleton width={ 32 } height={ 14 } />
				</td>
				<td>
					<Skeleton width={ 32 } height={ 14 } />
				</td>
				<td>
					<Skeleton width={ 40 } height={ 14 } />
				</td>
				<td>
					<Skeleton width={ 74 } height={ 14 } />
				</td>
				<td>
					<Skeleton width={ 130 } height={ 26 } radius="6px" />
				</td>
			</tr>
		) ) }
	</>
);

/**
 * A fresh install: three steps, in order, with the first two as buttons.
 *
 * @param {Object}   props           Props.
 * @param {boolean}  props.hasReels  Whether any reel exists yet.
 * @param {Function} props.onAddReel Opens the reel editor.
 * @param {Function} props.onCreate  Goes to the widget editor.
 * @return {Object} The guide.
 */
const GettingStarted = ( { hasReels, onAddReel, onCreate } ) => {
	const steps = [
		{
			title: __( 'Add Reel', 'wooreels' ),
			text: __(
				'Upload a short vertical video, or paste a Vimeo, YouTube Shorts or hosted link. Tag products or add a button.',
				'wooreels'
			),
			done: hasReels,
			action: (
				<Button
					variant={ hasReels ? 'secondary' : 'primary' }
					icon={ IconPlus }
					onClick={ onAddReel }
				>
					{ __( 'Add Reel', 'wooreels' ) }
				</Button>
			),
		},
		{
			title: __( 'Create Widget', 'wooreels' ),
			text: __(
				'Group reels into a widget, pick a layout and style it in the live editor.',
				'wooreels'
			),
			done: false,
			action: (
				<Button
					variant={ hasReels ? 'primary' : 'secondary' }
					icon={ IconLayout }
					onClick={ onCreate }
				>
					{ __( 'Create Widget', 'wooreels' ) }
				</Button>
			),
		},
		{
			title: __( 'Place it', 'wooreels' ),
			text: __(
				'Drop the shortcode into any page, or use the WooReels block or Elementor widget.',
				'wooreels'
			),
			done: false,
			action: (
				<code className="wr-start__code">{ '[wooreels id="1"]' }</code>
			),
		},
	];

	return (
		<div className="wr-card wr-start">
			<div className="wr-start__head">
				<h2 className="wr-start__title">
					{ __( "You haven't created any widget yet!", 'wooreels' ) }
				</h2>
				<p className="wr-start__text">
					{ __(
						'A widget is a styled, reusable set of reels. Three steps and it is live.',
						'wooreels'
					) }
				</p>
			</div>
			<ol className="wr-start__steps">
				{ steps.map( ( step, index ) => (
					<li
						key={ step.title }
						className={ `wr-start__step${
							step.done ? ' is-done' : ''
						}` }
					>
						<span className="wr-start__num">
							{ step.done ? (
								<IconCheck size={ 14 } />
							) : (
								index + 1
							) }
						</span>
						<span className="wr-start__body">
							<strong className="wr-start__step-title">
								{ step.title }
							</strong>
							<span className="wr-start__step-text">
								{ step.text }
							</span>
							<span className="wr-start__action">
								{ step.action }
							</span>
						</span>
					</li>
				) ) }
			</ol>
		</div>
	);
};

export const WidgetsList = ( { navigate } ) => {
	const toasts = useToasts();
	const [ search, setSearch ] = useState( '' );
	const [ items, setItems ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( '' );
	const [ confirming, setConfirming ] = useState( null );
	const [ deleting, setDeleting ] = useState( false );
	const [ busyId, setBusyId ] = useState( 0 );
	const [ hasReels, setHasReels ] = useState( null );
	const [ addingReel, setAddingReel ] = useState( false );
	const [ sort, setSort ] = useState( {
		column: 'created_at',
		direction: 'desc',
	} );

	const term = useDebounced( search, 300 );

	const load = useCallback( async () => {
		setLoading( true );
		setError( '' );

		try {
			const page = await widgetsApi.list( {
				search: term,
				per_page: 100,
				orderby: 'id',
				order: 'DESC',
			} );

			setItems( page.items );
			setTotal( page.total );
		} catch ( requestError ) {
			setError( requestError.message );
		} finally {
			setLoading( false );
		}
	}, [ term ] );

	useEffect( () => {
		load();
	}, [ load ] );

	// Whether there is anything to build a widget from, for the first-run guide.
	useEffect( () => {
		let cancelled = false;

		reelsApi
			.list( { per_page: 1 } )
			.then( ( page ) => {
				if ( ! cancelled ) {
					setHasReels( page.total > 0 );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setHasReels( true );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [] );

	const sorted = useMemo( () => {
		const sign = sort.direction === 'asc' ? 1 : -1;
		const collator = new Intl.Collator( locale(), {
			sensitivity: 'base',
			numeric: true,
		} );

		return [ ...items ].sort( ( a, b ) => {
			switch ( sort.column ) {
				case 'name':
					return collator.compare( a.name, b.name ) * sign;
				case 'reel_count':
				case 'view_total':
				case 'click_total':
					return ( a[ sort.column ] - b[ sort.column ] ) * sign;
				case 'ctr':
					return ( ctrOf( a ) - ctrOf( b ) ) * sign;
				default:
					return ( a.id - b.id ) * sign;
			}
		} );
	}, [ items, sort ] );

	const toggleSort = ( column ) =>
		setSort( ( current ) =>
			current.column === column
				? {
						column,
						direction: current.direction === 'asc' ? 'desc' : 'asc',
				  }
				: { column, direction: column === 'name' ? 'asc' : 'desc' }
		);

	const duplicate = async ( widget ) => {
		setBusyId( widget.id );

		try {
			await widgetsApi.duplicate( widget.id );
			toasts.success( __( 'Widget created successfully!', 'wooreels' ) );
			await load();
		} catch ( requestError ) {
			toasts.error( requestError.message );
		} finally {
			setBusyId( 0 );
		}
	};

	const remove = async () => {
		setDeleting( true );

		try {
			await widgetsApi.remove( confirming.id );
			toasts.success( __( 'Widget deleted successfully!', 'wooreels' ) );
			setConfirming( null );
			await load();
		} catch ( requestError ) {
			toasts.error( requestError.message );
		} finally {
			setDeleting( false );
		}
	};

	const isEmpty = ! loading && items.length === 0;
	const firstRun = isEmpty && search === '' && hasReels !== null;

	return (
		<>
			<div className="wr-page-head">
				<div className="wr-page-head__titles">
					<h1 className="wr-page-head__title">
						{ __( 'All Widgets', 'wooreels' ) }
						{ ! loading && total > 0 && (
							<span className="wr-count-chip">
								{ formatNumber( total ) }
							</span>
						) }
					</h1>
					<p className="wr-page-head__sub">
						{ __(
							'Reusable, styled collections of reels you can drop anywhere.',
							'wooreels'
						) }
					</p>
				</div>
				<div className="wr-page-head__actions">
					<SearchInput
						value={ search }
						onChange={ setSearch }
						placeholder={ __( 'Search widgets…', 'wooreels' ) }
					/>
					<Button
						icon={ IconPlus }
						onClick={ () => setAddingReel( true ) }
					>
						{ __( 'Add Reel', 'wooreels' ) }
					</Button>
					<Button
						variant="primary"
						icon={ IconLayout }
						onClick={ () => navigate( '#/widgets/new' ) }
					>
						{ __( 'Create Widget', 'wooreels' ) }
					</Button>
				</div>
			</div>

			<div className="wr-app__body">
				{ error !== '' && (
					<div className="wr-card wr-error-card">
						<p>{ error }</p>
						<Button onClick={ load }>
							{ __( 'Continue', 'wooreels' ) }
						</Button>
					</div>
				) }

				{ error === '' &&
					! firstRun &&
					( loading || items.length > 0 ) && (
						<Overview items={ items } loading={ loading } />
					) }

				{ error === '' && isEmpty && search !== '' && (
					<div className="wr-card">
						<EmptyState
							title={ __(
								'No widgets match that search.',
								'wooreels'
							) }
							text={ __(
								'Try a different name, or clear the search to see everything.',
								'wooreels'
							) }
							action={
								<Button onClick={ () => setSearch( '' ) }>
									{ __( 'Clear', 'wooreels' ) }
								</Button>
							}
						/>
					</div>
				) }

				{ error === '' && firstRun && (
					<GettingStarted
						hasReels={ hasReels }
						onAddReel={ () => setAddingReel( true ) }
						onCreate={ () => navigate( '#/widgets/new' ) }
					/>
				) }

				{ error === '' && ( loading || items.length > 0 ) && (
					<div className="wr-card wr-table-card">
						<table className="wr-table wr-table--widgets">
							<thead>
								<tr>
									<SortHeader
										column="name"
										label={ __(
											'Widget Name',
											'wooreels'
										) }
										sort={ sort }
										onSort={ toggleSort }
									/>
									<SortHeader
										column="reel_count"
										label={ __( 'Reels', 'wooreels' ) }
										sort={ sort }
										onSort={ toggleSort }
										numeric
									/>
									<th scope="col">
										{ __( 'Shortcode', 'wooreels' ) }
									</th>
									<SortHeader
										column="view_total"
										label={ __( 'Views', 'wooreels' ) }
										sort={ sort }
										onSort={ toggleSort }
										numeric
									/>
									<SortHeader
										column="click_total"
										label={ __( 'Clicks', 'wooreels' ) }
										sort={ sort }
										onSort={ toggleSort }
										numeric
									/>
									<SortHeader
										column="ctr"
										label={ __( 'CTR', 'wooreels' ) }
										sort={ sort }
										onSort={ toggleSort }
										numeric
									/>
									<SortHeader
										column="created_at"
										label={ __( 'Created', 'wooreels' ) }
										sort={ sort }
										onSort={ toggleSort }
									/>
									<th scope="col">
										<span className="wr-screen-reader-text">
											{ __( 'Actions', 'wooreels' ) }
										</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{ loading ? (
									<SkeletonRows />
								) : (
									sorted.map( ( widget ) => (
										<tr
											key={ widget.id }
											className="wr-table__row"
										>
											<td>
												<button
													type="button"
													className="wr-table__widget"
													onClick={ () =>
														navigate(
															`#/widgets/${ widget.id }`
														)
													}
												>
													<PosterStack
														posters={
															widget.posters || []
														}
														count={
															widget.reel_count
														}
													/>
													<span className="wr-table__widget-text">
														<span className="wr-table__name">
															{ widget.name }
														</span>
														<span className="wr-table__widget-meta">
															<span className="wr-badge wr-badge--template">
																{ TEMPLATE_LABELS[
																	widget
																		.template
																] ||
																	widget.template }
															</span>
															<span>
																#{ widget.id }
															</span>
														</span>
													</span>
													<IconChevronRight
														size={ 14 }
														className="wr-table__widget-go"
													/>
												</button>
											</td>
											<td className="wr-table__num">
												{ formatNumber(
													widget.reel_count
												) }
											</td>
											<td>
												<ShortcodeChip
													id={ widget.id }
													onCopied={ () =>
														toasts.success(
															__(
																'Copied!',
																'wooreels'
															)
														)
													}
												/>
											</td>
											<td className="wr-table__num">
												{ formatNumber(
													widget.view_total
												) }
											</td>
											<td className="wr-table__num">
												{ formatNumber(
													widget.click_total
												) }
											</td>
											<td className="wr-table__num wr-table__muted">
												{ widget.view_total > 0
													? formatPercent(
															ctrOf( widget )
													  )
													: '—' }
											</td>
											<td className="wr-table__muted">
												{ formatDate(
													widget.created_at
												) }
											</td>
											<td>
												<div className="wr-table__actions">
													<IconButton
														icon={ IconEdit }
														label={ __(
															'Edit',
															'wooreels'
														) }
														onClick={ () =>
															navigate(
																`#/widgets/${ widget.id }`
															)
														}
													/>
													<IconButton
														icon={ IconChart }
														label={ __(
															'Statistics',
															'wooreels'
														) }
														onClick={ () =>
															navigate(
																`#/widgets/${ widget.id }/stats`
															)
														}
													/>
													<IconButton
														icon={ IconDuplicate }
														label={ __(
															'Duplicate',
															'wooreels'
														) }
														disabled={
															busyId === widget.id
														}
														onClick={ () =>
															duplicate( widget )
														}
													/>
													<IconButton
														icon={ IconCopy }
														label={ __(
															'Copy shortcode',
															'wooreels'
														) }
														onClick={ async () => {
															await copyText(
																`[wooreels id="${ widget.id }"]`
															);
															toasts.success(
																__(
																	'Copied!',
																	'wooreels'
																)
															);
														} }
													/>
													<IconButton
														icon={ IconTrash }
														label={ __(
															'Delete',
															'wooreels'
														) }
														tone="danger"
														onClick={ () =>
															setConfirming(
																widget
															)
														}
													/>
												</div>
											</td>
										</tr>
									) )
								) }
							</tbody>
						</table>
					</div>
				) }
			</div>

			{ addingReel && (
				<ReelEditor
					reelId={ 0 }
					onClose={ () => setAddingReel( false ) }
					onSaved={ () => {
						setAddingReel( false );
						setHasReels( true );
					} }
				/>
			) }

			{ confirming && (
				<ConfirmDialog
					title={ __(
						'Are you sure you want to delete this widget?',
						'wooreels'
					) }
					busy={ deleting }
					onConfirm={ remove }
					onClose={ () => setConfirming( null ) }
				>
					{ sprintf(
						/* translators: %1$s: widget name, %2$s: a count of reels, already pluralised. */
						__(
							'%1$s will be removed, along with its click statistics. Its %2$s stay in your library and keep working in any other widget.',
							'wooreels'
						),
						confirming.name,
						sprintf(
							/* translators: %d: number of reels. */
							_n(
								'%d reel',
								'%d reels',
								confirming.reel_count,
								'wooreels'
							),
							confirming.reel_count
						)
					) }
				</ConfirmDialog>
			) }
		</>
	);
};
