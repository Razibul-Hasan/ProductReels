/**
 * The widgets list.
 *
 * The first screen anyone sees, so it carries its own weight: real skeletons
 * while it loads, a designed empty state when there is nothing, and a
 * shortcode chip that copies in one click — the single thing people come to
 * this screen for once they have built a widget.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { widgets as widgetsApi } from '../api';
import {
	IconChart,
	IconCheck,
	IconCopy,
	IconDuplicate,
	IconEdit,
	IconPlus,
	IconTrash,
} from '../components/icons';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { SearchInput } from '../components/ui/Fields';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToasts } from '../components/ui/Toasts';
import { useDebounced } from '../hooks/use-debounced';

const formatNumber = ( value ) =>
	new Intl.NumberFormat( document.documentElement.lang || undefined ).format(
		value
	);

const formatDate = ( value ) => {
	const date = new Date( value.replace( ' ', 'T' ) );

	return Number.isNaN( date.getTime() )
		? value
		: new Intl.DateTimeFormat( document.documentElement.lang || undefined, {
				dateStyle: 'medium',
		  } ).format( date );
};

const ShortcodeChip = ( { id, onCopied } ) => {
	const [ copied, setCopied ] = useState( false );
	const shortcode = `[wooreels id="${ id }"]`;

	const copy = async () => {
		try {
			await window.navigator.clipboard.writeText( shortcode );
		} catch ( error ) {
			// Clipboard permission can be refused; fall back to a selection.
			const field = document.createElement( 'textarea' );

			field.value = shortcode;
			document.body.appendChild( field );
			field.select();
			document.execCommand( 'copy' );
			document.body.removeChild( field );
		}

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
				/* translators: %s: the shortcode. */ __(
					'Copy %s',
					'wooreels'
				),
				shortcode
			) }
		>
			<code>{ shortcode }</code>
			{ copied ? <IconCheck size={ 13 } /> : <IconCopy size={ 13 } /> }
		</button>
	);
};

const SkeletonRows = () => (
	<>
		{ [ 0, 1, 2, 3, 4 ].map( ( row ) => (
			<tr key={ row } className="wr-table__row">
				<td>
					<Skeleton width="60%" height={ 14 } />
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
					<Skeleton width={ 74 } height={ 14 } />
				</td>
				<td>
					<Skeleton width={ 130 } height={ 26 } radius="6px" />
				</td>
			</tr>
		) ) }
	</>
);

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
						variant="primary"
						icon={ IconPlus }
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

				{ error === '' && isEmpty && search === '' && (
					<div className="wr-card">
						<EmptyState
							title={ __(
								"You haven't created any widget yet!",
								'wooreels'
							) }
							text={ __(
								'A widget groups your reels, carries the styling, and gives you one shortcode to place anywhere on the site.',
								'wooreels'
							) }
							action={
								<Button
									variant="primary"
									icon={ IconPlus }
									onClick={ () =>
										navigate( '#/widgets/new' )
									}
								>
									{ __( 'Create Widget', 'wooreels' ) }
								</Button>
							}
						/>
					</div>
				) }

				{ error === '' && ( loading || items.length > 0 ) && (
					<div className="wr-card wr-table-card">
						<table className="wr-table">
							<thead>
								<tr>
									<th scope="col">
										{ __( 'Widget Name', 'wooreels' ) }
									</th>
									<th scope="col">
										{ __( 'Reels', 'wooreels' ) }
									</th>
									<th scope="col">
										{ __( 'Shortcode', 'wooreels' ) }
									</th>
									<th scope="col">
										{ __( 'Views', 'wooreels' ) }
									</th>
									<th scope="col">
										{ __( 'Clicks', 'wooreels' ) }
									</th>
									<th scope="col">
										{ __( 'Created', 'wooreels' ) }
									</th>
									<th scope="col">
										<span className="wr-screen-reader-text">
											{ __( 'Edit', 'wooreels' ) }
										</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{ loading ? (
									<SkeletonRows />
								) : (
									items.map( ( widget ) => (
										<tr
											key={ widget.id }
											className="wr-table__row"
										>
											<td>
												<button
													type="button"
													className="wr-table__name"
													onClick={ () =>
														navigate(
															`#/widgets/${ widget.id }`
														)
													}
												>
													{ widget.name }
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
