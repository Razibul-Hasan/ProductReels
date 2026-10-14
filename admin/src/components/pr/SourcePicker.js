/**
 * SourcePicker: where a reel's videos come from.
 *
 * Upload is a drop zone plus the Media Library; YouTube Shorts, Vimeo and
 * Video link take links, one per line. Links are checked by the caller
 * (`onAddLinks` resolves with the lines it refused) and nothing is added
 * until every line is good, so an error can name the line to fix and the
 * line numbers in the box still match.
 */

import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { Button } from './Button';
import { TextField } from './Fields';
import { Segmented } from './Navigation';

const OPTIONS = [
	{ value: 'upload', label: __( 'Upload', 'productreels' ), icon: 'upload' },
	{
		value: 'youtube',
		label: __( 'YouTube Shorts', 'productreels' ),
		icon: 'youtube',
	},
	{ value: 'vimeo', label: __( 'Vimeo', 'productreels' ), icon: 'video' },
	{
		value: 'hosted',
		label: __( 'Video link', 'productreels' ),
		icon: 'link',
	},
];

const LINK_COPY = {
	youtube: {
		label: __( 'YouTube Shorts links', 'productreels' ),
		placeholder: 'https://youtube.com/shorts/…',
		help: __( 'One link per line to add several at once.', 'productreels' ),
	},
	vimeo: {
		label: __( 'Vimeo links', 'productreels' ),
		placeholder: 'https://vimeo.com/…',
		help: __( 'One link per line to add several at once.', 'productreels' ),
	},
	hosted: {
		label: __( 'Video links', 'productreels' ),
		placeholder: 'https://yourstore.com/videos/clip.mp4',
		help: __(
			'One link per line. MP4 plays everywhere; WebM does not play on older iPhones.',
			'productreels'
		),
	},
};

/**
 * "2, 4 and 7" in the admin's language.
 *
 * @param {number[]} numbers Line numbers.
 * @return {string} The list.
 */
const listOf = ( numbers ) => {
	const words = numbers.map( String );

	try {
		return new Intl.ListFormat(
			document.documentElement.lang || undefined,
			{
				type: 'conjunction',
			}
		).format( words );
	} catch ( error ) {
		return words.join( ', ' );
	}
};

/**
 * The error for refused lines: which lines, and what a good link looks like.
 *
 * @param {string}   source  youtube, vimeo or hosted.
 * @param {number[]} numbers The refused line numbers (1-based).
 * @return {string} The message.
 */
const linkError = ( source, numbers ) => {
	const one = numbers.length === 1;
	const lines = one ? numbers[ 0 ] : listOf( numbers );

	if ( source === 'youtube' ) {
		return sprintf(
			/* translators: %s: a line number, or a list of them. */
			_n(
				'Line %s is not a YouTube Shorts link. Links look like youtube.com/shorts/abc123.',
				'Lines %s are not YouTube Shorts links. Links look like youtube.com/shorts/abc123.',
				numbers.length,
				'productreels'
			),
			lines
		);
	}

	if ( source === 'vimeo' ) {
		return sprintf(
			/* translators: %s: a line number, or a list of them. */
			_n(
				'Line %s is not a Vimeo link. Links look like vimeo.com/123456789.',
				'Lines %s are not Vimeo links. Links look like vimeo.com/123456789.',
				numbers.length,
				'productreels'
			),
			lines
		);
	}

	return sprintf(
		/* translators: %s: a line number, or a list of them. */
		_n(
			'Line %s is not a video link. Use the full link to a video file, like https://yourstore.com/videos/clip.mp4.',
			'Lines %s are not video links. Use the full link to a video file, like https://yourstore.com/videos/clip.mp4.',
			numbers.length,
			'productreels'
		),
		lines
	);
};

export const SourcePicker = ( {
	onChooseLibrary,
	onDropFiles,
	onAddLinks,
	uploadError,
	focusRef,
} ) => {
	const [ source, setSource ] = useState( 'upload' );
	const [ text, setText ] = useState( '' );
	const [ error, setError ] = useState( '' );
	const [ checking, setChecking ] = useState( false );
	const [ over, setOver ] = useState( false );

	const addLinks = async () => {
		const lines = text.split( '\n' );
		const entries = lines
			.map( ( line, index ) => ( { url: line.trim(), line: index + 1 } ) )
			.filter( ( entry ) => entry.url !== '' );

		if ( entries.length === 0 ) {
			setError(
				__( 'Paste a link first, one per line.', 'productreels' )
			);

			return;
		}

		setChecking( true );
		setError( '' );

		try {
			const refused = await onAddLinks(
				source,
				entries.map( ( entry ) => entry.url )
			);

			if ( refused.length > 0 ) {
				setError(
					linkError(
						source,
						refused.map( ( index ) => entries[ index ].line )
					)
				);
			} else {
				setText( '' );
			}
		} finally {
			setChecking( false );
		}
	};

	const copy = LINK_COPY[ source ];

	return (
		<div className="pr-stackv pr-source" ref={ focusRef }>
			<Segmented
				block
				label={ __( 'Video source', 'productreels' ) }
				value={ source }
				options={ OPTIONS }
				onChange={ ( next ) => {
					setSource( next );
					setError( '' );
				} }
			/>

			{ source === 'upload' && (
				<>
					<div
						className="pr-drop"
						data-over={ over ? 'true' : undefined }
						onDragOver={ ( event ) => {
							event.preventDefault();
							setOver( true );
						} }
						onDragLeave={ ( event ) => {
							if (
								! event.currentTarget.contains(
									event.relatedTarget
								)
							) {
								setOver( false );
							}
						} }
						onDrop={ ( event ) => {
							event.preventDefault();
							setOver( false );
							onDropFiles( event.dataTransfer.files );
						} }
					>
						<span className="pr-drop__art" aria-hidden="true">
							<Icon name="upload" size={ 20 } />
						</span>
						<span className="pr-t-heading">
							{ __(
								'Drop vertical videos here',
								'productreels'
							) }
						</span>
						<span className="pr-drop__hint pr-t-small">
							{ __(
								'Any video format; MP4 plays everywhere. Add several at once and each one becomes its own clip.',
								'productreels'
							) }
						</span>
						<span className="pr-rowh pr-drop__actions">
							<Button
								size="sm"
								icon="image"
								onClick={ onChooseLibrary }
							>
								{ __(
									'Choose from Media Library',
									'productreels'
								) }
							</Button>
						</span>
					</div>
					{ uploadError && (
						<p className="pr-field__error pr-t-small" role="alert">
							<Icon name="alert" size={ 15 } />
							<span>{ uploadError }</span>
						</p>
					) }
				</>
			) }

			{ source !== 'upload' && (
				<div className="pr-stackv pr-source__links">
					<TextField
						multiline
						rows={ 4 }
						spellCheck="false"
						label={ copy.label }
						placeholder={ copy.placeholder }
						help={ copy.help }
						error={ error || undefined }
						value={ text }
						onChange={ ( event ) => {
							setText( event.target.value );
							setError( '' );
						} }
						onKeyDown={ ( event ) => {
							if (
								event.key === 'Enter' &&
								( event.metaKey || event.ctrlKey )
							) {
								event.preventDefault();
								addLinks();
							}
						} }
					/>
					<span className="pr-rowh">
						<Button
							size="sm"
							icon="plus"
							busy={ checking }
							onClick={ addLinks }
						>
							{ __( 'Add videos', 'productreels' ) }
						</Button>
					</span>
				</div>
			) }
		</div>
	);
};
