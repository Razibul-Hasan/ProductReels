/**
 * The app shell.
 *
 * Owns the route, the unsaved-changes gate and the toast stack. Screens below
 * this point are pure: they receive a navigate function and never touch the
 * address bar themselves.
 */

import { useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useHashRoute, useSubmenuHighlight } from './hooks/use-hash-route';
import { UnsavedContext } from './hooks/use-unsaved-guard';
import { ConfirmDialog } from './components/ui/Modal';
import { ToastProvider } from './components/ui/Toasts';
import { ReelsLibrary } from './screens/ReelsLibrary';
import { Settings } from './screens/Settings';
import { Statistics } from './screens/Statistics';
import { WidgetEditor } from './screens/WidgetEditor';
import { WidgetsList } from './screens/WidgetsList';

const Screen = ( { route, navigate } ) => {
	switch ( route.name ) {
		case 'reels':
			return <ReelsLibrary navigate={ navigate } />;

		case 'widget-new':
			return (
				<WidgetEditor key="new" widgetId={ 0 } navigate={ navigate } />
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

		case 'widgets':
		default:
			return <WidgetsList navigate={ navigate } />;
	}
};

const App = () => {
	const dirty = useRef( false );
	const [ , setDirtyState ] = useState( false );
	const { route, navigate, pending, leaveAnyway, stayHere } =
		useHashRoute( dirty );

	useSubmenuHighlight( route );

	const unsaved = useMemo(
		() => ( {
			setDirty: ( value ) => {
				dirty.current = value;
				setDirtyState( value );
			},
		} ),
		[]
	);

	return (
		<ToastProvider>
			<UnsavedContext.Provider value={ unsaved }>
				<div className="wr-app">
					<Screen route={ route } navigate={ navigate } />
				</div>

				{ pending && (
					<ConfirmDialog
						title={ __(
							'You have unsaved changes. Leave this page without saving?',
							'wooreels'
						) }
						confirmLabel={ __( 'Continue', 'wooreels' ) }
						tone="primary"
						onConfirm={ leaveAnyway }
						onClose={ stayHere }
					>
						{ __(
							'Anything you have changed since the last save will be lost.',
							'wooreels'
						) }
					</ConfirmDialog>
				) }
			</UnsavedContext.Provider>
		</ToastProvider>
	);
};

export default App;
