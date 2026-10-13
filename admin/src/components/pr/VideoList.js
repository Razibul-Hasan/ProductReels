/**
 * VideoList: a reel's clips in play order.
 *
 * Each row shows the clip's cover, its name and either where it came from or
 * its upload progress, with Move up, Move down and Remove. After a move the
 * focus stays on the button that was pressed (or its partner, once the row
 * reaches an end); after a remove it goes to the next row.
 */

import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { IconButton } from './Button';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

const isUpload = ( item ) => typeof item?.progress === 'number';

export const VideoList = ( { items, onMove, onRemove } ) => {
	const list = useRef( null );
	const pending = useRef( null );

	useEffect( () => {
		const want = pending.current;

		if ( ! want || ! list.current ) {
			return;
		}

		pending.current = null;

		const rows = Array.from( list.current.querySelectorAll( '.pr-video' ) );
		const row =
			rows.find( ( node ) => node.dataset.key === want.key ) ||
			rows[ Math.min( want.index, rows.length - 1 ) ];

		if ( ! row ) {
			return;
		}

		const buttons = want.actions
			.map( ( action ) =>
				row.querySelector( `[data-action="${ action }"]` )
			)
			.filter( ( button ) => button && ! button.disabled );

		buttons[ 0 ]?.focus();
	}, [ items ] );

	return (
		<div className="pr-videos" ref={ list }>
			{ items.map( ( item, index ) => {
				const uploading = isUpload( item );

				return (
					<div
						className="pr-video"
						key={ item.key }
						data-key={ item.key }
					>
						<span className="pr-video__thumb">{ item.thumb }</span>
						<div className="pr-video__text">
							<span
								className="pr-video__name pr-t-body-strong"
								title={ item.name }
							>
								{ item.name }
							</span>
							{ uploading ? (
								<>
									<span
										className="pr-progress"
										role="progressbar"
										aria-label={ sprintf(
											/* translators: %s: file name. */
											__(
												'Uploading %s',
												'productreels'
											),
											item.name
										) }
										aria-valuenow={ item.progress }
										aria-valuemin={ 0 }
										aria-valuemax={ 100 }
									>
										<span
											style={ {
												width: `${ item.progress }%`,
											} }
										/>
									</span>
									<span className="pr-video__meta pr-t-small">
										{ item.meta }
									</span>
								</>
							) : (
								<span
									className={ cx(
										'pr-video__meta pr-t-small',
										item.icon !== 'success' &&
											'pr-video__meta--source'
									) }
								>
									<Icon name={ item.icon } size={ 14 } />
									{ item.meta }
								</span>
							) }
						</div>
						<div className="pr-video__actions">
							<IconButton
								icon="arrow-up"
								label={ __( 'Move up', 'productreels' ) }
								data-action="up"
								disabled={ uploading || index === 0 }
								onClick={ () => {
									pending.current = {
										key: item.key,
										index: index - 1,
										actions: [ 'up', 'down' ],
									};
									onMove( index, index - 1 );
								} }
							/>
							<IconButton
								icon="arrow-down"
								label={ __( 'Move down', 'productreels' ) }
								data-action="down"
								disabled={
									uploading ||
									index === items.length - 1 ||
									isUpload( items[ index + 1 ] )
								}
								onClick={ () => {
									pending.current = {
										key: item.key,
										index: index + 1,
										actions: [ 'down', 'up' ],
									};
									onMove( index, index + 1 );
								} }
							/>
							<IconButton
								icon="trash"
								label={
									uploading
										? __( 'Cancel upload', 'productreels' )
										: __( 'Remove video', 'productreels' )
								}
								variant="danger"
								data-action="remove"
								onClick={ () => {
									pending.current = {
										key: items[ index + 1 ]?.key,
										index,
										actions: [ 'remove' ],
									};
									onRemove( index );
								} }
							/>
						</div>
					</div>
				);
			} ) }
		</div>
	);
};
