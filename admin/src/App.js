/**
 * The app shell.
 *
 * Owns the route, the frame each route sits in, the unsaved-changes gate and
 * the toast stack. Screens below this point are pure: they receive a navigate
 * function and never touch the address bar themselves.
 */

import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { boot } from './api';
import {
	useDocumentTitle,
	useHashRoute,
	useSubmenuHighlight,
} from './hooks/use-hash-route';
import { UnsavedContext, useLeaveWarning } from './hooks/use-unsaved-guard';
import { AppHeader, ConfirmDialog, ToastProvider } from './components/pr';
import { ReelsLibrary } from './screens/ReelsLibrary';
import { Settings } from './screens/Settings';
import { Statistics } from './screens/Statistics';
import { WidgetEditor } from './screens/WidgetEditor';
import { WidgetsList } from './screens/WidgetsList';

const DOCS_URL = 'https://bestwebexpert.com/productreels';

/**
 * Every route, in one place: the section it belongs to (app bar pill and WP
 * submenu item), its name in the browser tab, and its frame. `app` routes get
 * the app bar and the page column; `editor` routes fill the content area and
 * draw their own header.
 */
const ROUTES = {
	widgets: {
		section: 'widgets',
		title: __( 'Widgets', 'productreels' ),
		frame: 'app',
	},
	// The Create widget dialog, over Widgets.
	'widget-new': {
		section: 'widgets',
		title: __( 'Create widget', 'productreels' ),
		frame: 'app',
	},
	// A widget started from that dialog, not saved yet.
	'widget-draft': {
		section: 'widgets',
		title: __( 'New widget', 'productreels' ),
		frame: 'editor',
	},
	'widget-edit': {
		section: 'widgets',
		title: __( 'Edit widget', 'productreels' ),
		frame: 'editor',
	},
	'widget-stats': {
		section: 'widgets',
		title: __( 'Statistics', 'productreels' ),
		frame: 'app',
	},
	reels: {
		section: 'reels',
		title: __( 'Reels', 'productreels' ),
		frame: 'app',
	},
	settings: {
		section: 'settings',
		title: __( 'Settings', 'productreels' ),
		frame: 'app',
	},
};

const Screen = ( { route, navigate } ) => {
	switch ( route.name ) {
		case 'reels':
			return <ReelsLibrary navigate={ navigate } />;

		case 'widget-draft':
			return (
				<WidgetEditor
					key="draft"
					widgetId={ 0 }
					navigate={ navigate }
				/>
			);

		case 'widget-edit':
			return (
				<WidgetEditor
					key={ route.id }
					widgetId={ route.id }
					navigate={ navigate }
				/>
			);

		case 'widget-stats':
			return (
				<Statistics
					key={ route.id }
					widgetId={ route.id }
					navigate={ navigate }
				/>
			);

		case 'settings':
			return <Settings />;

		// Same element type in the same place as `widgets`, so opening and
		// closing the dialog keeps the list (and its data) mounted.
		case 'widget-new':
		case 'widgets':
		default:
			return (
				<WidgetsList
					navigate={ navigate }
					creating={ route.name === 'widget-new' }
				/>
			);
	}
};

const App = () => {
	const dirty = useRef( false );
	const [ unsaved, setUnsaved ] = useState( { dirty: false, label: '' } );
	const { route, navigate, pending, leaveAnyway, stayHere } =
		useHashRoute( dirty );
	const meta = ROUTES[ route.name ] || ROUTES.widgets;

	useSubmenuHighlight( meta.section );
	useDocumentTitle( meta.title, boot.title );
	useLeaveWarning( unsaved.dirty );

	const setDirty = useCallback( ( value, label = '' ) => {
		dirty.current = !! value;
		setUnsaved( ( current ) =>
			current.dirty === !! value && current.label === label
				? current
				: { dirty: !! value, label }
		);
	}, [] );

	const context = useMemo( () => ( { setDirty } ), [ setDirty ] );

	const leave = useCallback( () => {
		setUnsaved( { dirty: false, label: '' } );
		leaveAnyway();
	}, [ leaveAnyway ] );

	const isEditor = meta.frame === 'editor';

	return (
		<ToastProvider>
			<UnsavedContext.Provider value={ context }>
				<div
					className={ isEditor ? 'wr-app wr-app--editor' : 'wr-app' }
				>
					{ isEditor ? (
						<Screen route={ route } navigate={ navigate } />
					) : (
						<>
							<AppHeader
								current={ meta.section }
								version={ boot.version }
								logoUrl={ boot.logoUrl }
								docsUrl={ DOCS_URL }
							/>
							<div className="pr-page">
								<Screen route={ route } navigate={ navigate } />
							</div>
						</>
					) }
				</div>

				{ pending && (
					<ConfirmDialog
						title={ __( 'Leave without saving?', 'productreels' ) }
						confirm={ __( 'Leave', 'productreels' ) }
						cancelLabel={ __( 'Keep editing', 'productreels' ) }
						icon="alert"
						onConfirm={ leave }
						onClose={ stayHere }
					>
						{ unsaved.label
							? sprintf(
									/* translators: %s: what has unsaved changes, e.g. a widget's name. */
									__(
										'Your changes to %s will be lost.',
										'productreels'
									),
									unsaved.label
								)
							: __(
									'Your changes will be lost.',
									'productreels'
								) }
					</ConfirmDialog>
				) }
			</UnsavedContext.Provider>
		</ToastProvider>
	);
};

export default App;
