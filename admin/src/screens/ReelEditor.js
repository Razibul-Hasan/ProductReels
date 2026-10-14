/**
 * The reel sheet: add or edit one reel.
 *
 * A wide dialog. On the left the reel in the storefront player, compact and
 * live: every change to the form shows there at once. On the right, top to
 * bottom: Video (where the clips come from, their order), Title, Cover (a
 * frame from the video or any image) and Shop this reel (tagged products and
 * buttons, each picked in a dialog over the sheet).
 *
 * The saved payload is 1.0.0's: { title, thumbnail, links, files }, with the
 * same file and link shapes, through the same REST calls. A reel still needs
 * a video and a product or button; Save stays enabled and the footer says
 * what's missing, and Save moves focus to the first gap. A picked frame is
 * captured and uploaded to the media library only when the reel is saved.
 *
 * Opened from Reels (Add reel, a card), Widgets (Add reel, top reels, the
 * first-run guide) and the widget editor. Props: `reelId` (0 or missing for
 * a new reel), `onClose`, `onSaved( reel )`.
 */

import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { formatClock } from '@shared/format';
import { CompactPlayer } from '@shared/player/CompactPlayer';
import { Icon } from '@shared/Icon';
import { boot, products as productsApi, reels as reelsApi } from '../api';
import {
	Button,
	ConfirmDialog,
	Dialog,
	Filmstrip,
	LinkForm,
	Notice,
	ProductPicker,
	ShopLinks,
	Skeleton,
	SourcePicker,
	TextField,
	VideoList,
	linkDraft,
	useToasts,
	validateLink,
} from '../components/pr';
import { formatNumber } from '../format';
import {
	fileLabel,
	formatSize,
	frameGrabber,
	isAllowedVideo,
	libraryFile,
	openImageFrame,
	openVideoFrame,
	playsIn,
	saveFrame,
	uploadMedia,
} from '../media';
import { editorServices } from '../preview-services';
import { uuid } from '../uuid';

const TITLE_ID = 'pr-reel-title';

const SOURCE_META = {
	native: { icon: 'success', label: __( 'Uploaded', 'productreels' ) },
	youtube: { icon: 'youtube', label: __( 'YouTube Shorts', 'productreels' ) },
	vimeo: { icon: 'video', label: __( 'Vimeo', 'productreels' ) },
	hosted: { icon: 'link', label: __( 'Video link', 'productreels' ) },
};

const isEmbed = ( file ) =>
	file.source === 'youtube' || file.source === 'vimeo';

const snapshot = ( title, thumbnail, files, links ) =>
	JSON.stringify( { title, thumbnail, files, links } );

/**
 * The clip's cover in the list: its poster, else its first frame.
 *
 * @param {Object} props        Props.
 * @param {string} props.src    The video URL, for a first frame.
 * @param {string} props.poster The poster URL, if there is one.
 */
const VideoThumb = ( { src, poster } ) => {
	if ( poster ) {
		return <img src={ poster } alt="" loading="lazy" />;
	}

	if ( src ) {
		return (
			<video
				src={ `${ src }#t=0.1` }
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
 * Why some files were not added.
 *
 * @param {string[]} names The refused file names.
 * @return {string} The message, or an empty string.
 */
const refusedMessage = ( names ) => {
	if ( names.length === 0 ) {
		return '';
	}

	if ( names.length === 1 ) {
		return sprintf(
			/* translators: %s: file name. */
			__(
				'“%s” is not a video. Choose a video file instead.',
				'productreels'
			),
			names[ 0 ]
		);
	}

	return sprintf(
		/* translators: %s: number of files. */
		_n(
			'%s file is not a video and was not added.',
			'%s files are not videos and were not added.',
			names.length,
			'productreels'
		),
		formatNumber( names.length )
	);
};

export const ReelEditor = ( { reelId, onClose, onSaved } ) => {
	const toasts = useToasts();
	const isNew = ! reelId;
	const wooActive = !! boot.hasWoo;

	const [ loading, setLoading ] = useState( ! isNew );
	const [ loadFailed, setLoadFailed ] = useState( false );
	const [ attempt, setAttempt ] = useState( 0 );
	const [ title, setTitle ] = useState( '' );
	const [ thumbnail, setThumbnail ] = useState( '' );
	const [ files, setFiles ] = useState( [] );
	const [ links, setLinks ] = useState( [] );
	const [ viewCount, setViewCount ] = useState( 0 );
	const [ pick, setPick ] = useState( null );
	const [ uploads, setUploads ] = useState( [] );
	const [ sizes, setSizes ] = useState( {} );
	const [ adding, setAdding ] = useState( false );
	const [ uploadError, setUploadError ] = useState( '' );
	const [ productCache, setProductCache ] = useState( {} );
	const [ tagging, setTagging ] = useState( null );
	const [ button, setButton ] = useState( null );
	const [ discarding, setDiscarding ] = useState( false );
	const [ saving, setSaving ] = useState( false );

	const initial = useRef( snapshot( '', '', [], [] ) );
	const aborts = useRef( new Map() );
	const sourceRef = useRef( null );
	const tagRef = useRef( null );
	const focusAfter = useRef( null );

	/* ---------------------------------------------------------- loading */

	useEffect( () => {
		if ( isNew ) {
			return undefined;
		}

		let cancelled = false;

		setLoading( true );
		setLoadFailed( false );

		reelsApi
			.get( reelId )
			.then( ( reel ) => {
				if ( cancelled ) {
					return;
				}

				const nextFiles = reel.files || [];
				const nextLinks = Array.isArray( reel.links ) ? reel.links : [];

				setTitle( reel.title || '' );
				setThumbnail( reel.thumbnail || '' );
				setFiles( nextFiles );
				setLinks( nextLinks );
				setViewCount( reel.view_count || 0 );
				initial.current = snapshot(
					reel.title || '',
					reel.thumbnail || '',
					nextFiles,
					nextLinks
				);
				setLoading( false );
				focusAfter.current = 'title';
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setLoadFailed( true );
					setLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ reelId, isNew, attempt ] );

	// The dialog focuses its first control on open; a new reel starts at its
	// video, a loaded one at its title.
	useEffect( () => {
		if ( isNew ) {
			focusAfter.current = 'source';
		}
	}, [ isNew ] );

	useEffect( () => {
		const want = focusAfter.current;

		if ( ! want ) {
			return;
		}

		focusAfter.current = null;

		const { activeElement } = document;
		let node = null;

		if ( want === 'title' ) {
			node = document.getElementById( TITLE_ID );
		} else if ( want === 'source' ) {
			node = sourceRef.current?.querySelector(
				'[role="radio"][tabindex="0"]'
			);
		} else if ( ! activeElement || activeElement === document.body ) {
			// Only when the control that had focus has just gone: an upload
			// finishing in the background must not pull focus away.
			node = document.querySelector( '.pr-reelsheet .pr-sheet__more' );
		}

		node?.focus();
	} );

	// Uploads still running when the sheet closes are cancelled.
	useEffect( () => () => aborts.current.forEach( ( abort ) => abort() ), [] );

	/* ----------------------------------------------------------- videos */

	const addFiles = ( incoming, bytes = {} ) => {
		if ( incoming.length === 0 ) {
			return;
		}

		setFiles( ( current ) => [ ...current, ...incoming ] );
		setSizes( ( current ) => ( { ...current, ...bytes } ) );
		setAdding( false );
		// The picker closes; if focus was in it, it lands on its button.
		focusAfter.current = 'more';
	};

	const chooseLibrary = () =>
		openVideoFrame( ( { items, rejected } ) => {
			const bytes = {};

			items.forEach( ( item ) => {
				bytes[ item.file.file_uuid ] = item.size;
			} );
			setUploadError( refusedMessage( rejected ) );
			addFiles(
				items.map( ( item ) => item.file ),
				bytes
			);
		} );

	const uploadFiles = ( list ) => {
		const all = Array.from( list || [] );
		const allowed = all.filter( isAllowedVideo );

		setUploadError(
			refusedMessage(
				all
					.filter( ( file ) => ! isAllowedVideo( file ) )
					.map( ( file ) => file.name )
			)
		);

		allowed.forEach( ( file ) => {
			const key = uuid();
			const preview = URL.createObjectURL( file );

			setUploads( ( current ) => [
				...current,
				{ key, name: file.name, progress: 0, preview },
			] );

			const { promise, abort } = uploadMedia( file, ( progress ) =>
				setUploads( ( current ) =>
					current.map( ( entry ) =>
						entry.key === key ? { ...entry, progress } : entry
					)
				)
			);

			aborts.current.set( key, abort );

			promise
				.then( ( media ) => {
					const entry = libraryFile( media );

					addFiles( [ entry ], { [ entry.file_uuid ]: file.size } );
				} )
				.catch( ( error ) => {
					if ( error.message !== 'aborted' ) {
						toasts.error(
							sprintf(
								/* translators: 1: file name, 2: what went wrong. */
								__(
									'“%1$s” did not upload. %2$s',
									'productreels'
								),
								file.name,
								error.message
							)
						);
					}
				} )
				.finally( () => {
					aborts.current.delete( key );
					URL.revokeObjectURL( preview );
					setUploads( ( current ) =>
						current.filter( ( entry ) => entry.key !== key )
					);
				} );
		} );
	};

	// Same rules as 1.0.0: the server must recognise every link, and a
	// YouTube or Vimeo box only takes its own provider's links.
	const addLinks = async ( source, urls ) => {
		const results = await Promise.all(
			urls.map( async ( url ) => {
				try {
					const result = await reelsApi.validateUrl( url, source );

					if ( source !== 'hosted' && result.source !== source ) {
						return null;
					}

					return { url, result };
				} catch ( error ) {
					return null;
				}
			} )
		);

		const refused = results
			.map( ( row, index ) => ( row ? -1 : index ) )
			.filter( ( index ) => index >= 0 );

		if ( refused.length === 0 ) {
			addFiles(
				results.map( ( { url, result } ) => ( {
					file_uuid: uuid(),
					wp_media_id: 0,
					url,
					mime_type: result.mime_type,
					source: result.source,
					provider_id: result.provider_id,
					poster_url: result.poster_url,
					duration: result.duration,
				} ) )
			);
		}

		return refused;
	};

	const moveFile = ( from, to ) =>
		setFiles( ( current ) => {
			if ( to < 0 || to >= current.length ) {
				return current;
			}

			const next = [ ...current ];
			const [ moved ] = next.splice( from, 1 );

			next.splice( to, 0, moved );

			return next;
		} );

	const removeRow = ( index ) => {
		if ( index < files.length ) {
			if ( files.length + uploads.length === 1 ) {
				focusAfter.current = 'source';
			}

			setFiles( files.filter( ( entry, at ) => at !== index ) );

			return;
		}

		const upload = uploads[ index - files.length ];

		aborts.current.get( upload?.key )?.();
	};

	/* ------------------------------------------------------------ cover */

	const captureFile = files.find(
		( file ) => file.source === 'native' || file.source === 'hosted'
	);
	const captureSrc = captureFile ? captureFile.url : '';
	const provider =
		! captureFile && files[ 0 ] && isEmbed( files[ 0 ] )
			? files[ 0 ].source
			: null;
	// A picked frame belongs to the clip it came from: it stays the cover
	// when the clips are reordered, and goes only with that clip.
	useEffect( () => {
		if ( pick && ! files.some( ( file ) => file.url === pick.src ) ) {
			setPick( null );
		}
	}, [ files, pick ] );

	let cover = { kind: 'first' };

	if ( pick && pick.src === captureSrc ) {
		cover = { kind: 'frame', time: pick.time };
	} else if ( pick || thumbnail ) {
		cover = { kind: 'image' };
	}

	const coverSrc = pick
		? pick.preview
		: thumbnail || ( files[ 0 ] && files[ 0 ].poster_url ) || '';

	/* ------------------------------------------------------------ links */

	const productIds = links
		.filter( ( link ) => link.btn_type === 'product' )
		.map( ( link ) => Number( link.product_id ) );
	const missingIds = productIds.filter( ( id ) => ! ( id in productCache ) );
	const missingKey = missingIds.join( ',' );

	useEffect( () => {
		if ( ! wooActive || missingKey === '' ) {
			return undefined;
		}

		let cancelled = false;
		const ids = missingKey.split( ',' ).map( Number );

		productsApi
			.batch( ids )
			.then( ( list ) => {
				if ( cancelled ) {
					return;
				}

				const found = {};

				ids.forEach( ( id ) => {
					found[ id ] = null;
				} );
				( list || [] ).forEach( ( product ) => {
					found[ Number( product.id ) ] = product;
				} );
				setProductCache( ( current ) => ( { ...current, ...found } ) );
			} )
			.catch( () => {} );

		return () => {
			cancelled = true;
		};
	}, [ missingKey, wooActive ] );

	const moveLink = ( from, to ) =>
		setLinks( ( current ) => {
			if ( to < 0 || to >= current.length ) {
				return current;
			}

			const next = [ ...current ];
			const [ moved ] = next.splice( from, 1 );

			next.splice( to, 0, moved );

			return next;
		} );

	const openTagging = () => {
		const chosen = new Map();

		links
			.filter( ( link ) => link.btn_type === 'product' )
			.forEach( ( link ) => {
				const id = Number( link.product_id );

				chosen.set(
					id,
					productCache[ id ] || { id, name: link.buttonText }
				);
			} );

		setTagging( { chosen, before: chosen.size } );
	};

	const toggleProduct = ( product ) =>
		setTagging( ( current ) => {
			const chosen = new Map( current.chosen );

			if ( chosen.has( product.id ) ) {
				chosen.delete( product.id );
			} else {
				chosen.set( product.id, product );
			}

			return { ...current, chosen };
		} );

	// Products still ticked keep their link (and its btn_uuid, so their clicks
	// keep counting); unticked ones go; new ones join at the end.
	const confirmTagging = () => {
		const { chosen } = tagging;
		const known = {};

		chosen.forEach( ( product, id ) => {
			if ( product.price_html !== undefined ) {
				known[ id ] = product;
			}
		} );

		setProductCache( ( current ) => ( { ...current, ...known } ) );
		setLinks( ( current ) => {
			const kept = current.filter(
				( link ) =>
					link.btn_type !== 'product' ||
					chosen.has( Number( link.product_id ) )
			);
			const have = new Set(
				kept
					.filter( ( link ) => link.btn_type === 'product' )
					.map( ( link ) => Number( link.product_id ) )
			);
			const added = Array.from( chosen.values() )
				.filter( ( product ) => ! have.has( product.id ) )
				.map( ( product ) => ( {
					btn_type: 'product',
					btn_uuid: uuid(),
					product_id: product.id,
					buttonText: product.name,
				} ) );

			return [ ...kept, ...added ];
		} );
		setTagging( null );
	};

	const openButton = ( link = null ) =>
		setButton( { link, draft: linkDraft( link ), errors: {} } );

	const confirmButton = () => {
		const errors = validateLink( button.draft );

		if ( Object.keys( errors ).length > 0 ) {
			setButton( { ...button, errors } );
			window.requestAnimationFrame( () =>
				document
					.querySelector( '.pr-linkdialog [aria-invalid="true"]' )
					?.focus()
			);

			return;
		}

		const { draft, link } = button;
		const next = {
			btn_type: 'custom',
			// An edit keeps the original key so its click history survives.
			btn_uuid: link?.btn_uuid || uuid(),
			buttonText: draft.buttonText.trim(),
			buttonUrl: draft.buttonUrl.trim(),
			openInNewTab: draft.openInNewTab,
			campaignName: draft.campaignName.trim(),
			customClass: draft.customClass.trim(),
		};

		setLinks( ( current ) =>
			link
				? current.map( ( entry ) =>
						entry.btn_uuid === link.btn_uuid ? next : entry
					)
				: [ ...current, next ]
		);
		setButton( null );
	};

	/* ------------------------------------------------------ save, close */

	const dirty =
		snapshot( title, thumbnail, files, links ) !== initial.current ||
		pick !== null ||
		uploads.length > 0;

	let missing = '';

	if ( files.length === 0 && links.length === 0 ) {
		missing = __(
			'Add a video and a product or button to save this reel.',
			'productreels'
		);
	} else if ( files.length === 0 ) {
		missing = __( 'Add a video to save this reel.', 'productreels' );
	} else if ( links.length === 0 ) {
		missing = __(
			'Add a product or button to save this reel.',
			'productreels'
		);
	}

	let note = isNew
		? ''
		: __(
				'Changes show up in every widget that uses this reel.',
				'productreels'
			);
	let noteTone;

	if ( uploads.length > 0 ) {
		note = __(
			'Wait for the upload to finish to save this reel.',
			'productreels'
		);
		noteTone = 'warn';
	} else if ( missing && ! loading && ! loadFailed ) {
		note = missing;
		noteTone = 'warn';
	}

	// With no clips the source picker is always on screen.
	const focusFirstProblem = () => {
		if ( files.length === 0 ) {
			sourceRef.current
				?.querySelector( '[role="radio"][tabindex="0"]' )
				?.focus();

			return;
		}

		tagRef.current?.focus();
	};

	const save = async () => {
		if ( loading || loadFailed || uploads.length > 0 ) {
			return;
		}

		if ( missing ) {
			focusFirstProblem();

			return;
		}

		setSaving( true );

		try {
			let coverUrl = thumbnail;

			if ( pick ) {
				const grab = frameGrabber( pick.src );

				try {
					coverUrl = await saveFrame( await grab.grab( pick.time ) );
				} catch ( error ) {
					throw new Error(
						__(
							'The cover frame could not be saved. Upload a cover image instead.',
							'productreels'
						)
					);
				} finally {
					grab.destroy();
				}
			}

			const payload = { title, thumbnail: coverUrl, links, files };
			const saved = isNew
				? await reelsApi.create( payload )
				: await reelsApi.update( reelId, payload );

			toasts.success( __( 'Reel saved', 'productreels' ) );
			onSaved( saved );
		} catch ( error ) {
			toasts.error( error.message );
			setSaving( false );
		}
	};

	const requestClose = () => {
		if ( saving ) {
			return;
		}

		if ( dirty ) {
			setDiscarding( true );
		} else {
			onClose();
		}
	};

	/* ----------------------------------------------------------- render */

	const previewStyles = useMemo(
		() => ( { ...( boot.defaults || {} ), playWithSound: false } ),
		[]
	);
	const previewReel = useMemo(
		() => ( {
			id: reelId || 0,
			title,
			thumbnail: pick ? pick.preview : thumbnail,
			links,
			files,
			view_count: viewCount,
		} ),
		[ reelId, title, pick, thumbnail, links, files, viewCount ]
	);

	const rows = [
		...files.map( ( file ) => {
			const meta = SOURCE_META[ file.source ] || SOURCE_META.hosted;
			let text = meta.label;

			if ( file.source === 'native' && sizes[ file.file_uuid ] ) {
				text = sprintf(
					/* translators: %s: file size, like 8.4 MB. */
					__( 'Uploaded, %s', 'productreels' ),
					formatSize( sizes[ file.file_uuid ] )
				);
			} else if ( file.duration > 0 ) {
				text = `${ meta.label }, ${ formatClock( file.duration ) }`;
			}

			return {
				key: file.file_uuid,
				name: fileLabel( file ),
				thumb: (
					<VideoThumb
						poster={ file.poster_url }
						src={ isEmbed( file ) ? '' : file.url }
					/>
				),
				icon: meta.icon,
				meta: text,
			};
		} ),
		...uploads.map( ( upload ) => ( {
			key: upload.key,
			name: upload.name,
			thumb: <VideoThumb src={ upload.preview } />,
			progress: upload.progress,
			meta: sprintf(
				/* translators: %s: percentage uploaded, a whole number. */
				__( 'Uploading, %s%%', 'productreels' ),
				upload.progress
			),
		} ) ),
	];

	// Any video format may be added, so say plainly which ones shoppers may
	// not be able to watch: some only play in some browsers, and some (AVI,
	// WMV, FLV, MPEG) play in none until they are converted.
	const unplayable = files.filter(
		( file ) => ! isEmbed( file ) && playsIn( file.mime_type ) === 'none'
	).length;
	const risky = files.filter(
		( file ) => ! isEmbed( file ) && playsIn( file.mime_type ) === 'some'
	).length;

	const products = {};

	productIds.forEach( ( id ) => {
		products[ id ] = productCache[ id ];
	} );

	let form;

	if ( loading ) {
		form = (
			<div className="pr-sheet__form">
				<Skeleton
					count={ 4 }
					label={ __( 'Loading reel…', 'productreels' ) }
				/>
			</div>
		);
	} else if ( loadFailed ) {
		form = (
			<div className="pr-sheet__form">
				<Notice
					tone="danger"
					title={ __(
						"This reel couldn't be loaded",
						'productreels'
					) }
					actions={
						<Button
							size="sm"
							onClick={ () => setAttempt( attempt + 1 ) }
						>
							{ __( 'Try again', 'productreels' ) }
						</Button>
					}
				>
					{ __(
						'Check your connection, then try again.',
						'productreels'
					) }
				</Notice>
			</div>
		);
	} else {
		form = (
			<div className="pr-sheet__form">
				<section
					className="pr-sheet__section"
					aria-labelledby="pr-reel-video"
				>
					<div className="pr-sheet__sechead">
						<h3 className="pr-t-heading" id="pr-reel-video">
							{ __( 'Video', 'productreels' ) }
						</h3>
						{ files.length > 0 && (
							<span className="pr-t-small pr-muted">
								{ sprintf(
									/* translators: %s: number of clips. */
									_n(
										'%s clip',
										'%s clips',
										files.length,
										'productreels'
									),
									formatNumber( files.length )
								) }
							</span>
						) }
					</div>
					{ rows.length > 0 && (
						<VideoList
							items={ rows }
							onMove={ moveFile }
							onRemove={ removeRow }
						/>
					) }
					{ unplayable > 0 && (
						<Notice tone="warn">
							{ sprintf(
								/* translators: %s: number of videos. */
								_n(
									'%s video is in a format browsers can’t play, so shoppers won’t see it. Convert it to MP4 (H.264), which plays everywhere.',
									'%s videos are in a format browsers can’t play, so shoppers won’t see them. Convert them to MP4 (H.264), which plays everywhere.',
									unplayable,
									'productreels'
								),
								formatNumber( unplayable )
							) }
						</Notice>
					) }
					{ risky > 0 && (
						<Notice tone="warn">
							{ sprintf(
								/* translators: %s: number of videos. */
								_n(
									'%s video may not play in every browser, such as on iPhones. MP4 (H.264) plays everywhere.',
									'%s videos may not play in every browser, such as on iPhones. MP4 (H.264) plays everywhere.',
									risky,
									'productreels'
								),
								formatNumber( risky )
							) }
						</Notice>
					) }
					{ rows.length === 0 || adding ? (
						<SourcePicker
							focusRef={ sourceRef }
							uploadError={ uploadError }
							onChooseLibrary={ chooseLibrary }
							onDropFiles={ uploadFiles }
							onAddLinks={ addLinks }
						/>
					) : (
						<Button
							size="sm"
							variant="ghost"
							icon="plus"
							className="pr-sheet__more"
							onClick={ () => {
								focusAfter.current = 'source';
								setAdding( true );
							} }
						>
							{ __( 'Add another video', 'productreels' ) }
						</Button>
					) }
				</section>

				<section className="pr-sheet__section">
					<TextField
						id={ TITLE_ID }
						label={ __( 'Title', 'productreels' ) }
						placeholder={ __( 'Untitled reel', 'productreels' ) }
						help={ __(
							'Shown on the thumbnail when the reel has no product or button.',
							'productreels'
						) }
						value={ title }
						onChange={ ( event ) => setTitle( event.target.value ) }
					/>
				</section>

				<section
					className="pr-sheet__section"
					aria-labelledby="pr-reel-cover"
				>
					<div className="pr-sheet__sechead">
						<h3 className="pr-t-heading" id="pr-reel-cover">
							{ __( 'Cover', 'productreels' ) }
						</h3>
					</div>
					<Filmstrip
						src={ captureSrc }
						provider={ provider }
						cover={ cover }
						coverSrc={ coverSrc }
						onPick={ ( time, preview ) =>
							setPick( { time, preview, src: captureSrc } )
						}
						onUploadImage={ () =>
							openImageFrame( ( url ) => {
								setPick( null );
								setThumbnail( url );
							} )
						}
						onUseFirstFrame={ () => {
							setPick( null );
							setThumbnail( '' );
						} }
					/>
				</section>

				<section
					className="pr-sheet__section"
					aria-labelledby="pr-reel-shop"
				>
					<div className="pr-sheet__sechead">
						<h3 className="pr-t-heading" id="pr-reel-shop">
							{ __( 'Shop this reel', 'productreels' ) }
						</h3>
						<span className="pr-t-small pr-muted">
							{ __( 'Shown over the video', 'productreels' ) }
						</span>
					</div>
					<ShopLinks
						ref={ tagRef }
						links={ links }
						products={ products }
						wooActive={ wooActive }
						onTag={ openTagging }
						onAddButton={ () => openButton() }
						onEdit={ openButton }
						onRemove={ ( index ) =>
							setLinks(
								links.filter( ( entry, at ) => at !== index )
							)
						}
						onMove={ moveLink }
					/>
				</section>
			</div>
		);
	}

	const tagCount = tagging ? tagging.chosen.size : 0;
	let tagLabel = sprintf(
		/* translators: %s: number of products. */
		_n( 'Tag %s product', 'Tag %s products', tagCount, 'productreels' ),
		formatNumber( tagCount )
	);

	if ( tagging && tagCount === 0 && tagging.before > 0 ) {
		tagLabel = __( 'Remove product tags', 'productreels' );
	}

	return (
		<>
			<Dialog
				size="wide"
				className="pr-reelsheet"
				title={
					isNew
						? __( 'Add reel', 'productreels' )
						: __( 'Edit reel', 'productreels' )
				}
				description={ __(
					'One vertical video and the products it sells.',
					'productreels'
				) }
				body={ false }
				dismissible={ ! saving }
				onClose={ requestClose }
				note={ note }
				noteTone={ noteTone }
				footer={
					<>
						<Button onClick={ requestClose } disabled={ saving }>
							{ __( 'Cancel', 'productreels' ) }
						</Button>
						<Button
							variant="primary"
							icon="check"
							busy={ saving }
							disabled={ loading || loadFailed }
							onClick={ save }
						>
							{ __( 'Save reel', 'productreels' ) }
						</Button>
					</>
				}
			>
				<div className="pr-sheet">
					<div className="pr-sheet__preview">
						<div className="pr-sheet__player">
							{ ! loading && ! loadFailed ? (
								<CompactPlayer
									reel={ previewReel }
									styles={ previewStyles }
									services={ editorServices }
									label={ __( 'Preview', 'productreels' ) }
								/>
							) : (
								<span className="pr-sheet__blank" />
							) }
						</div>
						<span className="pr-sheet__previewcap pr-t-caption">
							<Icon name="eye" size={ 14 } />
							{ __(
								'How it looks when it opens',
								'productreels'
							) }
						</span>
					</div>
					{ form }
				</div>
			</Dialog>

			{ tagging && (
				<Dialog
					size="md"
					className="pr-tagdialog"
					title={ __( 'Tag products', 'productreels' ) }
					description={ __(
						'Their cards appear over the video in the player.',
						'productreels'
					) }
					onClose={ () => setTagging( null ) }
					note={
						wooActive
							? sprintf(
									/* translators: %s: number of products. */
									_n(
										'%s selected',
										'%s selected',
										tagCount,
										'productreels'
									),
									formatNumber( tagCount )
								)
							: undefined
					}
					footer={
						wooActive ? (
							<>
								<Button onClick={ () => setTagging( null ) }>
									{ __( 'Cancel', 'productreels' ) }
								</Button>
								<Button
									variant="primary"
									icon="tag"
									disabled={
										tagCount === 0 && tagging.before === 0
									}
									onClick={ confirmTagging }
								>
									{ tagLabel }
								</Button>
							</>
						) : (
							<Button onClick={ () => setTagging( null ) }>
								{ __( 'Close', 'productreels' ) }
							</Button>
						)
					}
				>
					<ProductPicker
						chosen={ tagging.chosen }
						onToggle={ toggleProduct }
						wooActive={ wooActive }
						pluginsUrl={ boot.pluginsUrl }
					/>
				</Dialog>
			) }

			{ button && (
				<Dialog
					size="md"
					className="pr-linkdialog"
					title={
						button.link
							? __( 'Edit button', 'productreels' )
							: __( 'Add a button', 'productreels' )
					}
					description={ __(
						'Shown over the video. Opens any link and counts its clicks.',
						'productreels'
					) }
					onClose={ () => setButton( null ) }
					footer={
						<>
							<Button onClick={ () => setButton( null ) }>
								{ __( 'Cancel', 'productreels' ) }
							</Button>
							<Button
								variant="primary"
								icon="check"
								onClick={ confirmButton }
							>
								{ button.link
									? __( 'Save button', 'productreels' )
									: __( 'Add button', 'productreels' ) }
							</Button>
						</>
					}
				>
					<LinkForm
						draft={ button.draft }
						errors={ button.errors }
						onChange={ ( draft ) => {
							const errors = {};

							// A fixed field loses its error as soon as it is fixed.
							Object.keys( button.errors ).forEach( ( key ) => {
								if ( validateLink( draft )[ key ] ) {
									errors[ key ] = button.errors[ key ];
								}
							} );
							setButton( { ...button, draft, errors } );
						} }
					/>
				</Dialog>
			) }

			{ discarding && (
				<ConfirmDialog
					tone="danger"
					icon="alert"
					title={ __(
						'Discard changes to this reel?',
						'productreels'
					) }
					confirm={ __( 'Discard', 'productreels' ) }
					cancelLabel={ __( 'Keep editing', 'productreels' ) }
					onClose={ () => setDiscarding( false ) }
					onConfirm={ () => {
						setDiscarding( false );
						onClose();
					} }
				>
					{ __(
						'What you changed since opening it will not be saved.',
						'productreels'
					) }
				</ConfirmDialog>
			) }
		</>
	);
};
