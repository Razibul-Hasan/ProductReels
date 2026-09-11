/**
 * The reel editor: media on the left, everything about the reel on the right.
 *
 * All four sources produce the same file shape, so the rest of the editor — and
 * the whole player — never has to care where a video came from.
 */

import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { reels as reelsApi } from '../api';
import {
	IconCamera,
	IconChevronDown,
	IconClose,
	IconEdit,
	IconGrip,
	IconImage,
	IconLink,
	IconPlus,
	IconSpinner,
	IconTag,
	IconTrash,
	IconUpload,
	IconVideo,
} from '../components/icons';
import { Button, IconButton } from '../components/ui/Button';
import { Notice } from '../components/ui/Feedback';
import { TextField } from '../components/ui/Fields';
import { Modal } from '../components/ui/Modal';
import { useToasts } from '../components/ui/Toasts';
import { useDismiss } from '../hooks/use-dismiss';
import { LinkDialog, uuid } from './LinkDialog';
import { PosterCapture } from './PosterCapture';

const SAFARI_SAFE = [ 'video/mp4', 'video/webm' ];

const SOURCES = [
	{
		value: 'library',
		label: __( 'Choose from Media', 'wooreels' ),
		icon: IconImage,
	},
	{ value: 'vimeo', label: 'Vimeo', icon: IconVideo },
	{ value: 'youtube', label: 'YouTube Shorts', icon: IconVideo },
	{ value: 'hosted', label: __( 'Url', 'wooreels' ), icon: IconLink },
];

const URL_SOURCE_COPY = {
	vimeo: {
		placeholder: 'https://vimeo.com/123456789',
		invalid: __( 'Enter a valid Vimeo video URL.', 'wooreels' ),
		help: __(
			'Paste one URL per line to add several at once.',
			'wooreels'
		),
	},
	youtube: {
		placeholder: 'https://www.youtube.com/shorts/…',
		invalid: __( 'Enter a valid YouTube Shorts URL.', 'wooreels' ),
		help: __(
			'Paste one URL per line to add several at once.',
			'wooreels'
		),
	},
	hosted: {
		placeholder: 'https://cdn.example.com/reel.mp4',
		invalid: __( 'Enter a valid video URL.', 'wooreels' ),
		help: __(
			'For smooth playback across all browsers, use MP4 video URLs.',
			'wooreels'
		),
	},
};

/**
 * Open the WordPress media frame, restricted to video.
 *
 * @param {Function} onPicked Receives the selected attachments.
 */
const openMediaFrame = ( onPicked ) => {
	const frame = window.wp.media( {
		title: __( 'Add Videos', 'wooreels' ),
		library: { type: 'video' },
		button: { text: __( 'Add Videos', 'wooreels' ) },
		multiple: true,
	} );

	frame.on( 'select', () => {
		onPicked(
			frame
				.state()
				.get( 'selection' )
				.map( ( item ) => item.toJSON() )
				.map( ( item ) => ( {
					file_uuid: uuid(),
					wp_media_id: item.id,
					url: item.url,
					mime_type: item.mime || 'video/mp4',
					source: 'native',
					provider_id: '',
					poster_url:
						item.image?.src &&
						! /\.(mp4|webm|mov)$/i.test( item.image.src )
							? item.image.src
							: '',
					duration: 0,
				} ) )
		);
	} );

	frame.open();
};

/**
 * Open the media frame for a still image, used to pick a poster.
 *
 * @param {Function} onPicked Receives the selected attachment.
 */
const openPosterFrame = ( onPicked ) => {
	const frame = window.wp.media( {
		title: __( 'Choose from Media', 'wooreels' ),
		library: { type: 'image' },
		button: { text: __( 'Choose from Media', 'wooreels' ) },
		multiple: false,
	} );

	frame.on( 'select', () => {
		const item = frame.state().get( 'selection' ).first().toJSON();

		onPicked( item.url );
	} );

	frame.open();
};

const SourcePicker = ( { onPick } ) => {
	const [ open, setOpen ] = useState( false );
	const ref = useRef( null );

	useDismiss( ref, open, () => setOpen( false ) );

	return (
		<div className="wr-source" ref={ ref }>
			<Button
				variant="secondary"
				icon={ IconPlus }
				aria-haspopup="menu"
				aria-expanded={ open ? 'true' : 'false' }
				onClick={ () => setOpen( ! open ) }
			>
				{ __( 'Add Videos', 'wooreels' ) }
				<IconChevronDown size={ 13 } />
			</Button>
			{ open && (
				<div className="wr-source__menu" role="menu">
					{ SOURCES.map( ( source ) => {
						const Icon = source.icon;

						return (
							<button
								key={ source.value }
								type="button"
								role="menuitem"
								className="wr-select__option"
								onClick={ () => {
									setOpen( false );
									onPick( source.value );
								} }
							>
								<span className="wr-source__item">
									<Icon size={ 15 } />
									{ source.label }
								</span>
							</button>
						);
					} ) }
				</div>
			) }
		</div>
	);
};

const UrlSourcePanel = ( { source, onAdd, onClose } ) => {
	const copy = URL_SOURCE_COPY[ source ];
	const [ text, setText ] = useState( '' );
	const [ rows, setRows ] = useState( [] );
	const [ checking, setChecking ] = useState( false );

	const verify = async () => {
		const urls = text
			.split( /\n+/ )
			.map( ( line ) => line.trim() )
			.filter( Boolean );

		if ( urls.length === 0 ) {
			return;
		}

		setChecking( true );

		const results = await Promise.all(
			urls.map( async ( url ) => {
				try {
					const result = await reelsApi.validateUrl( url, source );

					// A Vimeo box must not quietly accept a YouTube link.
					if ( source !== 'hosted' && result.source !== source ) {
						return { url, ok: false };
					}

					return { url, ok: true, result };
				} catch ( error ) {
					return { url, ok: false };
				}
			} )
		);

		setRows( results );
		setChecking( false );
	};

	const accept = () => {
		onAdd(
			rows
				.filter( ( row ) => row.ok )
				.map( ( row ) => ( {
					file_uuid: uuid(),
					wp_media_id: 0,
					url: row.url,
					mime_type: row.result.mime_type,
					source: row.result.source,
					provider_id: row.result.provider_id,
					poster_url: row.result.poster_url,
					duration: row.result.duration,
				} ) )
		);
	};

	const good = rows.filter( ( row ) => row.ok ).length;

	return (
		<Modal
			title={ SOURCES.find( ( entry ) => entry.value === source ).label }
			onClose={ onClose }
			footer={
				<>
					<Button variant="ghost" onClick={ onClose }>
						{ __( 'Cancel', 'wooreels' ) }
					</Button>
					{ rows.length === 0 ? (
						<Button
							variant="primary"
							busy={ checking }
							disabled={ checking }
							onClick={ verify }
						>
							{ __( 'Continue', 'wooreels' ) }
						</Button>
					) : (
						<Button
							variant="primary"
							disabled={ good === 0 }
							onClick={ accept }
						>
							{ __( 'Add Videos', 'wooreels' ) }
						</Button>
					) }
				</>
			}
		>
			<div className="wr-form">
				<div className="wr-field">
					<label className="wr-field__label" htmlFor="wr-url-source">
						{ __( 'Url', 'wooreels' ) }
					</label>
					<textarea
						id="wr-url-source"
						className="wr-input wr-textarea"
						rows="4"
						spellCheck="false"
						placeholder={ copy.placeholder }
						value={ text }
						onChange={ ( event ) => {
							setText( event.target.value );
							setRows( [] );
						} }
					/>
					<span className="wr-field__help">{ copy.help }</span>
				</div>

				{ rows.length > 0 && (
					<ul className="wr-url-rows">
						{ rows.map( ( row ) => (
							<li
								key={ row.url }
								className={ `wr-url-row${
									row.ok ? '' : ' is-bad'
								}` }
							>
								{ row.ok && row.result.poster_url ? (
									<img
										className="wr-url-row__thumb"
										src={ row.result.poster_url }
										alt=""
									/>
								) : (
									<span className="wr-url-row__thumb wr-url-row__thumb--empty">
										<IconVideo size={ 15 } />
									</span>
								) }
								<span className="wr-url-row__text">
									<span className="wr-url-row__url">
										{ row.url }
									</span>
									{ ! row.ok && (
										<span className="wr-field__error">
											{ copy.invalid }
										</span>
									) }
								</span>
							</li>
						) ) }
					</ul>
				) }
			</div>
		</Modal>
	);
};

const LinkChip = ( { link, index, onEdit, onRemove, onMove } ) => (
	<li
		className="wr-chip"
		draggable
		onDragStart={ ( event ) =>
			event.dataTransfer.setData( 'text/plain', String( index ) )
		}
		onDragOver={ ( event ) => event.preventDefault() }
		onDrop={ ( event ) => {
			event.preventDefault();
			onMove(
				Number( event.dataTransfer.getData( 'text/plain' ) ),
				index
			);
		} }
	>
		<span className="wr-chip__grip" aria-hidden="true">
			<IconGrip size={ 14 } />
		</span>
		{ link.btn_type === 'product' ? (
			<IconTag size={ 14 } />
		) : (
			<IconLink size={ 14 } />
		) }
		<span className="wr-chip__text">
			{ link.buttonText || __( 'Button Text', 'wooreels' ) }
		</span>
		{ link.campaignName && (
			<span className="wr-chip__campaign">{ link.campaignName }</span>
		) }
		<span className="wr-chip__tools">
			<IconButton
				icon={ IconChevronDown }
				label={ __( 'Move down', 'wooreels' ) }
				size={ 13 }
				onClick={ () => onMove( index, index + 1 ) }
			/>
			{ link.btn_type === 'custom' && (
				<IconButton
					icon={ IconEdit }
					label={ __( 'Edit', 'wooreels' ) }
					size={ 13 }
					onClick={ onEdit }
				/>
			) }
			<IconButton
				icon={ IconClose }
				label={ __( 'Delete', 'wooreels' ) }
				size={ 13 }
				onClick={ onRemove }
			/>
		</span>
	</li>
);

export const ReelEditor = ( { reelId, onClose, onSaved } ) => {
	const toasts = useToasts();
	const isNew = ! reelId;

	const [ loading, setLoading ] = useState( ! isNew );
	const [ saving, setSaving ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const [ thumbnail, setThumbnail ] = useState( '' );
	const [ files, setFiles ] = useState( [] );
	const [ links, setLinks ] = useState( [] );
	const [ urlSource, setUrlSource ] = useState( '' );
	const [ linkDialog, setLinkDialog ] = useState( null );
	const [ capturing, setCapturing ] = useState( false );
	const [ dropping, setDropping ] = useState( false );
	const [ uploading, setUploading ] = useState( false );

	useEffect( () => {
		if ( isNew ) {
			return undefined;
		}

		let cancelled = false;

		reelsApi
			.get( reelId )
			.then( ( reel ) => {
				if ( cancelled ) {
					return;
				}

				setTitle( reel.title );
				setThumbnail( reel.thumbnail );
				setFiles( reel.files );
				setLinks( reel.links );
			} )
			.catch( ( error ) => toasts.error( error.message ) )
			.finally( () => {
				if ( ! cancelled ) {
					setLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ reelId, isNew, toasts ] );

	const addFiles = ( incoming ) => {
		setFiles( ( current ) => [ ...current, ...incoming ] );
		setUrlSource( '' );
	};

	const pickSource = ( source ) => {
		if ( source === 'library' ) {
			openMediaFrame( addFiles );

			return;
		}

		setUrlSource( source );
	};

	/**
	 * Upload dropped files straight into the media library.
	 *
	 * @param {FileList|File[]} dropped The dropped files.
	 */
	const uploadDropped = async ( dropped ) => {
		const videos = Array.from( dropped ).filter( ( file ) =>
			file.type.startsWith( 'video/' )
		);

		if ( videos.length === 0 ) {
			return;
		}

		setUploading( true );

		for ( const file of videos ) {
			try {
				const body = new FormData();

				body.append( 'file', file, file.name );

				const media = await apiFetch( {
					path: '/wp/v2/media',
					method: 'POST',
					body,
				} );

				addFiles( [
					{
						file_uuid: uuid(),
						wp_media_id: media.id,
						url: media.source_url,
						mime_type: media.mime_type,
						source: 'native',
						provider_id: '',
						poster_url: '',
						duration: 0,
					},
				] );
			} catch ( error ) {
				toasts.error( error.message );
			}
		}

		setUploading( false );
	};

	const moveLink = ( from, to ) => {
		if ( from === to || to < 0 || to >= links.length ) {
			return;
		}

		setLinks( ( current ) => {
			const next = [ ...current ];
			const [ moved ] = next.splice( from, 1 );

			next.splice( to, 0, moved );

			return next;
		} );
	};

	const risky = files
		.filter(
			( file ) => file.source !== 'youtube' && file.source !== 'vimeo'
		)
		.filter( ( file ) => ! SAFARI_SAFE.includes( file.mime_type ) ).length;

	const save = async () => {
		setSaving( true );

		try {
			const payload = { title, thumbnail, links, files };

			if ( isNew ) {
				await reelsApi.create( payload );
				toasts.success(
					__( 'Reel created successfully!', 'wooreels' )
				);
			} else {
				await reelsApi.update( reelId, payload );
				toasts.success(
					__( 'Reel updated successfully!', 'wooreels' )
				);
			}

			onSaved();
		} catch ( error ) {
			toasts.error( error.message );
		} finally {
			setSaving( false );
		}
	};

	const capturable = files.find(
		( file ) => file.source === 'native' || file.source === 'hosted'
	);

	return (
		<>
			<Modal
				wide
				title={
					isNew
						? __( 'Add Reel', 'wooreels' )
						: __( 'Edit', 'wooreels' )
				}
				onClose={ onClose }
				footer={
					<>
						<Button
							variant="ghost"
							onClick={ onClose }
							disabled={ saving }
						>
							{ __( 'Cancel', 'wooreels' ) }
						</Button>
						<Button
							variant="primary"
							busy={ saving }
							disabled={ saving || loading }
							onClick={ save }
						>
							{ isNew
								? __( 'Save', 'wooreels' )
								: __( 'Update', 'wooreels' ) }
						</Button>
					</>
				}
			>
				{ loading ? (
					<p className="wr-field__help">
						<IconSpinner size={ 15 } />
					</p>
				) : (
					<div className="wr-reel-editor">
						<div className="wr-reel-editor__media">
							<div className="wr-reel-editor__bar">
								<span className="wr-section-label">
									{ __( 'Add Videos', 'wooreels' ) }
								</span>
								<SourcePicker onPick={ pickSource } />
							</div>

							<div
								className={ `wr-dropzone${
									dropping ? ' is-over' : ''
								}` }
								onDragOver={ ( event ) => {
									event.preventDefault();
									setDropping( true );
								} }
								onDragLeave={ () => setDropping( false ) }
								onDrop={ ( event ) => {
									event.preventDefault();
									setDropping( false );
									uploadDropped( event.dataTransfer.files );
								} }
							>
								<button
									type="button"
									className="wr-dropzone__hit"
									onClick={ () => pickSource( 'library' ) }
								>
									{ uploading ? (
										<IconSpinner size={ 20 } />
									) : (
										<IconUpload size={ 20 } />
									) }
									<span>
										{ __(
											'Click or drag and drop files here',
											'wooreels'
										) }
									</span>
								</button>
							</div>

							{ files.length > 0 && (
								<ul className="wr-file-list">
									{ files.map( ( file, index ) => (
										<li
											key={ file.file_uuid }
											className="wr-file-row"
										>
											{ file.poster_url ? (
												<img
													className="wr-file-row__thumb"
													src={ file.poster_url }
													alt=""
												/>
											) : (
												<span className="wr-file-row__thumb wr-file-row__thumb--empty">
													<IconVideo size={ 15 } />
												</span>
											) }
											<span className="wr-file-row__text">
												<span className="wr-file-row__url">
													{ file.url }
												</span>
												<span className="wr-file-row__meta">
													{ file.source } ·{ ' ' }
													{ file.mime_type }
												</span>
											</span>
											<IconButton
												icon={ IconTrash }
												label={ __(
													'Delete',
													'wooreels'
												) }
												tone="danger"
												size={ 14 }
												onClick={ () =>
													setFiles(
														files.filter(
															( entry, at ) =>
																at !== index
														)
													)
												}
											/>
										</li>
									) ) }
								</ul>
							) }

							{ risky > 0 && (
								<Notice tone="warning">
									{ sprintf(
										/* translators: %d: number of videos that may not play on Safari. */
										_n(
											'%d video may not play reliably on iOS/macOS Safari. Recommended format: MP4 (H.264/AAC).',
											'%d video(s) may not play reliably on iOS/macOS Safari. Recommended format: MP4 (H.264/AAC).',
											risky,
											'wooreels'
										),
										risky
									) }
								</Notice>
							) }

							<div className="wr-poster">
								<span className="wr-section-label">
									{ __( 'Thumbnail', 'wooreels' ) }
								</span>
								<div className="wr-poster__row">
									<span className="wr-poster__preview">
										{ thumbnail ? (
											<img src={ thumbnail } alt="" />
										) : (
											<IconImage size={ 18 } />
										) }
									</span>
									<div className="wr-poster__tools">
										<Button
											size="sm"
											icon={ IconImage }
											onClick={ () =>
												openPosterFrame( setThumbnail )
											}
										>
											{ __(
												'Choose from Media',
												'wooreels'
											) }
										</Button>
										<Button
											size="sm"
											icon={ IconCamera }
											disabled={ ! capturable }
											onClick={ () =>
												setCapturing( true )
											}
										>
											{ __(
												'Capture frame',
												'wooreels'
											) }
										</Button>
										{ thumbnail && (
											<Button
												size="sm"
												variant="ghost"
												onClick={ () =>
													setThumbnail( '' )
												}
											>
												{ __( 'Clear', 'wooreels' ) }
											</Button>
										) }
									</div>
								</div>
							</div>
						</div>

						<div className="wr-reel-editor__meta">
							<TextField
								label={ __( 'Reel Title', 'wooreels' ) }
								placeholder={ __(
									'Enter reel title',
									'wooreels'
								) }
								value={ title }
								onChange={ setTitle }
							/>

							<div className="wr-reel-editor__links">
								<div className="wr-reel-editor__bar">
									<span className="wr-section-label">
										{ __( 'Links', 'wooreels' ) }
									</span>
									<Button
										size="sm"
										icon={ IconPlus }
										onClick={ () =>
											setLinkDialog( { editing: null } )
										}
									>
										{ __( 'Add Custom Link', 'wooreels' ) }
									</Button>
								</div>

								{ links.length === 0 ? (
									<p className="wr-field__help">
										{ __(
											'Add a button or tag a product and it appears over the video in the player.',
											'wooreels'
										) }
									</p>
								) : (
									<ul className="wr-chips">
										{ links.map( ( link, index ) => (
											<LinkChip
												key={ link.btn_uuid }
												link={ link }
												index={ index }
												onMove={ moveLink }
												onEdit={ () =>
													setLinkDialog( {
														editing: link,
													} )
												}
												onRemove={ () =>
													setLinks(
														links.filter(
															( entry ) =>
																entry.btn_uuid !==
																link.btn_uuid
														)
													)
												}
											/>
										) ) }
									</ul>
								) }
							</div>
						</div>
					</div>
				) }
			</Modal>

			{ urlSource !== '' && (
				<UrlSourcePanel
					source={ urlSource }
					onAdd={ addFiles }
					onClose={ () => setUrlSource( '' ) }
				/>
			) }

			{ linkDialog && (
				<LinkDialog
					editing={ linkDialog.editing }
					onClose={ () => setLinkDialog( null ) }
					onAdd={ ( incoming ) => {
						setLinks( ( current ) => {
							const byUuid = new Map(
								current.map( ( link ) => [
									link.btn_uuid,
									link,
								] )
							);

							incoming.forEach( ( link ) =>
								byUuid.set( link.btn_uuid, link )
							);

							return Array.from( byUuid.values() );
						} );
						setLinkDialog( null );
					} }
				/>
			) }

			{ capturing && capturable && (
				<PosterCapture
					src={ capturable.url }
					onClose={ () => setCapturing( false ) }
					onCaptured={ ( url ) => {
						setThumbnail( url );
						setCapturing( false );
					} }
				/>
			) }
		</>
	);
};
