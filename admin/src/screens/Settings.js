/**
 * The settings screen.
 *
 * Section links on the left, four setting cards, and a save bar that floats
 * up only while something differs from what is stored. The form holds its own
 * draft and sends only the keys that changed, so a stored value nobody touched
 * (say a 1.0.0 cache lifetime that isn't a whole number of minutes) is never
 * rewritten. The API validates and clamps, and whatever it stores is what the
 * form shows afterwards, so the screen can never claim a value the server
 * refused.
 */

import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { boot, settings as settingsApi } from '../api';
import {
	Button,
	ConfirmDialog,
	FloatingBar,
	Notice,
	PageHeader,
	SettingRow,
	SettingsCard,
	Skeleton,
	Switch,
	TextField,
	useToasts,
} from '../components/pr';
import { formatNumber } from '../format';
import { useUnsavedChanges } from '../hooks/use-unsaved-guard';

const MINUTE = 60;
const HOUR_MINUTES = 60;
const DAY_MINUTES = 24 * HOUR_MINUTES;

/** The number fields, with the ranges the API accepts (cache lifetime in minutes). */
const NUMBERS = {
	view_limit: { min: 1, max: 100 },
	view_interval: { min: 1, max: DAY_MINUTES },
	cache_ttl: { min: 1, max: 7 * DAY_MINUTES },
};

const fieldId = ( key ) => `pr-setting-${ key }`;

/**
 * Draft shape: numbers as strings so a half-typed field is never clamped under the cursor.
 *
 * @param {Object} values Settings as the API returns them.
 * @return {Object} The form draft.
 */
const toDraft = ( values ) => ( {
	view_limit: String( values.view_limit ),
	view_interval: String( values.view_interval ),
	allow_public_fetch: !! values.allow_public_fetch,
	cache_render: !! values.cache_render,
	cache_ttl: String( Math.round( values.cache_ttl / MINUTE ) ),
	delete_data_on_uninstall: !! values.delete_data_on_uninstall,
} );

const isValid = ( key, value ) => {
	const { min, max } = NUMBERS[ key ];

	return (
		/^\d+$/.test( String( value ).trim() ) &&
		Number( value ) >= min &&
		Number( value ) <= max
	);
};

const rangeError = ( key ) => {
	const { min, max } = NUMBERS[ key ];

	if ( key === 'cache_ttl' ) {
		return sprintf(
			/* translators: 1: smallest cache lifetime in minutes, 2: largest. */
			__(
				'Use a number from %1$s to %2$s minutes (7 days).',
				'productreels'
			),
			formatNumber( min ),
			formatNumber( max )
		);
	}

	if ( key === 'view_interval' ) {
		return sprintf(
			/* translators: 1: shortest time window in minutes, 2: longest. */
			__(
				'Use a number from %1$s to %2$s minutes (1 day).',
				'productreels'
			),
			formatNumber( min ),
			formatNumber( max )
		);
	}

	return sprintf(
		/* translators: 1: smallest number allowed, 2: largest. */
		__( 'Use a number from %1$s to %2$s.', 'productreels' ),
		formatNumber( min ),
		formatNumber( max )
	);
};

/**
 * "every minute", "every 5 minutes", "every hour", "every 2 hours", "every day".
 *
 * @param {number} minutes The time window.
 * @return {string} The window in words.
 */
const everyWords = ( minutes ) => {
	if ( minutes === 1 ) {
		return __( 'every minute', 'productreels' );
	}

	if ( minutes === DAY_MINUTES ) {
		return __( 'every day', 'productreels' );
	}

	if ( minutes === HOUR_MINUTES ) {
		return __( 'every hour', 'productreels' );
	}

	if ( minutes % HOUR_MINUTES === 0 ) {
		const hours = minutes / HOUR_MINUTES;

		return sprintf(
			/* translators: %d: number of hours. */
			_n( 'every %d hour', 'every %d hours', hours, 'productreels' ),
			hours
		);
	}

	return sprintf(
		/* translators: %d: number of minutes. */
		_n( 'every %d minute', 'every %d minutes', minutes, 'productreels' ),
		minutes
	);
};

/**
 * The view-tracking rule read back in words.
 *
 * @param {number} views   Views per visitor.
 * @param {number} minutes Time window in minutes.
 * @return {string} The sentence.
 */
export const viewSummary = ( views, minutes ) =>
	sprintf(
		/* translators: 1: e.g. "2 views", 2: e.g. "every hour". */
		__( 'A visitor adds at most %1$s to each reel %2$s.', 'productreels' ),
		sprintf(
			/* translators: %d: number of views. */
			_n( '%d view', '%d views', views, 'productreels' ),
			views
		),
		everyWords( minutes )
	) +
	' ' +
	__( 'IPs are hashed and never stored.', 'productreels' );

const sections = () => [
	{
		id: 'pr-settings-tracking',
		icon: 'eye',
		label: __( 'View tracking', 'productreels' ),
	},
	{
		id: 'pr-settings-api',
		icon: 'code',
		label: __( 'Public API', 'productreels' ),
	},
	{
		id: 'pr-settings-performance',
		icon: 'zap',
		label: __( 'Performance', 'productreels' ),
	},
	{
		id: 'pr-settings-data',
		icon: 'trash',
		label: __( 'Data', 'productreels' ),
	},
];

/**
 * The section links: sticky, marking the card in view, and moving focus to a
 * card's heading when followed so the keyboard carries on from there.
 *
 * Links rather than buttons, but they never change the address: the hash is
 * the app's router.
 *
 * @param {Object} props       Props.
 * @param {Array}  props.items The sections.
 * @return {Object} The nav.
 */
const SectionNav = ( { items } ) => {
	const [ active, setActive ] = useState( items[ 0 ].id );
	// While a followed link scrolls the page, keep its section marked, even
	// if the page bottoms out before that card reaches the top.
	const pinned = useRef( false );

	useEffect( () => {
		let frame = 0;

		const update = () => {
			frame = 0;

			if ( pinned.current ) {
				return;
			}

			const cards = items
				.map( ( item ) => document.getElementById( item.id ) )
				.filter( Boolean );

			if ( ! cards.length ) {
				return;
			}

			const root = document.documentElement;
			const atBottom =
				window.scrollY > 0 &&
				window.innerHeight + window.scrollY >= root.scrollHeight - 2;
			const line =
				( document.getElementById( 'wpadminbar' )?.offsetHeight || 0 ) +
				window.innerHeight * 0.3;
			let current = cards[ 0 ].id;

			if ( atBottom ) {
				current = cards[ cards.length - 1 ].id;
			} else {
				cards.forEach( ( card ) => {
					if ( card.getBoundingClientRect().top <= line ) {
						current = card.id;
					}
				} );
			}

			setActive( current );
		};

		const onScroll = () => {
			if ( ! frame ) {
				frame = window.requestAnimationFrame( update );
			}
		};

		// The person scrolls (or types) again: follow the page from here,
		// even if it can't scroll any further.
		const release = () => {
			pinned.current = false;
			onScroll();
		};

		window.addEventListener( 'scroll', onScroll, { passive: true } );
		window.addEventListener( 'resize', onScroll );
		window.addEventListener( 'wheel', release, { passive: true } );
		window.addEventListener( 'touchmove', release, { passive: true } );
		window.addEventListener( 'keydown', release );
		update();

		return () => {
			window.cancelAnimationFrame( frame );
			window.removeEventListener( 'scroll', onScroll );
			window.removeEventListener( 'resize', onScroll );
			window.removeEventListener( 'wheel', release );
			window.removeEventListener( 'touchmove', release );
			window.removeEventListener( 'keydown', release );
		};
	}, [ items ] );

	const go = ( id ) => {
		const card = document.getElementById( id );

		if ( ! card ) {
			return;
		}

		const heading = document.getElementById( `${ id }-title` );

		pinned.current = true;
		setActive( id );
		card.scrollIntoView( {
			behavior: window.matchMedia( '(prefers-reduced-motion: reduce)' )
				.matches
				? 'auto'
				: 'smooth',
			block: 'start',
		} );

		if ( heading ) {
			heading.setAttribute( 'tabindex', '-1' );
			heading.focus( { preventScroll: true } );
		}
	};

	return (
		<nav
			className="pr-settings-nav"
			aria-label={ __( 'Settings sections', 'productreels' ) }
		>
			{ items.map( ( item ) => (
				<a
					key={ item.id }
					href="#/settings"
					className="pr-menu__item pr-t-body"
					aria-current={ active === item.id ? 'true' : undefined }
					onClick={ ( event ) => {
						event.preventDefault();
						go( item.id );
					} }
				>
					<Icon name={ item.icon } size={ 17 } />
					{ item.label }
				</a>
			) ) }
		</nav>
	);
};

/**
 * A number setting: the input on the right, its error across the row.
 *
 * @param {Object}   props          Props.
 * @param {string}   props.name     The settings key.
 * @param {string}   props.title    The row title (also the input's name).
 * @param {string}   props.text     The row description.
 * @param {string}   props.suffix   Unit shown in the input.
 * @param {boolean}  props.wide     A wider input.
 * @param {Object}   props.draft    The draft.
 * @param {Object}   props.errors   Errors by key.
 * @param {Function} props.onChange Called with the key and the new text.
 * @param {Function} props.onBlur   Called with the key.
 * @param {boolean}  props.disabled Whether the input is off.
 * @return {Object} The row.
 */
const NumberRow = ( {
	name,
	title,
	text,
	suffix,
	wide,
	draft,
	errors,
	onChange,
	onBlur,
	disabled,
} ) => {
	const id = fieldId( name );
	const error = errors[ name ];

	return (
		<SettingRow
			title={ title }
			description={ text }
			descriptionId={ `${ id }-desc` }
			foot={
				error && (
					<p
						className="pr-field__error pr-t-small"
						id={ `${ id }-error` }
					>
						<Icon name="alert" size={ 15 } />
						<span>{ error }</span>
					</p>
				)
			}
		>
			<div
				className={
					wide
						? 'pr-settings-page__num pr-settings-page__num--wide'
						: 'pr-settings-page__num'
				}
			>
				<TextField
					id={ id }
					type="text"
					inputMode="numeric"
					autoComplete="off"
					suffix={ suffix }
					aria-label={ title }
					aria-describedby={
						error ? `${ id }-error ${ id }-desc` : `${ id }-desc`
					}
					aria-invalid={ error ? 'true' : undefined }
					disabled={ disabled }
					value={ draft[ name ] }
					onChange={ ( event ) =>
						onChange( name, event.target.value )
					}
					onBlur={ () => onBlur( name ) }
				/>
			</div>
		</SettingRow>
	);
};

export const Settings = () => {
	const toasts = useToasts();
	const [ saved, setSaved ] = useState( () =>
		boot.settings ? toDraft( boot.settings ) : null
	);
	const [ draft, setDraft ] = useState( saved );
	const [ loadError, setLoadError ] = useState( null );
	const [ saving, setSaving ] = useState( false );
	const [ errors, setErrors ] = useState( {} );
	const [ confirmingDelete, setConfirmingDelete ] = useState( false );
	const [ items ] = useState( sections );
	// Whether anything has been typed, so a fresh copy from the server never
	// replaces a draft in progress.
	const touched = useRef( false );

	const changed =
		draft && saved
			? Object.keys( draft ).filter(
					( key ) => draft[ key ] !== saved[ key ]
				)
			: [];
	const dirty = changed.length > 0;

	useUnsavedChanges( dirty, __( 'Settings', 'productreels' ) );

	const load = useCallback( () => {
		let cancelled = false;

		setLoadError( null );
		settingsApi
			.get()
			.then( ( values ) => {
				if ( cancelled ) {
					return;
				}

				const next = toDraft( values );

				setSaved( next );
				// Keep anything typed while the fresh copy was on its way.
				setDraft( ( current ) =>
					touched.current && current ? current : next
				);
			} )
			.catch( ( error ) => {
				if ( ! cancelled ) {
					setLoadError( error );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [] );

	// The bootstrap copy covers the first paint; this makes sure it is current.
	useEffect( load, [ load ] );

	const set = ( key, value ) => {
		touched.current = true;
		setDraft( ( current ) => ( { ...current, [ key ]: value } ) );

		// An error clears as soon as the value is right, never appears while typing.
		if ( errors[ key ] && NUMBERS[ key ] && isValid( key, value ) ) {
			setErrors( ( current ) => {
				const next = { ...current };

				delete next[ key ];

				return next;
			} );
		}
	};

	const check = ( key ) => {
		if ( draft[ key ] !== saved[ key ] && ! isValid( key, draft[ key ] ) ) {
			setErrors( ( current ) => ( {
				...current,
				[ key ]: rangeError( key ),
			} ) );
		}
	};

	// Centred, so the error under the field clears the save bar.
	const focusField = ( key ) =>
		window.requestAnimationFrame( () => {
			const input = document.getElementById( fieldId( key ) );

			input?.focus( { preventScroll: true } );
			input?.scrollIntoView( { block: 'center' } );
		} );

	const save = async () => {
		const payload = {};
		const problems = {};

		changed.forEach( ( key ) => {
			if ( ! NUMBERS[ key ] ) {
				payload[ key ] = draft[ key ];

				return;
			}

			if ( isValid( key, draft[ key ] ) ) {
				payload[ key ] =
					Number( draft[ key ] ) *
					( key === 'cache_ttl' ? MINUTE : 1 );
			} else if ( key !== 'cache_ttl' || draft.cache_render ) {
				// A lifetime typed and then switched off with caching is
				// simply not sent; the stored one comes back.
				problems[ key ] = rangeError( key );
			}
		} );

		if ( Object.keys( problems ).length ) {
			setErrors( problems );
			focusField(
				Object.keys( NUMBERS ).find( ( key ) => problems[ key ] )
			);

			return;
		}

		if ( ! Object.keys( payload ).length ) {
			setDraft( saved );
			setErrors( {} );

			return;
		}

		setSaving( true );

		try {
			const next = toDraft( await settingsApi.update( payload ) );

			setSaved( next );
			setDraft( next );
			setErrors( {} );
			toasts.success( __( 'Settings saved', 'productreels' ) );
		} catch ( error ) {
			const refused = Object.keys( NUMBERS ).filter(
				( key ) => error.params?.[ key ]
			);

			if ( refused.length ) {
				setErrors(
					Object.fromEntries(
						refused.map( ( key ) => [ key, rangeError( key ) ] )
					)
				);
				focusField( refused[ 0 ] );
				toasts.error(
					_n(
						'Settings weren’t saved. Fix the marked field and try again.',
						'Settings weren’t saved. Fix the marked fields and try again.',
						refused.length,
						'productreels'
					)
				);
			} else {
				toasts.error( error.message );
			}
		} finally {
			setSaving( false );
		}
	};

	const discard = () => {
		setDraft( saved );
		setErrors( {} );
		toasts.success( __( 'Changes discarded', 'productreels' ), {
			icon: 'undo',
		} );
	};

	if ( ! draft ) {
		return (
			<>
				<PageHeader
					title={ __( 'Settings', 'productreels' ) }
					description={ __(
						'How views are counted, who can read your widgets, caching, and what happens on uninstall.',
						'productreels'
					) }
				/>
				{ loadError ? (
					<Notice
						tone="danger"
						title={ __(
							'Settings couldn’t be loaded',
							'productreels'
						) }
						actions={
							<Button size="sm" onClick={ () => load() }>
								{ __( 'Try again', 'productreels' ) }
							</Button>
						}
					>
						{ loadError.message }
					</Notice>
				) : (
					<Skeleton count={ 6 } />
				) }
			</>
		);
	}

	const views = isValid( 'view_limit', draft.view_limit )
		? Number( draft.view_limit )
		: Number( saved.view_limit );
	const minutes = isValid( 'view_interval', draft.view_interval )
		? Number( draft.view_interval )
		: Number( saved.view_interval );
	const numberProps = {
		draft,
		errors,
		onChange: set,
		onBlur: check,
	};

	return (
		<>
			<PageHeader
				title={ __( 'Settings', 'productreels' ) }
				description={ __(
					'How views are counted, who can read your widgets, caching, and what happens on uninstall.',
					'productreels'
				) }
			/>

			<div className="pr-settings-page">
				<SectionNav items={ items } />

				<div className="pr-settings-page__cards">
					<SettingsCard
						id="pr-settings-tracking"
						title={ __( 'View tracking', 'productreels' ) }
						description={ __(
							'Each visitor can add a limited number of views to a reel in a time window, so refreshes don’t inflate your numbers.',
							'productreels'
						) }
					>
						<NumberRow
							{ ...numberProps }
							name="view_limit"
							title={ __( 'Views per visitor', 'productreels' ) }
							text={ __(
								'Per reel, within the time window.',
								'productreels'
							) }
						/>
						<NumberRow
							{ ...numberProps }
							name="view_interval"
							suffix={ __( 'min', 'productreels' ) }
							title={ __( 'Time window', 'productreels' ) }
							text={ __(
								'How long the limit lasts.',
								'productreels'
							) }
						/>
						<SettingRow
							below
							title={ __( 'What this means', 'productreels' ) }
						>
							<p
								className="pr-summary pr-t-body"
								aria-live="polite"
							>
								<Icon name="info" size={ 16 } />
								{ viewSummary( views, minutes ) }
							</p>
						</SettingRow>
					</SettingsCard>

					<SettingsCard
						id="pr-settings-api"
						title={ __( 'Public API', 'productreels' ) }
						description={ __(
							'Your own pages always work. This decides whether other sites and apps can read a widget from the REST API.',
							'productreels'
						) }
					>
						<SettingRow
							title={ __( 'Allow public fetch', 'productreels' ) }
							descriptionId="pr-setting-allow_public_fetch-desc"
							description={ createInterpolateElement(
								sprintf(
									/* translators: %s: the REST endpoint, e.g. GET /productreels/v1/render/{id}. */
									__(
										'%s answers anyone. It returns reel titles, video and cover links, view counts and product links, never anything about visitors or orders.',
										'productreels'
									),
									'<endpoint />'
								),
								{
									endpoint: (
										<code className="pr-t-code">
											GET /productreels/v1/render/
											{ '{id}' }
										</code>
									),
								}
							) }
						>
							<Switch
								id="pr-setting-allow_public_fetch"
								label={ __(
									'Allow public fetch',
									'productreels'
								) }
								describedBy="pr-setting-allow_public_fetch-desc"
								checked={ draft.allow_public_fetch }
								onChange={ ( value ) =>
									set( 'allow_public_fetch', value )
								}
							/>
						</SettingRow>
					</SettingsCard>

					<SettingsCard
						id="pr-settings-performance"
						title={ __( 'Performance', 'productreels' ) }
						description={ __(
							'Widgets are assembled once and reused until something changes.',
							'productreels'
						) }
					>
						<SettingRow
							title={ __( 'Cache widgets', 'productreels' ) }
							descriptionId="pr-setting-cache_render-desc"
							description={ __(
								'Editing a widget, reel or video clears its cache straight away.',
								'productreels'
							) }
						>
							<Switch
								id="pr-setting-cache_render"
								label={ __( 'Cache widgets', 'productreels' ) }
								describedBy="pr-setting-cache_render-desc"
								checked={ draft.cache_render }
								onChange={ ( value ) =>
									set( 'cache_render', value )
								}
							/>
						</SettingRow>
						<NumberRow
							{ ...numberProps }
							name="cache_ttl"
							wide
							suffix={ __( 'min', 'productreels' ) }
							title={ __( 'Cache lifetime', 'productreels' ) }
							text={
								draft.cache_render
									? __(
											'Between 1 minute and 7 days.',
											'productreels'
										)
									: __(
											'Turn on Cache widgets to set how long a widget is kept.',
											'productreels'
										)
							}
							disabled={ ! draft.cache_render }
						/>
					</SettingsCard>

					<SettingsCard
						id="pr-settings-data"
						tone="danger"
						title={ __( 'Data', 'productreels' ) }
						description={ __(
							'What happens to your reels, widgets and statistics when the plugin is deleted. Deactivating never removes anything.',
							'productreels'
						) }
					>
						<SettingRow
							title={ __(
								'Delete all data on uninstall',
								'productreels'
							) }
							descriptionId="pr-setting-delete_data_on_uninstall-desc"
							description={ __(
								'Removes every reel, widget and statistic when you delete ProductReels from Plugins. This can’t be undone.',
								'productreels'
							) }
						>
							<Switch
								id="pr-setting-delete_data_on_uninstall"
								tone="danger"
								label={ __(
									'Delete all data on uninstall',
									'productreels'
								) }
								describedBy="pr-setting-delete_data_on_uninstall-desc"
								checked={ draft.delete_data_on_uninstall }
								onChange={ ( value ) =>
									value
										? setConfirmingDelete( true )
										: set(
												'delete_data_on_uninstall',
												false
											)
								}
							/>
						</SettingRow>
					</SettingsCard>
				</div>
			</div>

			{ dirty && (
				<FloatingBar
					dot
					text={ __( 'You have unsaved changes', 'productreels' ) }
				>
					<Button
						variant="on-ink"
						size="sm"
						disabled={ saving }
						onClick={ discard }
					>
						{ __( 'Discard', 'productreels' ) }
					</Button>
					<Button
						variant="primary"
						size="sm"
						icon="check"
						busy={ saving }
						onClick={ save }
					>
						{ __( 'Save settings', 'productreels' ) }
					</Button>
				</FloatingBar>
			) }

			{ confirmingDelete && (
				<ConfirmDialog
					title={ __(
						'Delete all data on uninstall?',
						'productreels'
					) }
					icon="alert"
					confirm={ __( 'Turn on', 'productreels' ) }
					onClose={ () => setConfirmingDelete( false ) }
					onConfirm={ () => {
						set( 'delete_data_on_uninstall', true );
						setConfirmingDelete( false );
					} }
				>
					{ __(
						'Once you save, deleting ProductReels from Plugins removes every reel, widget and statistic for good. Videos and images in your Media Library stay.',
						'productreels'
					) }
				</ConfirmDialog>
			) }
		</>
	);
};
