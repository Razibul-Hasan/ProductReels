/**
 * ReelRow and ReelPicker: the widget's reels, and the library to add from.
 *
 * A ReelRow is one reel in the widget being edited, in page order. Its grip
 * drags it (dnd-kit, as in 1.0.0) and is keyboard operable: focus it, Space
 * or Enter lifts, the arrow keys move, Space drops, Escape cancels. The
 * second line says what the reel sells, so reels without links stand out.
 *
 * The ReelPicker shows the library. Tapping a reel adds it to the widget;
 * tapping it again takes it out. Added reels keep their place in the grid
 * with a brand outline and a check, so it's clear what's in.
 */

import { __, _n, sprintf } from '@wordpress/i18n';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '@shared/Icon';
import { IconButton } from './Button';
import { ReelCover } from './ReelCard';

/**
 * The reel with `file` set, which ReelCover reads: widget reels carry
 * `files[]`, library reels `file`.
 *
 * @param {Object} reel A reel.
 * @return {Object} The reel, with its first file as `file`.
 */
const withFile = ( reel ) =>
	reel.file || ! reel.files?.length
		? reel
		: { ...reel, file: reel.files[ 0 ] };

/**
 * What a reel sells, for its second line.
 *
 * @param {Object} reel A reel.
 * @return {{icon: string|null, text: string}} The icon and the words.
 */
export const reelSells = ( reel ) => {
	const links = Array.isArray( reel.links ) ? reel.links : [];
	const products = links.filter( ( link ) => link.btn_type === 'product' );

	if ( products.length ) {
		const first =
			products[ 0 ].buttonText || __( 'Product', 'productreels' );

		return {
			icon: 'tag',
			text:
				products.length === 1
					? first
					: sprintf(
							/* translators: 1: a product name, 2: how many more products are tagged. */
							_n(
								'%1$s and %2$d more',
								'%1$s and %2$d more',
								products.length - 1,
								'productreels'
							),
							first,
							products.length - 1
						),
		};
	}

	const buttons = links.filter( ( link ) => link.btn_type === 'custom' );

	if ( buttons.length ) {
		return {
			icon: 'link',
			text: _n(
				'Custom button',
				'Custom buttons',
				buttons.length,
				'productreels'
			),
		};
	}

	return { icon: null, text: __( 'No links', 'productreels' ) };
};

export const ReelRow = ( { reel, onPreview, onRemove } ) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id: reel.id } );
	const sells = reelSells( reel );

	return (
		<div
			ref={ setNodeRef }
			className="pr-reelrow"
			data-dragging={ isDragging ? 'true' : undefined }
			style={ {
				transform: CSS.Translate.toString( transform ),
				transition,
			} }
		>
			<button
				ref={ setActivatorNodeRef }
				type="button"
				className="pr-reelrow__grip"
				aria-label={ sprintf(
					/* translators: %s: reel title. */
					__( 'Reorder %s', 'productreels' ),
					reel.title
				) }
				{ ...attributes }
				{ ...listeners }
			>
				<Icon name="grip" size={ 16 } />
			</button>
			<span className="pr-reelrow__thumb">
				<ReelCover reel={ withFile( reel ) } />
			</span>
			<div className="pr-reelrow__text">
				<span className="pr-reelrow__title pr-t-body-strong">
					{ reel.title }
				</span>
				<span className="pr-reelrow__meta pr-t-small">
					{ sells.icon && <Icon name={ sells.icon } size={ 13 } /> }
					<span className="pr-reelrow__sells">{ sells.text }</span>
				</span>
			</div>
			<IconButton
				icon="play"
				label={ sprintf(
					/* translators: %s: reel title. */
					__( 'Preview %s', 'productreels' ),
					reel.title
				) }
				onClick={ ( event ) =>
					onPreview?.( reel, event.currentTarget )
				}
			/>
			<IconButton
				icon="x"
				className="pr-reelrow__remove"
				label={ sprintf(
					/* translators: %s: reel title. */
					__( 'Remove %s from this widget', 'productreels' ),
					reel.title
				) }
				onClick={ () => onRemove?.( reel ) }
			/>
		</div>
	);
};

export const ReelPicker = ( { reels = [], added = [], onToggle } ) => (
	<div className="pr-pickgrid">
		{ reels.map( ( reel ) => {
			const on = added.includes( reel.id );

			return (
				<button
					key={ reel.id }
					type="button"
					className="pr-pick"
					aria-pressed={ on ? 'true' : 'false' }
					onClick={ () => onToggle?.( reel ) }
				>
					<span className="pr-pick__media">
						<ReelCover reel={ withFile( reel ) } />
						<span className="pr-pick__add" aria-hidden="true">
							<Icon
								name={ on ? 'check' : 'plus' }
								size={ 16 }
								strokeWidth={ 2.25 }
							/>
						</span>
					</span>
					<span className="pr-pick__title pr-t-caption">
						{ reel.title }
					</span>
				</button>
			);
		} ) }
	</div>
);
