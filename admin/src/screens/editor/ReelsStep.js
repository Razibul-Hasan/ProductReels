/**
 * Reels step: the widget's reels in page order, and the library to add from.
 *
 * Part 07 interim: the 1.0.0 attached list (dnd-kit) and reel picker, moved
 * here from the old three-pane editor unchanged. Part 08 rebuilds the step.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	rectSortingStrategy,
	sortableKeyboardCoordinates,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { posterOf } from '@shared/format';
import { reels as reelsApi } from '../../api';
import {
	IconGrip,
	IconPlay,
	IconPlus,
	IconTrash,
	IconVideo,
} from '../../components/icons';
import { Button, IconButton } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Feedback';
import { SearchInput } from '../../components/ui/Fields';
import { PanelSection, useToasts } from '../../components/pr';
import { useDebounced } from '../../hooks/use-debounced';
import { ReelEditor } from '../ReelEditor';

/** How many reels the picker fetches per page. */
const PICKER_PAGE = 24;

const PickerCard = ( { reel, onAdd } ) => {
	const poster = posterOf( reel );

	return (
		<button
			type="button"
			className="wr-pick"
			onClick={ () => onAdd( reel ) }
		>
			<span className="wr-pick__frame">
				{ poster ? (
					<img
						src={ poster }
						alt=""
						loading="lazy"
						decoding="async"
					/>
				) : (
					<span className="wr-pick__blank">
						<IconVideo size={ 18 } />
					</span>
				) }
				<span className="wr-pick__add">
					<IconPlus size={ 14 } />
				</span>
			</span>
			<span className="wr-pick__title">{ reel.title }</span>
		</button>
	);
};

const SortableReel = ( { reel, onRemove, onPreview } ) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id: reel.id } );
	const poster = posterOf( reel );

	return (
		<li
			ref={ setNodeRef }
			className={ `wr-attached${ isDragging ? ' is-dragging' : '' }` }
			style={ {
				transform: CSS.Transform.toString( transform ),
				transition,
			} }
		>
			<button
				type="button"
				className="wr-attached__grip"
				aria-label={ sprintf(
					/* translators: %s: reel title. */
					__( 'Reorder %s', 'productreels' ),
					reel.title
				) }
				{ ...attributes }
				{ ...listeners }
			>
				<IconGrip size={ 14 } />
			</button>

			<span className="wr-attached__frame">
				{ poster ? (
					<img src={ poster } alt="" loading="lazy" />
				) : (
					<span className="wr-pick__blank">
						<IconVideo size={ 15 } />
					</span>
				) }
			</span>

			<span className="wr-attached__title">{ reel.title }</span>

			<IconButton
				icon={ IconPlay }
				label={ __( 'Preview', 'productreels' ) }
				size={ 14 }
				onClick={ ( event ) => onPreview( reel, event.currentTarget ) }
			/>

			<IconButton
				icon={ IconTrash }
				label={ __( 'Delete', 'productreels' ) }
				tone="danger"
				size={ 14 }
				onClick={ () => onRemove( reel.id ) }
			/>
		</li>
	);
};

export const ReelsStep = ( { attached, setAttached, onPreview } ) => {
	const toasts = useToasts();
	const [ search, setSearch ] = useState( '' );
	const [ available, setAvailable ] = useState( [] );
	const [ picking, setPicking ] = useState( true );
	const [ pickerPage, setPickerPage ] = useState( 1 );
	const [ pickerPages, setPickerPages ] = useState( 1 );
	const [ loadingMore, setLoadingMore ] = useState( false );
	const [ creating, setCreating ] = useState( false );
	const term = useDebounced( search, 300 );

	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 4 } } ),
		useSensor( KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		} )
	);

	const loadPicker = useCallback(
		( page ) =>
			reelsApi.list( {
				search: term,
				page,
				per_page: PICKER_PAGE,
				orderby: 'id',
				order: 'DESC',
			} ),
		[ term ]
	);

	useEffect( () => {
		let cancelled = false;

		setPicking( true );

		loadPicker( 1 )
			.then( ( page ) => {
				if ( ! cancelled ) {
					setAvailable( page.items );
					setPickerPage( 1 );
					setPickerPages( page.pages );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setAvailable( [] );
					setPickerPages( 1 );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setPicking( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ loadPicker ] );

	const loadMore = async () => {
		const next = pickerPage + 1;

		setLoadingMore( true );

		try {
			const page = await loadPicker( next );

			setAvailable( ( current ) => {
				const seen = new Set( current.map( ( reel ) => reel.id ) );

				return current.concat(
					page.items.filter( ( reel ) => ! seen.has( reel.id ) )
				);
			} );
			setPickerPage( next );
			setPickerPages( page.pages );
		} catch ( error ) {
			toasts.error( error.message );
		} finally {
			setLoadingMore( false );
		}
	};

	const add = ( reel ) => setAttached( [ ...attached, reel ] );

	const remove = ( id ) =>
		setAttached( attached.filter( ( reel ) => reel.id !== id ) );

	const onDragEnd = ( { active, over } ) => {
		if ( ! over || active.id === over.id ) {
			return;
		}

		const from = attached.findIndex( ( reel ) => reel.id === active.id );
		const to = attached.findIndex( ( reel ) => reel.id === over.id );

		setAttached( arrayMove( attached, from, to ) );
	};

	const ids = attached.map( ( reel ) => reel.id );
	const offerable = available.filter( ( reel ) => ! ids.includes( reel.id ) );

	return (
		<>
			{ attached.length > 0 && (
				<PanelSection>
					<DndContext
						sensors={ sensors }
						collisionDetection={ closestCenter }
						onDragEnd={ onDragEnd }
					>
						<SortableContext
							items={ ids }
							strategy={ rectSortingStrategy }
						>
							<ul className="wr-attached-list">
								{ attached.map( ( reel ) => (
									<SortableReel
										key={ reel.id }
										reel={ reel }
										onRemove={ remove }
										onPreview={ onPreview }
									/>
								) ) }
							</ul>
						</SortableContext>
					</DndContext>
				</PanelSection>
			) }

			<PanelSection
				title={ __( 'Add from your library', 'productreels' ) }
			>
				<div className="wr-editor__pane-tools">
					<Button
						className="wr-editor__add-reel"
						icon={ IconPlus }
						onClick={ () => setCreating( true ) }
					>
						{ __( 'Add Reel', 'productreels' ) }
					</Button>
					<SearchInput
						value={ search }
						onChange={ setSearch }
						placeholder={ __( 'Search reels…', 'productreels' ) }
					/>
				</div>

				{ picking && (
					<div className="wr-pick-grid">
						{ [ 0, 1, 2, 3 ].map( ( card ) => (
							<div key={ card } className="wr-pick">
								<div className="wr-pick__frame wr-skeleton" />
								<Skeleton width="80%" height={ 11 } />
							</div>
						) ) }
					</div>
				) }

				{ ! picking && offerable.length === 0 && (
					<p className="wr-editor__empty">
						{ __(
							'No reels are available to add.',
							'productreels'
						) }
					</p>
				) }

				{ ! picking && offerable.length > 0 && (
					<div className="wr-pick-grid">
						{ offerable.map( ( reel ) => (
							<PickerCard
								key={ reel.id }
								reel={ reel }
								onAdd={ add }
							/>
						) ) }
					</div>
				) }

				{ ! picking && pickerPage < pickerPages && (
					<div className="wr-editor__more">
						<Button
							size="sm"
							busy={ loadingMore }
							disabled={ loadingMore }
							onClick={ loadMore }
						>
							{ __( 'Load more', 'productreels' ) }
						</Button>
					</div>
				) }
			</PanelSection>

			{ creating && (
				<ReelEditor
					reelId={ 0 }
					onClose={ () => setCreating( false ) }
					onSaved={ ( reel ) => {
						setCreating( false );

						// A reel made from here joins the widget straight away.
						if ( reel && reel.id ) {
							add( reel );
						}
					} }
				/>
			) }
		</>
	);
};
