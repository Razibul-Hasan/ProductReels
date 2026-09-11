/**
 * The settings screen.
 *
 * Four cards, one save button. The form holds its own draft and only sends
 * what the API knows about; the API validates and clamps, and whatever it
 * stores is what the form shows afterwards, so the screen can never claim a
 * value the server refused.
 */

import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { boot, settings as settingsApi } from '../api';
import { IconInfo } from '../components/icons';
import { Button } from '../components/ui/Button';
import { Notice, Skeleton } from '../components/ui/Feedback';
import { Switch, TextField } from '../components/ui/Fields';
import { useToasts } from '../components/ui/Toasts';
import { useUnsavedChanges } from '../hooks/use-unsaved-guard';

const MINUTE = 60;

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

const isInt = ( value, min, max ) =>
	/^\d+$/.test( String( value ).trim() ) &&
	Number( value ) >= min &&
	Number( value ) <= max;

const Card = ( { title, text, children } ) => (
	<section className="wr-card wr-settings-card">
		<header className="wr-settings-card__head">
			<h2 className="wr-settings-card__title">{ title }</h2>
			{ text && <p className="wr-settings-card__text">{ text }</p> }
		</header>
		<div className="wr-settings-card__body">{ children }</div>
	</section>
);

export const Settings = () => {
	const toasts = useToasts();
	const [ draft, setDraft ] = useState( () =>
		boot.settings ? toDraft( boot.settings ) : null
	);
	const [ saved, setSaved ] = useState( () =>
		boot.settings ? JSON.stringify( toDraft( boot.settings ) ) : ''
	);
	const [ saving, setSaving ] = useState( false );
	const [ errors, setErrors ] = useState( {} );

	const dirty = draft !== null && JSON.stringify( draft ) !== saved;

	useUnsavedChanges( dirty );

	useEffect( () => {
		let cancelled = false;

		settingsApi
			.get()
			.then( ( values ) => {
				if ( ! cancelled ) {
					const next = toDraft( values );

					setDraft( next );
					setSaved( JSON.stringify( next ) );
				}
			} )
			.catch( ( error ) => {
				if ( ! cancelled && ! draft ) {
					toasts.error( error.message );
				}
			} );

		return () => {
			cancelled = true;
		};
		// Load once; the bootstrap copy covers the first paint.
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const set = ( key, value ) =>
		setDraft( ( current ) => ( { ...current, [ key ]: value } ) );

	const validate = () => {
		const next = {};

		if ( ! isInt( draft.view_limit, 1, 100 ) ) {
			next.view_limit = __( 'Please enter valid numbers.', 'wooreels' );
		}

		if ( ! isInt( draft.view_interval, 1, 1440 ) ) {
			next.view_interval = __(
				'Please enter valid numbers.',
				'wooreels'
			);
		}

		if ( ! isInt( draft.cache_ttl, 1, 7 * 24 * 60 ) ) {
			next.cache_ttl = __( 'Please enter valid numbers.', 'wooreels' );
		}

		setErrors( next );

		return Object.keys( next ).length === 0;
	};

	const save = async () => {
		if ( ! validate() ) {
			toasts.error( __( 'Please enter valid numbers.', 'wooreels' ) );

			return;
		}

		setSaving( true );

		try {
			const values = await settingsApi.update( {
				view_limit: Number( draft.view_limit ),
				view_interval: Number( draft.view_interval ),
				allow_public_fetch: draft.allow_public_fetch,
				cache_render: draft.cache_render,
				cache_ttl: Number( draft.cache_ttl ) * MINUTE,
				delete_data_on_uninstall: draft.delete_data_on_uninstall,
			} );

			const next = toDraft( values );

			setDraft( next );
			setSaved( JSON.stringify( next ) );
			toasts.success(
				__( 'Settings updated successfully.', 'wooreels' )
			);
		} catch ( error ) {
			toasts.error( error.message );
		} finally {
			setSaving( false );
		}
	};

	return (
		<>
			<div className="wr-page-head">
				<div className="wr-page-head__titles">
					<h1 className="wr-page-head__title">
						{ __( 'Settings', 'wooreels' ) }
					</h1>
					<p className="wr-page-head__sub">
						{ __(
							'Tracking, public access, caching and what happens on uninstall.',
							'wooreels'
						) }
					</p>
				</div>
				<div className="wr-page-head__actions">
					<Button
						variant="primary"
						busy={ saving }
						disabled={ saving || ! dirty }
						onClick={ save }
					>
						{ __( 'Save', 'wooreels' ) }
					</Button>
				</div>
			</div>

			<div className="wr-app__body wr-settings">
				{ ! draft && (
					<div className="wr-card wr-settings-card">
						<Skeleton width="40%" height={ 16 } />
						<Skeleton width="70%" height={ 12 } />
						<Skeleton height={ 36 } radius="6px" />
					</div>
				) }

				{ draft && (
					<>
						<Card
							title={ __( 'View tracking', 'wooreels' ) }
							text={ __(
								'The two numbers work together as a rate limit: a visitor can add at most this many views to one reel within this many minutes. Visitor IPs are hashed before they are used and never stored.',
								'wooreels'
							) }
						>
							<div className="wr-settings-row">
								<TextField
									label={ __( 'View limit', 'wooreels' ) }
									help={ __(
										'Views per visitor, per reel.',
										'wooreels'
									) }
									error={ errors.view_limit }
									type="number"
									min={ 1 }
									max={ 100 }
									inputMode="numeric"
									value={ draft.view_limit }
									onChange={ ( value ) =>
										set( 'view_limit', value )
									}
								/>
								<TextField
									label={ __( 'Time interval', 'wooreels' ) }
									help={ __( 'In minutes.', 'wooreels' ) }
									error={ errors.view_interval }
									type="number"
									min={ 1 }
									max={ 1440 }
									inputMode="numeric"
									value={ draft.view_interval }
									onChange={ ( value ) =>
										set( 'view_interval', value )
									}
								/>
							</div>
							<p className="wr-settings-summary">
								<IconInfo size={ 14 } />
								{ sprintf(
									/* translators: 1: view limit, 2: interval in minutes. */
									__(
										'Currently: at most %1$s views per reel every %2$s minutes, per visitor.',
										'wooreels'
									),
									draft.view_limit || '—',
									draft.view_interval || '—'
								) }
							</p>
						</Card>

						<Card
							title={ __( 'Public API', 'wooreels' ) }
							text={ __(
								'Your own pages always work. This decides whether anyone else can read a widget directly from the REST API.',
								'wooreels'
							) }
						>
							<Switch
								label={ __( 'Allow public fetch', 'wooreels' ) }
								help={ __(
									'When on, GET /wooreels/v1/render/{id} answers any request. It exposes reel titles, video URLs, posters, view counts and links — never anything about your visitors or orders.',
									'wooreels'
								) }
								checked={ draft.allow_public_fetch }
								onChange={ ( value ) =>
									set( 'allow_public_fetch', value )
								}
							/>
						</Card>

						<Card
							title={ __( 'Performance', 'wooreels' ) }
							text={ __(
								'Widget payloads are assembled once and reused until something changes.',
								'wooreels'
							) }
						>
							<Switch
								label={ __(
									'Cache render responses',
									'wooreels'
								) }
								help={ __(
									'Any edit to a widget, reel or file clears the cache immediately.',
									'wooreels'
								) }
								checked={ draft.cache_render }
								onChange={ ( value ) =>
									set( 'cache_render', value )
								}
							/>
							{ draft.cache_render && (
								<div className="wr-settings-row wr-settings-row--narrow">
									<TextField
										label={ __( 'Cache TTL', 'wooreels' ) }
										help={ __(
											'In minutes. Between 1 minute and 7 days.',
											'wooreels'
										) }
										error={ errors.cache_ttl }
										type="number"
										min={ 1 }
										max={ 7 * 24 * 60 }
										inputMode="numeric"
										value={ draft.cache_ttl }
										onChange={ ( value ) =>
											set( 'cache_ttl', value )
										}
									/>
								</div>
							) }
						</Card>

						<Card
							title={ __( 'Data', 'wooreels' ) }
							text={ __(
								'What happens to your reels, widgets and statistics when the plugin is deleted.',
								'wooreels'
							) }
						>
							<Switch
								label={ __(
									'Delete all plugin data on uninstall',
									'wooreels'
								) }
								help={ __(
									'Off by default. Deactivating never removes anything.',
									'wooreels'
								) }
								checked={ draft.delete_data_on_uninstall }
								onChange={ ( value ) =>
									set( 'delete_data_on_uninstall', value )
								}
							/>
							{ draft.delete_data_on_uninstall && (
								<Notice tone="warning">
									{ __(
										'Deleting the plugin will permanently drop every WooReels table — all widgets, reels, file records, view counts and click counts. Media files in your library are kept.',
										'wooreels'
									) }
								</Notice>
							) }
						</Card>
					</>
				) }
			</div>
		</>
	);
};
