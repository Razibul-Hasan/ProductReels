/**
 * The reel editor: media on the left, everything about the reel on the right.
 *
 * All four sources produce the same file shape, so the rest of the editor — and
 * the whole player — never has to care where a video came from.
 */

import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { boot, reels as reelsApi } from '../api';
import {
	IconCamera,
	IconChevronDown,
	IconChevronRight,
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

const SOURCE_LABELS = {
	native: __(
		'Media Library',
		'productreels-shoppable-video-reels-for-woocommerce'
	),
	hosted: __(
		'Video URL',
		'productreels-shoppable-video-reels-for-woocommerce'
	),
	vimeo: 'Vimeo',
	youtube: 'YouTube',
};

/**
 * Something readable to call a file: its name for a real file, the provider
 * and id for an embed.
 *
 * @param {Object} file The file.
 * @return {string} The label.
 */
const fileLabel = ( file ) => {
	if ( file.source === 'youtube' || file.source === 'vimeo' ) {
		return `${ SOURCE_LABELS[ file.source ] } · ${ file.provider_id }`;
	}

	try {
		const path = new URL( file.url ).pathname;

		return decodeURIComponent( path.split( '/' ).pop() || file.url );
	} catch ( error ) {
		return file.url;
	}
};

/** The reel-shaped illustration the empty dropzone carries. */
const DropArt = () => (
	<svg
		className="wr-dropzone__art"
		width="96"
		height="84"
		viewBox="0 0 96 84"
		fill="none"
		aria-hidden="true"
		focusable="false"
	>
		<rect
			x="6"
			y="16"
			width="30"
			height="52"
			rx="6"
			fill="currentColor"
			opacity=".12"
		/>
		<rect
			x="60"
			y="16"
			width="30"
			height="52"
			rx="6"
			fill="currentColor"
			opacity=".12"
		/>
		<rect
			x="31"
			y="6"
			width="34"
			height="62"
			rx="7"
			fill="var(--wr-bg)"
			stroke="currentColor"
			strokeWidth="1.6"
		/>
		<path
			d="M48 24v20M40 32l8-8 8 8"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M36 76h24"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			opacity=".5"
		/>
	</svg>
);

/**
 * A small source tile inside the empty dropzone.
 *
 * @param {Object}   props         Props.
 * @param {Function} props.icon    Icon component.
 * @param {string}   props.label   Source name.
 * @param {string}   props.hint    One line on what it accepts.
 * @param {Function} props.onClick Click handler.
 * @return {Object} The tile.
 */
const SourceTile = ( { icon: Icon, label, hint, onClick } ) => (
	<button type="button" className="wr-source-tile" onClick={ onClick }>
		<span className="wr-source-tile__icon">
			<Icon size={ 16 } />
		</span>
		<span className="wr-source-tile__text">
			<span className="wr-source-tile__label">{ label }</span>
			<span className="wr-source-tile__hint">{ hint }</span>
		</span>
	</button>
);

/**
 * The provider or origin of a file, as a pill.
 *
 * @param {Object} props        Props.
 * @param {string} props.source The file's source key.
 * @return {Object} The badge.
 */
const SourceBadge = ( { source } ) => (
	<span className={ `wr-badge wr-badge--${ source }` }>
		{ SOURCE_LABELS[ source ] || source }
	</span>
);

const SOURCES = [
	{
		value: 'library',
		label: __(
			'Choose from Media',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
		icon: IconImage,
	},
	{ value: 'vimeo', label: 'Vimeo', icon: IconVideo },
	{ value: 'youtube', label: 'YouTube Shorts', icon: IconVideo },
	{
		value: 'hosted',
		label: __(
			'Url',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
		icon: IconLink,
	},
];

const URL_SOURCE_COPY = {
	vimeo: {
		placeholder: 'https://vimeo.com/123456789',
		invalid: __(
			'Enter a valid Vimeo video URL.',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
		help: __(
			'Paste one URL per line to add several at once.',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
	},
	youtube: {
		placeholder: 'https://www.youtube.com/shorts/…',
		invalid: __(
			'Enter a valid YouTube Shorts URL.',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
		help: __(
			'Paste one URL per line to add several at once.',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
	},
	hosted: {
		placeholder: 'https://cdn.example.com/reel.mp4',
		invalid: __(
			'Enter a valid video URL.',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
		help: __(
			'For smooth playback across all browsers, use MP4 video URLs.',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
	},
};

/**
 * The poster WordPress knows for a video attachment, if it has a real one.
 *
 * A video with a featured image reports it as `image`; one without reports
 * the generic file-type icon there instead, which is no poster at all.
 *
 * @param {Object} item The attachment, as the media frame serialises it.
 * @return {string} The poster URL, or an empty string.
 */
const attachmentPoster = ( item ) => {
	const src = item.image?.src || '';

	if (
		! src ||
		src === item.icon ||
		src.includes( '/wp-includes/images/' )
	) {
		return '';
	}

	return src;
};

/**
 * Open the WordPress media frame, restricted to video.
 *
 * @param {Function} onPicked Receives the selected attachments.
 */
const openMediaFrame = ( onPicked ) => {
	const frame = window.wp.media( {
		title: __(
			'Add Videos',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
		library: { type: 'video' },
		button: {
			text: __(
				'Add Videos',
				'productreels-shoppable-video-reels-for-woocommerce'
			),
		},
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
					poster_url: attachmentPoster( item ),
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
		title: __(
			'Choose from Media',
			'productreels-shoppable-video-reels-for-woocommerce'
		),
		library: { type: 'image' },
		button: {
			text: __(
				'Choose from Media',
				'productreels-shoppable-video-reels-for-woocommerce'
			),
		},
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
				{ __(
					'Add Videos',
					'productreels-shoppable-video-reels-for-woocommerce'
				) }
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
						{ __(
							'Cancel',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
					</Button>
					{ rows.length === 0 ? (
						<Button
							variant="primary"
							busy={ checking }
							disabled={ checking }
							onClick={ verify }
						>
							{ __(
								'Continue',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</Button>
					) : (
						<Button
							variant="primary"
							disabled={ good === 0 }
							onClick={ accept }
						>
							{ __(
								'Add Videos',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</Button>
					) }
				</>
			}
		>
			<div className="wr-form">
				<div className="wr-field">
					<label className="wr-field__label" htmlFor="wr-url-source">
						{ __(
							'Url',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
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
			{ link.buttonText ||
				__(
					'Button Text',
					'productreels-shoppable-video-reels-for-woocommerce'
				) }
		</span>
		{ link.campaignName && (
			<span className="wr-chip__campaign">{ link.campaignName }</span>
		) }
		<span className="wr-chip__tools">
			<IconButton
				icon={ IconChevronDown }
				label={ __(
					'Move down',
					'productreels-shoppable-video-reels-for-woocommerce'
				) }
				size={ 13 }
				onClick={ () => onMove( index, index + 1 ) }
			/>
			{ link.btn_type === 'custom' && (
				<IconButton
					icon={ IconEdit }
					label={ __(
						'Edit',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
					size={ 13 }
					onClick={ onEdit }
				/>
			) }
			<IconButton
				icon={ IconClose }
				label={ __(
					'Delete',
					'productreels-shoppable-video-reels-for-woocommerce'
				) }
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

	const moveFile = ( from, to ) => {
		if ( from === to || to < 0 || to >= files.length ) {
			return;
		}

		setFiles( ( current ) => {
			const next = [ ...current ];
			const [ moved ] = next.splice( from, 1 );

			next.splice( to, 0, moved );

			return next;
		} );
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

	// A reel with nothing to play, or nothing to click, is not worth keeping:
	// the first missing piece blocks Save and names itself in the footer.
	let blocker = '';

	if ( files.length === 0 ) {
		blocker = __(
			'Add at least one video to save this reel.',
			'productreels-shoppable-video-reels-for-woocommerce'
		);
	} else if ( links.length === 0 ) {
		blocker = __(
			'Add at least one link to save this reel.',
			'productreels-shoppable-video-reels-for-woocommerce'
		);
	}

	const save = async () => {
		if ( blocker ) {
			toasts.error( blocker );

			return;
		}

		setSaving( true );

		try {
			const payload = { title, thumbnail, links, files };
			let saved;

			if ( isNew ) {
				saved = await reelsApi.create( payload );
				toasts.success(
					__(
						'Reel created successfully!',
						'productreels-shoppable-video-reels-for-woocommerce'
					)
				);
			} else {
				saved = await reelsApi.update( reelId, payload );
				toasts.success(
					__(
						'Reel updated successfully!',
						'productreels-shoppable-video-reels-for-woocommerce'
					)
				);
			}

			onSaved( saved );
		} catch ( error ) {
			toasts.error( error.message );
		} finally {
			setSaving( false );
		}
	};

	const capturable = files.find(
		( file ) => file.source === 'native' || file.source === 'hosted'
	);
	const lead = files[ 0 ] || null;
	const leadPlayable =
		lead && ( lead.source === 'native' || lead.source === 'hosted' );
	const leadPoster = thumbnail || ( lead && lead.poster_url ) || '';

	const dragHandlers = {
		onDragOver: ( event ) => {
			event.preventDefault();
			setDropping( true );
		},
		onDragLeave: () => setDropping( false ),
		onDrop: ( event ) => {
			event.preventDefault();
			setDropping( false );
			uploadDropped( event.dataTransfer.files );
		},
	};

	return (
		<>
			<Modal
				size="xl"
				title={
					isNew
						? __(
								'Add Reel',
								'productreels-shoppable-video-reels-for-woocommerce'
							)
						: __(
								'Edit reel',
								'productreels-shoppable-video-reels-for-woocommerce'
							)
				}
				onClose={ onClose }
				footer={
					<>
						<span
							className={ `wr-modal__foot-note${
								blocker ? ' is-blocking' : ''
							}` }
						>
							{ blocker
								? blocker
								: sprintf(
										/* translators: 1: number of videos, 2: number of links. */
										__(
											'%1$s · %2$s',
											'productreels-shoppable-video-reels-for-woocommerce'
										),
										sprintf(
											/* translators: %d: number of videos. */
											_n(
												'%d video',
												'%d videos',
												files.length,
												'productreels-shoppable-video-reels-for-woocommerce'
											),
											files.length
										),
										sprintf(
											/* translators: %d: number of links. */
											_n(
												'%d link',
												'%d links',
												links.length,
												'productreels-shoppable-video-reels-for-woocommerce'
											),
											links.length
										)
									) }
						</span>
						<Button
							variant="ghost"
							onClick={ onClose }
							disabled={ saving }
						>
							{ __(
								'Cancel',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</Button>
						<Button
							variant="primary"
							busy={ saving }
							disabled={ saving || loading || blocker !== '' }
							onClick={ save }
						>
							{ isNew
								? __(
										'Save',
										'productreels-shoppable-video-reels-for-woocommerce'
									)
								: __(
										'Update',
										'productreels-shoppable-video-reels-for-woocommerce'
									) }
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
						<div
							className={ `wr-reel-editor__media${
								dropping ? ' is-over' : ''
							}` }
							{ ...dragHandlers }
						>
							<div className="wr-reel-editor__bar">
								<span className="wr-section-label">
									{ __(
										'Video',
										'productreels-shoppable-video-reels-for-woocommerce'
									) }
								</span>
								{ files.length > 0 && (
									<SourcePicker onPick={ pickSource } />
								) }
							</div>

							{ files.length === 0 && (
								<div
									className={ `wr-dropzone wr-dropzone--hero${
										dropping ? ' is-over' : ''
									}` }
								>
									<button
										type="button"
										className="wr-dropzone__hit"
										onClick={ () =>
											pickSource( 'library' )
										}
									>
										{ uploading ? (
											<IconSpinner size={ 28 } />
										) : (
											<DropArt />
										) }
										<span className="wr-dropzone__title">
											{ uploading
												? __(
														'Uploading…',
														'productreels-shoppable-video-reels-for-woocommerce'
													)
												: __(
														'Add Videos',
														'productreels-shoppable-video-reels-for-woocommerce'
													) }
										</span>
										<span className="wr-dropzone__text">
											{ __(
												'Click or drag and drop files here',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
										</span>
									</button>

									<div className="wr-source-tiles">
										<SourceTile
											icon={ IconUpload }
											label={ __(
												'Media Library',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
											hint={ __(
												'MP4 or WebM from this site',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
											onClick={ () =>
												pickSource( 'library' )
											}
										/>
										<SourceTile
											icon={ IconVideo }
											label="Vimeo"
											hint={ __(
												'Paste video links',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
											onClick={ () =>
												pickSource( 'vimeo' )
											}
										/>
										<SourceTile
											icon={ IconVideo }
											label="YouTube Shorts"
											hint={ __(
												'Paste Shorts links',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
											onClick={ () =>
												pickSource( 'youtube' )
											}
										/>
										<SourceTile
											icon={ IconLink }
											label={ __(
												'Video URL',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
											hint={ __(
												'Hosted MP4 or WebM',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
											onClick={ () =>
												pickSource( 'hosted' )
											}
										/>
									</div>
								</div>
							) }

							{ files.length > 0 && (
								<div className="wr-media-stage">
									<div className="wr-media-stage__preview">
										{ leadPlayable && (
											<video
												key={ lead.file_uuid }
												className="wr-media-stage__video"
												src={ lead.url }
												poster={
													leadPoster || undefined
												}
												controls
												muted
												playsInline
												preload="metadata"
											/>
										) }
										{ ! leadPlayable && leadPoster && (
											<img
												className="wr-media-stage__img"
												src={ leadPoster }
												alt=""
											/>
										) }
										{ ! leadPlayable && ! leadPoster && (
											<span className="wr-media-stage__blank">
												<IconVideo size={ 28 } />
											</span>
										) }
										<span className="wr-media-stage__badge">
											<SourceBadge
												source={ lead.source }
											/>
										</span>
									</div>

									<div className="wr-media-stage__side">
										<ul className="wr-file-list">
											{ files.map( ( file, index ) => (
												<li
													key={ file.file_uuid }
													className={ `wr-file-row${
														index === 0
															? ' is-lead'
															: ''
													}` }
												>
													{ file.poster_url ? (
														<img
															className="wr-file-row__thumb"
															src={
																file.poster_url
															}
															alt=""
														/>
													) : (
														<span className="wr-file-row__thumb wr-file-row__thumb--empty">
															<IconVideo
																size={ 15 }
															/>
														</span>
													) }
													<span className="wr-file-row__text">
														<span className="wr-file-row__name">
															{ fileLabel(
																file
															) }
														</span>
														<span className="wr-file-row__meta">
															<SourceBadge
																source={
																	file.source
																}
															/>
															{ file.duration >
																0 && (
																<span>
																	{
																		file.duration
																	}
																	s
																</span>
															) }
														</span>
													</span>
													<span className="wr-file-row__tools">
														<IconButton
															icon={
																IconChevronDown
															}
															label={ __(
																'Move down',
																'productreels-shoppable-video-reels-for-woocommerce'
															) }
															size={ 13 }
															disabled={
																index ===
																files.length - 1
															}
															onClick={ () =>
																moveFile(
																	index,
																	index + 1
																)
															}
														/>
														<IconButton
															icon={ IconTrash }
															label={ __(
																'Delete',
																'productreels-shoppable-video-reels-for-woocommerce'
															) }
															tone="danger"
															size={ 14 }
															onClick={ () =>
																setFiles(
																	files.filter(
																		(
																			entry,
																			at
																		) =>
																			at !==
																			index
																	)
																)
															}
														/>
													</span>
												</li>
											) ) }
										</ul>

										<div
											className={ `wr-dropzone wr-dropzone--compact${
												dropping ? ' is-over' : ''
											}` }
										>
											<button
												type="button"
												className="wr-dropzone__hit"
												onClick={ () =>
													pickSource( 'library' )
												}
											>
												{ uploading ? (
													<IconSpinner size={ 16 } />
												) : (
													<IconPlus size={ 16 } />
												) }
												<span>
													{ uploading
														? __(
																'Uploading…',
																'productreels-shoppable-video-reels-for-woocommerce'
															)
														: __(
																'Add more videos, or drop them here',
																'productreels-shoppable-video-reels-for-woocommerce'
															) }
												</span>
											</button>
										</div>

										{ risky > 0 && (
											<Notice tone="warning">
												{ sprintf(
													/* translators: %d: number of videos that may not play on Safari. */
													_n(
														'%d video may not play reliably on iOS/macOS Safari. Recommended format: MP4 (H.264/AAC).',
														'%d video(s) may not play reliably on iOS/macOS Safari. Recommended format: MP4 (H.264/AAC).',
														risky,
														'productreels-shoppable-video-reels-for-woocommerce'
													),
													risky
												) }
											</Notice>
										) }
									</div>
								</div>
							) }
						</div>

						<div className="wr-reel-editor__meta">
							<TextField
								label={ __(
									'Reel Title',
									'productreels-shoppable-video-reels-for-woocommerce'
								) }
								placeholder={ __(
									'Enter reel title',
									'productreels-shoppable-video-reels-for-woocommerce'
								) }
								value={ title }
								onChange={ setTitle }
							/>

							<div className="wr-poster-card">
								<div className="wr-reel-editor__bar">
									<span className="wr-section-label">
										{ __(
											'Thumbnail',
											'productreels-shoppable-video-reels-for-woocommerce'
										) }
									</span>
									{ thumbnail && (
										<Button
											size="sm"
											variant="ghost"
											onClick={ () => setThumbnail( '' ) }
										>
											{ __(
												'Clear',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
										</Button>
									) }
								</div>

								<div className="wr-poster-card__row">
									<button
										type="button"
										className={ `wr-poster-card__frame${
											thumbnail ? ' has-image' : ''
										}` }
										aria-label={ __(
											'Choose from Media',
											'productreels-shoppable-video-reels-for-woocommerce'
										) }
										onClick={ () =>
											openPosterFrame( setThumbnail )
										}
									>
										{ thumbnail ? (
											<img src={ thumbnail } alt="" />
										) : (
											<>
												<IconImage size={ 22 } />
												<span>
													{ __(
														'Upload',
														'productreels-shoppable-video-reels-for-woocommerce'
													) }
												</span>
											</>
										) }
									</button>

									<div className="wr-poster-card__tools">
										<Button
											size="sm"
											icon={ IconImage }
											onClick={ () =>
												openPosterFrame( setThumbnail )
											}
										>
											{ __(
												'Choose from Media',
												'productreels-shoppable-video-reels-for-woocommerce'
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
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
										</Button>
										<p className="wr-field__help">
											{ __(
												'Shown before the video plays. Without one, the first frame is used.',
												'productreels-shoppable-video-reels-for-woocommerce'
											) }
										</p>
									</div>
								</div>
							</div>

							<div className="wr-reel-editor__links">
								<div className="wr-reel-editor__bar">
									<span className="wr-section-label">
										{ __(
											'Links',
											'productreels-shoppable-video-reels-for-woocommerce'
										) }
									</span>
									{ links.length > 0 && (
										<span className="wr-count-chip">
											{ links.length }
										</span>
									) }
								</div>

								<div className="wr-link-actions">
									<Button
										className="wr-btn--outline"
										icon={ IconLink }
										onClick={ () =>
											setLinkDialog( {
												editing: null,
												tab: 'custom',
											} )
										}
									>
										{ __(
											'Add Custom Link',
											'productreels-shoppable-video-reels-for-woocommerce'
										) }
										<IconChevronRight
											size={ 13 }
											className="wr-btn__end"
										/>
									</Button>
									<Button
										className="wr-btn--outline"
										icon={ IconTag }
										disabled={ ! boot.hasWoo }
										onClick={ () =>
											setLinkDialog( {
												editing: null,
												tab: 'product',
											} )
										}
									>
										{ __(
											'Tag Products',
											'productreels-shoppable-video-reels-for-woocommerce'
										) }
										<IconChevronRight
											size={ 13 }
											className="wr-btn__end"
										/>
									</Button>
								</div>

								{ ! boot.hasWoo && (
									<p className="wr-field__help">
										{ __(
											'Product tagging needs WooCommerce to be active.',
											'productreels-shoppable-video-reels-for-woocommerce'
										) }
									</p>
								) }

								{ links.length === 0 ? (
									<p className="wr-field__help">
										{ __(
											'Add a button or tag a product and it appears over the video in the player.',
											'productreels-shoppable-video-reels-for-woocommerce'
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
														tab: 'custom',
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
					initialTab={ linkDialog.tab }
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
