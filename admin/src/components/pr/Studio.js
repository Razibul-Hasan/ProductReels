/**
 * The widget editor's frame: StudioShell, StudioHeader, StudioRail,
 * StudioPanel, PanelSection, Stage, DeviceSwitch and DeviceFrame.
 *
 * The shell is a grid: the header across the top, then the rail, the panel
 * for the current step and the dark preview stage. Each column scrolls on its
 * own. The stage renders the real storefront components inside a DeviceFrame
 * that lays the page out at the device's own width (1280, 768 or 390 px) and
 * zooms it down to fit, so what the merchant sees is the page a visitor gets,
 * only smaller.
 */

import {
	forwardRef,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { formatNumber } from '../../format';
import { Badge } from './Badge';
import { Button, IconButton } from './Button';
import { Menu } from './Menu';
import { Segmented } from './Navigation';
import { ShortcodeChip } from './ShortcodeChip';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

export const STUDIO_STEPS = [
	{ id: 'reels', label: __( 'Reels', 'productreels' ), icon: 'film' },
	{ id: 'layout', label: __( 'Layout', 'productreels' ), icon: 'grid' },
	{ id: 'look', label: __( 'Look', 'productreels' ), icon: 'palette' },
	{ id: 'player', label: __( 'Player', 'productreels' ), icon: 'play' },
	{ id: 'card', label: __( 'Product card', 'productreels' ), icon: 'tag' },
	{
		id: 'advanced',
		label: __( 'Advanced', 'productreels' ),
		icon: 'sliders',
	},
];

export const PLACE_STEP = {
	id: 'place',
	label: __( 'Place it', 'productreels' ),
	icon: 'code',
};

/** The page width each preview device lays out at. */
export const DEVICES = {
	desktop: {
		label: __( 'Desktop', 'productreels' ),
		icon: 'monitor',
		width: 1280,
	},
	tablet: {
		label: __( 'Tablet', 'productreels' ),
		icon: 'tablet',
		width: 768,
	},
	mobile: {
		label: __( 'Mobile', 'productreels' ),
		icon: 'smartphone',
		width: 390,
	},
};

export const StudioShell = ( { header, rail, panel, stage, panelOpen } ) => (
	<div
		className="pr-studio"
		data-panel={ panelOpen === false ? 'closed' : 'open' }
	>
		{ header }
		{ rail }
		{ panel }
		{ stage }
	</div>
);

/**
 * The widget's name: a button that becomes a text field. Enter or leaving
 * the field keeps the new name, Escape puts the old one back.
 *
 * @param {Object}   props          Props.
 * @param {string}   props.name     The current name.
 * @param {string}   props.fallback What to show for an empty name.
 * @param {Function} props.onRename Receives the new name.
 * @return {Object} The control.
 */
const NameField = ( { name, fallback, onRename } ) => {
	const [ editing, setEditing ] = useState( false );
	const [ draft, setDraft ] = useState( name );
	const input = useRef( null );
	const button = useRef( null );
	const refocus = useRef( false );

	useLayoutEffect( () => {
		if ( editing ) {
			input.current?.focus();
			input.current?.select();
		} else if ( refocus.current ) {
			refocus.current = false;
			button.current?.focus();
		}
	}, [ editing ] );

	const finish = ( keep ) => {
		if ( keep && draft.trim() !== name.trim() ) {
			onRename( draft.trim() );
		}

		setEditing( false );
	};

	if ( editing ) {
		return (
			<input
				ref={ input }
				type="text"
				className="pr-input pr-studio__name-input pr-t-display-sm"
				value={ draft }
				placeholder={ fallback }
				maxLength={ 191 }
				aria-label={ __( 'Widget name', 'productreels' ) }
				onChange={ ( event ) => setDraft( event.target.value ) }
				onBlur={ () => finish( true ) }
				onKeyDown={ ( event ) => {
					if ( event.key === 'Enter' ) {
						event.preventDefault();
						refocus.current = true;
						finish( true );
					} else if ( event.key === 'Escape' ) {
						event.preventDefault();
						event.stopPropagation();
						refocus.current = true;
						finish( false );
					}
				} }
			/>
		);
	}

	return (
		<button
			ref={ button }
			type="button"
			className="pr-studio__name pr-t-display-sm"
			aria-label={ sprintf(
				/* translators: %s: the widget's name. */
				__( 'Rename widget: %s', 'productreels' ),
				name || fallback
			) }
			onClick={ () => {
				setDraft( name );
				setEditing( true );
			} }
		>
			<span className="pr-studio__name-text">{ name || fallback }</span>
			<Icon name="pencil" size={ 15 } />
		</button>
	);
};

export const StudioHeader = ( {
	name,
	fallback = __( 'Untitled widget', 'productreels' ),
	onRename,
	dirty,
	canDiscard = dirty,
	id,
	backHref = '#/widgets',
	onDiscard,
	menuItems = [],
	onSave,
	saving,
	canSave = true,
} ) => (
	<header className="pr-studio__head">
		<a
			href={ backHref }
			className="pr-iconbtn pr-iconbtn--md"
			aria-label={ __( 'Back to widgets', 'productreels' ) }
		>
			<Icon name="arrow-left" size={ 20 } />
		</a>
		<a href={ backHref } className="pr-studio__crumb pr-t-label">
			{ __( 'Widgets', 'productreels' ) }
			<Icon name="chevron-right" size={ 14 } />
		</a>
		<NameField name={ name } fallback={ fallback } onRename={ onRename } />
		{ dirty && (
			<Badge tone="spark" dot>
				{ __( 'Unsaved changes', 'productreels' ) }
			</Badge>
		) }
		<div className="pr-studio__end">
			{ id > 0 && (
				<ShortcodeChip code={ `[productreels id="${ id }"]` } />
			) }
			<span className="pr-studio__divider" />
			<IconButton
				icon="undo"
				label={ __( 'Discard changes', 'productreels' ) }
				size="md"
				disabled={ ! canDiscard }
				onClick={ onDiscard }
			/>
			{ menuItems.length > 0 && (
				<Menu
					items={ menuItems }
					size="md"
					label={ __( 'More: duplicate or delete', 'productreels' ) }
				/>
			) }
			<Button
				variant="primary"
				size="lg"
				icon="check"
				busy={ saving }
				disabled={ ! canSave }
				aria-keyshortcuts="Control+S Meta+S"
				onClick={ onSave }
			>
				{ __( 'Save widget', 'productreels' ) }
			</Button>
		</div>
	</header>
);

/**
 * The steps. Clicking the open step folds the panel away so the stage gets
 * the width; clicking any step opens it again.
 *
 * @param {Object}   props           Props.
 * @param {string}   props.current   The open step.
 * @param {boolean}  props.panelOpen Whether the panel shows.
 * @param {number}   props.reels     How many reels the widget has.
 * @param {string}   props.panelId   The panel's id, for aria-controls.
 * @param {Function} props.onSelect  Receives a step id.
 * @return {Object} The rail.
 */
export const StudioRail = ( {
	current,
	panelOpen = true,
	reels = 0,
	panelId,
	onSelect,
} ) => {
	const item = ( step ) => {
		const active = current === step.id;

		return (
			<button
				key={ step.id }
				type="button"
				className="pr-rail__item pr-t-caption"
				aria-current={ active ? 'step' : undefined }
				aria-controls={ active ? panelId : undefined }
				aria-expanded={ active ? String( panelOpen ) : undefined }
				onClick={ () => onSelect?.( step.id ) }
			>
				<Icon name={ step.icon } size={ 20 } />
				{ step.label }
				{ step.id === 'reels' && reels > 0 && (
					<span className="pr-rail__n pr-t-caption">
						{ formatNumber( reels ) }
					</span>
				) }
			</button>
		);
	};

	return (
		<nav
			className="pr-rail"
			aria-label={ __( 'Widget settings', 'productreels' ) }
		>
			{ STUDIO_STEPS.map( item ) }
			<div className="pr-rail__sep" />
			{ item( PLACE_STEP ) }
		</nav>
	);
};

export const StudioPanel = forwardRef(
	( { id, title, description, children }, ref ) => (
		<aside
			ref={ ref }
			id={ id }
			className="pr-panel"
			aria-labelledby={ id ? `${ id }-title` : undefined }
		>
			<div className="pr-panel__head">
				<h2
					className="pr-t-title"
					id={ id ? `${ id }-title` : undefined }
				>
					{ title }
				</h2>
				{ description && <p className="pr-t-small">{ description }</p> }
			</div>
			<div className="pr-panel__body">{ children }</div>
		</aside>
	)
);

export const PanelSection = ( { title, aside, children, className } ) => (
	<section className={ cx( 'pr-panel__section', className ) }>
		{ ( title || aside ) && (
			<div className="pr-panel__sechead">
				{ title && <h3 className="pr-t-heading">{ title }</h3> }
				{ aside && <span className="pr-t-small">{ aside }</span> }
			</div>
		) }
		{ children }
	</section>
);

export const DeviceSwitch = ( { value, onChange } ) => (
	<Segmented
		variant="studio"
		iconOnly
		label={ __( 'Preview device', 'productreels' ) }
		value={ value }
		onChange={ onChange }
		options={ Object.keys( DEVICES ).map( ( key ) => ( {
			value: key,
			label: DEVICES[ key ].label,
			icon: DEVICES[ key ].icon,
		} ) ) }
	/>
);

/**
 * A browser window or phone with the page inside, laid out at the device's
 * width and zoomed to the frame. Zoom (not a transform) keeps the layout box
 * the size it looks, so the stage scrolls the right distance, and a
 * fixed-position player opened from a reel still covers the viewport.
 *
 * @param {Object}  props          Props.
 * @param {string}  props.device   desktop, tablet or mobile.
 * @param {string}  props.url      The address shown in the browser bar.
 * @param {Object}  props.children The widget.
 * @param {boolean} props.context  Placeholder page text around the widget.
 * @return {Object} The frame.
 */
export const DeviceFrame = ( {
	device = 'desktop',
	url,
	children,
	context = true,
} ) => {
	const screen = useRef( null );
	const [ zoom, setZoom ] = useState( 0 );
	const width = ( DEVICES[ device ] || DEVICES.desktop ).width;

	useLayoutEffect( () => {
		const node = screen.current;

		if ( ! node ) {
			return undefined;
		}

		const measure = () => {
			const available = node.clientWidth;

			if ( available > 0 ) {
				setZoom( Math.min( 1, available / width ) );
			}
		};

		measure();

		if ( typeof window.ResizeObserver !== 'function' ) {
			window.addEventListener( 'resize', measure );

			return () => window.removeEventListener( 'resize', measure );
		}

		const observer = new window.ResizeObserver( measure );

		observer.observe( node );

		return () => observer.disconnect();
	}, [ width ] );

	return (
		<div className={ cx( 'pr-device', `pr-device--${ device }` ) }>
			<div ref={ screen } className="pr-device__screen">
				{ device === 'mobile' ? (
					<div className="pr-device__notch" />
				) : (
					<div className="pr-device__chrome">
						<span className="pr-device__dots">
							<span />
							<span />
							<span />
						</span>
						<span className="pr-device__url pr-t-caption">
							{ url }
						</span>
						<span className="pr-device__spacer" />
					</div>
				) }
				<div
					className="pr-device__page"
					style={ {
						'--pr-device-width': `${ width }px`,
						'--pr-device-zoom': zoom || 1,
						visibility: zoom ? undefined : 'hidden',
					} }
				>
					{ context && (
						<div className="pr-skel pr-skel--title">
							<span />
						</div>
					) }
					{ children }
					{ context && device !== 'mobile' && (
						<div className="pr-device__cards" aria-hidden="true">
							<span />
							<span />
							<span />
						</div>
					) }
					{ context && (
						<div className="pr-skel pr-skel--lines">
							<span />
							<span />
							<span />
						</div>
					) }
				</div>
			</div>
		</div>
	);
};

export const Stage = ( {
	device = 'desktop',
	onDevice,
	children,
	note = __( 'Live preview', 'productreels' ),
} ) => {
	const canvas = useRef( null );

	// A new device starts at the top of its page.
	useEffect( () => {
		canvas.current?.scrollTo?.( 0, 0 );
	}, [ device ] );

	const entry = DEVICES[ device ] || DEVICES.desktop;

	return (
		<section
			className="pr-stage"
			aria-label={ __( 'Preview', 'productreels' ) }
		>
			<div className="pr-stage__bar">
				<span className="pr-stage__cap pr-t-label">
					<span className="pr-stage__live" />
					{ note }
				</span>
				<DeviceSwitch value={ device } onChange={ onDevice } />
				<span className="pr-stage__cap pr-t-label">
					{ sprintf(
						/* translators: 1: a device name, e.g. Desktop; 2: its width in pixels. */
						__( '%1$s, %2$d px', 'productreels' ),
						entry.label,
						entry.width
					) }
				</span>
			</div>
			<div ref={ canvas } className="pr-stage__canvas">
				{ children }
			</div>
		</section>
	);
};
