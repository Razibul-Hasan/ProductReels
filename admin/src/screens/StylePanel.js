/**
 * The style panel — every control that shapes a widget.
 *
 * Two tabs split the surface the way a store owner thinks about it: the
 * Thumbnail tab is what sits on the page, the Player tab is what opens when a
 * reel is clicked. Inside each, an accordion keeps the whole thing scannable:
 * someone looking for "border radius" opens Styles, not a wall of two hundred
 * inputs. Sections that only apply to one template appear only for that
 * template, rather than sitting greyed out and unexplained.
 *
 * Every control writes through `set( path, value )`, so the panel never holds
 * its own copy of the styles — the editor owns them, and the live preview and
 * the panel are always looking at the same object.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	IconAlignCenter,
	IconAlignLeft,
	IconAlignRight,
	IconCart,
	IconChevronRight,
	IconCircle,
	IconFilm,
	IconImage,
	IconLayout,
	IconPalette,
	IconRectangle,
	IconSliders,
} from '../components/icons';
import { ColorPicker } from '../components/ui/ColorPicker';
import {
	IconToggleGroup,
	Select,
	Tabs,
	VisualOptionCards,
} from '../components/ui/Choice';
import { CollapsibleSection } from '../components/ui/Feedback';
import { Switch, TextField } from '../components/ui/Fields';
import { ResponsiveSlider, Slider } from '../components/ui/Sliders';

/* Small inline previews, so the template and appearance choices read as
   pictures rather than as words. */

const TemplateArt = ( { kind } ) => {
	const shapes = {
		grid: (
			<>
				<rect x="3" y="3" width="8" height="13" rx="1.5" />
				<rect x="13" y="3" width="8" height="13" rx="1.5" />
				<rect x="23" y="3" width="8" height="13" rx="1.5" />
			</>
		),
		carousel: (
			<>
				<rect x="6" y="3" width="8" height="13" rx="1.5" />
				<rect x="16" y="3" width="8" height="13" rx="1.5" />
				<rect
					x="26"
					y="3"
					width="5"
					height="13"
					rx="1.5"
					opacity=".45"
				/>
			</>
		),
		marquee: (
			<>
				<rect
					x="1"
					y="3"
					width="7"
					height="13"
					rx="1.5"
					opacity=".45"
				/>
				<rect x="10" y="3" width="7" height="13" rx="1.5" />
				<rect x="19" y="3" width="7" height="13" rx="1.5" />
				<rect
					x="28"
					y="3"
					width="6"
					height="13"
					rx="1.5"
					opacity=".45"
				/>
			</>
		),
		stacked: (
			<>
				<rect
					x="12"
					y="6"
					width="10"
					height="12"
					rx="1.5"
					opacity=".35"
				/>
				<rect
					x="10"
					y="4"
					width="10"
					height="12"
					rx="1.5"
					opacity=".6"
				/>
				<rect x="8" y="2" width="10" height="12" rx="1.5" />
			</>
		),
		popup: (
			<>
				<rect x="2" y="2" width="30" height="15" rx="2" opacity=".25" />
				<rect x="21" y="7" width="9" height="9" rx="1.5" />
			</>
		),
	};

	return (
		<svg
			viewBox="0 0 34 20"
			width="52"
			height="30"
			fill="currentColor"
			aria-hidden="true"
		>
			{ shapes[ kind ] }
		</svg>
	);
};

const AppearanceArt = ( { kind } ) => (
	<svg
		viewBox="0 0 30 22"
		width="46"
		height="34"
		fill="none"
		aria-hidden="true"
	>
		<rect
			x="8"
			y="1"
			width="14"
			height="20"
			rx="2"
			fill="currentColor"
			opacity=".18"
		/>
		<rect
			x="8"
			y="1"
			width="14"
			height="20"
			rx="2"
			stroke="currentColor"
			strokeWidth="1.2"
		/>
		{ kind === 'overlay' && (
			<rect
				x="8"
				y="14"
				width="14"
				height="7"
				rx="1"
				fill="currentColor"
				opacity=".75"
			/>
		) }
		{ kind === 'title' && (
			<rect
				x="9"
				y="23"
				width="12"
				height="2"
				rx="1"
				fill="currentColor"
			/>
		) }
	</svg>
);

/* A quiet sub-heading inside a section, e.g. "Carousel buttons". */
const Group = ( { children } ) => (
	<p className="wr-style-panel__group">{ children }</p>
);

/**
 * Background and icon colour for a button, in its normal and hover states.
 *
 * Two tabs instead of four stacked pickers: the pair a store owner is
 * matching is always "this state's background and icon", and the tab keeps
 * that pair together.
 *
 * @param {Object}   props        Props.
 * @param {string}   props.label  Section label.
 * @param {Object}   props.styles The whole style object.
 * @param {Function} props.set    Style setter.
 * @param {Object}   props.keys   {bg, fg, hoverBg, hoverFg} style keys.
 * @return {Object} The control.
 */
const ButtonColors = ( { label, styles, set, keys } ) => {
	const [ state, setState ] = useState( 'normal' );
	const hover = state === 'hover';

	return (
		<div className="wr-button-colors">
			<span className="wr-field__label">{ label }</span>
			<Tabs
				label={ label }
				value={ state }
				onChange={ setState }
				tabs={ [
					{
						value: 'normal',
						label: __(
							'Normal',
							'productreels'
						),
					},
					{
						value: 'hover',
						label: __(
							'Hover',
							'productreels'
						),
					},
				] }
			/>
			<ColorPicker
				label={ __(
					'Background',
					'productreels'
				) }
				value={ styles[ hover ? keys.hoverBg : keys.bg ] }
				onChange={ ( value ) =>
					set( hover ? keys.hoverBg : keys.bg, value )
				}
			/>
			<ColorPicker
				label={ __(
					'Icon Color',
					'productreels'
				) }
				value={ styles[ hover ? keys.hoverFg : keys.fg ] }
				onChange={ ( value ) =>
					set( hover ? keys.hoverFg : keys.fg, value )
				}
			/>
		</div>
	);
};

/* ------------------------------------------------------------ Thumbnail */

const LayoutSection = ( { styles, set, setDevice } ) => {
	const template = styles.template;
	// Marquee runs edge to edge and popup is pinned to a corner; neither has
	// anything to align.
	const alignable = 'marquee' !== template && 'popup' !== template;

	/* The responsive sliders edit a bucket per device, so they need the three
	   keys grouped and handed back individually. */
	const responsive = ( keys ) => ( {
		desktop: styles[ keys[ 0 ] ],
		tablet: styles[ keys[ 1 ] ],
		mobile: styles[ keys[ 2 ] ],
	} );

	const setResponsive = ( keys ) => ( which, value ) => {
		set( keys[ { desktop: 0, tablet: 1, mobile: 2 }[ which ] ], value );
		setDevice( which );
	};

	return (
		<CollapsibleSection
			title={ __(
				'Layout',
				'productreels'
			) }
			icon={ IconLayout }
			defaultOpen
		>
			<VisualOptionCards
				label={ __(
					'Template',
					'productreels'
				) }
				value={ template }
				onChange={ ( value ) => set( 'template', value ) }
				options={ [
					{
						value: 'grid',
						label: __(
							'Grid',
							'productreels'
						),
						preview: <TemplateArt kind="grid" />,
					},
					{
						value: 'carousel',
						label: __(
							'Carousel',
							'productreels'
						),
						preview: <TemplateArt kind="carousel" />,
					},
					{
						value: 'marquee',
						label: __(
							'Marquee',
							'productreels'
						),
						preview: <TemplateArt kind="marquee" />,
					},
					{
						value: 'stacked',
						label: __(
							'Stacked',
							'productreels'
						),
						preview: <TemplateArt kind="stacked" />,
					},
					{
						value: 'popup',
						label: __(
							'Popup',
							'productreels'
						),
						preview: <TemplateArt kind="popup" />,
					},
				] }
			/>

			<IconToggleGroup
				label={ __(
					'Shape',
					'productreels'
				) }
				value={ styles.shape }
				onChange={ ( value ) => set( 'shape', value ) }
				options={ [
					{
						value: 'rectangle',
						label: __(
							'Rectangle',
							'productreels'
						),
						icon: IconRectangle,
					},
					{
						value: 'circle',
						label: __(
							'Circle',
							'productreels'
						),
						icon: IconCircle,
					},
				] }
			/>

			{ alignable && (
				<IconToggleGroup
					label={ __(
						'Alignment',
						'productreels'
					) }
					help={ __(
						'Where the reels sit when they do not fill the width.',
						'productreels'
					) }
					value={ styles.alignment }
					onChange={ ( value ) => set( 'alignment', value ) }
					options={ [
						{
							value: 'left',
							label: __(
								'Left',
								'productreels'
							),
							icon: IconAlignLeft,
						},
						{
							value: 'center',
							label: __(
								'Center',
								'productreels'
							),
							icon: IconAlignCenter,
						},
						{
							value: 'right',
							label: __(
								'Right',
								'productreels'
							),
							icon: IconAlignRight,
						},
					] }
				/>
			) }

			<ResponsiveSlider
				label={ __(
					'Size',
					'productreels'
				) }
				min={ 80 }
				max={ 400 }
				values={ responsive( [ 'size', 'sizeOnTab', 'sizeOnMobile' ] ) }
				onChange={ setResponsive( [
					'size',
					'sizeOnTab',
					'sizeOnMobile',
				] ) }
				defaults={ { desktop: 200, tablet: 150, mobile: 150 } }
			/>

			<ResponsiveSlider
				label={ __(
					'Gap',
					'productreels'
				) }
				min={ 0 }
				max={ 64 }
				values={ responsive( [ 'gap', 'gapOnTab', 'gapOnMobile' ] ) }
				onChange={ setResponsive( [
					'gap',
					'gapOnTab',
					'gapOnMobile',
				] ) }
				defaults={ { desktop: 16, tablet: 16, mobile: 16 } }
			/>

			<Slider
				label={ __(
					'Top/bottom spacing',
					'productreels'
				) }
				min={ 0 }
				max={ 120 }
				value={ styles.topBottomSpacing }
				onChange={ ( value ) => set( 'topBottomSpacing', value ) }
				onReset={ () => set( 'topBottomSpacing', 0 ) }
			/>

			{ 'carousel' === template && (
				<Select
					label={ __(
						'Button position',
						'productreels'
					) }
					help={ __(
						'Where the previous and next buttons sit on the rail.',
						'productreels'
					) }
					value={ styles.carouselBtnPosition }
					onChange={ ( value ) =>
						set( 'carouselBtnPosition', value )
					}
					options={ [
						{
							value: 'inside',
							label: __(
								'Inside',
								'productreels'
							),
						},
						{
							value: 'outside',
							label: __(
								'Outside',
								'productreels'
							),
						},
					] }
				/>
			) }

			{ 'marquee' === template && (
				<>
					<Group>
						{ __(
							'Marquee',
							'productreels'
						) }
					</Group>
					<Slider
						label={ __(
							'Speed',
							'productreels'
						) }
						min={ 5 }
						max={ 200 }
						unit="px/s"
						value={ styles.marquee.speed }
						onChange={ ( value ) => set( 'marquee.speed', value ) }
						onReset={ () => set( 'marquee.speed', 40 ) }
					/>
					<IconToggleGroup
						label={ __(
							'Direction',
							'productreels'
						) }
						value={ styles.marquee.direction }
						onChange={ ( value ) =>
							set( 'marquee.direction', value )
						}
						options={ [
							{
								value: 'left',
								label: __(
									'Left',
									'productreels'
								),
							},
							{
								value: 'right',
								label: __(
									'Right',
									'productreels'
								),
							},
						] }
					/>
					<Switch
						label={ __(
							'Pause on hover',
							'productreels'
						) }
						checked={ styles.marquee.pauseOnHover }
						onChange={ ( value ) =>
							set( 'marquee.pauseOnHover', value )
						}
					/>
				</>
			) }

			{ 'stacked' === template && (
				<>
					<Group>
						{ __(
							'Stack',
							'productreels'
						) }
					</Group>
					<Slider
						label={ __(
							'Depth',
							'productreels'
						) }
						min={ 2 }
						max={ 5 }
						unit=""
						value={ styles.stacked.depth }
						onChange={ ( value ) => set( 'stacked.depth', value ) }
						onReset={ () => set( 'stacked.depth', 3 ) }
					/>
					<Slider
						label={ __(
							'Offset',
							'productreels'
						) }
						min={ 0 }
						max={ 80 }
						value={ styles.stacked.offset }
						onChange={ ( value ) => set( 'stacked.offset', value ) }
						onReset={ () => set( 'stacked.offset', 24 ) }
					/>
					<Slider
						label={ __(
							'Scale',
							'productreels'
						) }
						min={ 0.5 }
						max={ 1 }
						step={ 0.01 }
						unit=""
						value={ styles.stacked.scale }
						onChange={ ( value ) => set( 'stacked.scale', value ) }
						onReset={ () => set( 'stacked.scale', 0.92 ) }
					/>
				</>
			) }

			{ 'popup' === template && (
				<>
					<Group>
						{ __(
							'Popup',
							'productreels'
						) }
					</Group>
					<Select
						label={ __(
							'Trigger',
							'productreels'
						) }
						value={ styles.popup.trigger }
						onChange={ ( value ) => set( 'popup.trigger', value ) }
						options={ [
							{
								value: 'load',
								label: __(
									'Initial Page Load',
									'productreels'
								),
							},
							{
								value: 'delay',
								label: __(
									'After Some Time',
									'productreels'
								),
							},
							{
								value: 'scroll',
								label: __(
									'After Scrolling Distance',
									'productreels'
								),
							},
						] }
					/>
					{ 'delay' === styles.popup.trigger && (
						<Slider
							label={ __(
								'Delay',
								'productreels'
							) }
							min={ 0 }
							max={ 60 }
							unit="s"
							value={ styles.popup.delaySeconds }
							onChange={ ( value ) =>
								set( 'popup.delaySeconds', value )
							}
							onReset={ () => set( 'popup.delaySeconds', 5 ) }
						/>
					) }
					{ 'scroll' === styles.popup.trigger && (
						<Slider
							label={ __(
								'Scroll',
								'productreels'
							) }
							min={ 0 }
							max={ 100 }
							unit="%"
							value={ styles.popup.scrollPercent }
							onChange={ ( value ) =>
								set( 'popup.scrollPercent', value )
							}
							onReset={ () => set( 'popup.scrollPercent', 30 ) }
						/>
					) }
					<Select
						label={ __(
							'Position',
							'productreels'
						) }
						value={ styles.popup.position }
						onChange={ ( value ) => set( 'popup.position', value ) }
						options={ [
							{
								value: 'bottom-right',
								label: __(
									'Bottom right',
									'productreels'
								),
							},
							{
								value: 'bottom-left',
								label: __(
									'Bottom left',
									'productreels'
								),
							},
							{
								value: 'top-right',
								label: __(
									'Top right',
									'productreels'
								),
							},
							{
								value: 'top-left',
								label: __(
									'Top left',
									'productreels'
								),
							},
						] }
					/>
					<Switch
						label={ __(
							'Show on mobile',
							'productreels'
						) }
						checked={ styles.popup.showOnMobile }
						onChange={ ( value ) =>
							set( 'popup.showOnMobile', value )
						}
					/>
					<Select
						label={ __(
							'After closing, show again',
							'productreels'
						) }
						help={ __(
							'How long a visitor who closes the popup goes without seeing it.',
							'productreels'
						) }
						value={ styles.popup.dismissFor || 'session' }
						onChange={ ( value ) =>
							set( 'popup.dismissFor', value )
						}
						options={ [
							{
								value: 'page',
								label: __(
									'On the next page',
									'productreels'
								),
							},
							{
								value: 'session',
								label: __(
									'On their next visit',
									'productreels'
								),
							},
							{
								value: 'day',
								label: __(
									'After 1 day',
									'productreels'
								),
							},
							{
								value: 'week',
								label: __(
									'After 7 days',
									'productreels'
								),
							},
							{
								value: 'month',
								label: __(
									'After 30 days',
									'productreels'
								),
							},
						] }
					/>
				</>
			) }
		</CollapsibleSection>
	);
};

const ThumbnailSection = ( { styles, set } ) => {
	// "Off" is the click behaviour; the old disable flag is cleared with it so
	// a stored widget can never show "hover" and then not preview.
	const preview = styles.disablePreview ? 'click' : styles.playBehavior;

	const setPreview = ( value ) =>
		set( { playBehavior: value, disablePreview: false } );

	// A circle has no overlay: its title sits underneath, so the three
	// appearances collapse to one switch. Either title-bearing appearance
	// reads as "on"; the switch writes the plain ones.
	const circle = 'circle' === styles.shape;
	const circleTitle =
		'title' === styles.appearance ||
		( 'overlay' === styles.appearance && styles.showFallbackTitle );

	const titleColor = (
		<ColorPicker
			label={ __(
				'Title Color',
				'productreels'
			) }
			value={ styles.titleColor }
			onChange={ ( value ) => set( 'titleColor', value ) }
		/>
	);

	return (
		<CollapsibleSection
			title={ __(
				'Thumbnail',
				'productreels'
			) }
			icon={ IconImage }
		>
			{ circle && (
				<>
					<Switch
						label={ __(
							'Reel Title',
							'productreels'
						) }
						help={ __(
							'Show the reel title under the circle.',
							'productreels'
						) }
						checked={ circleTitle }
						onChange={ ( value ) =>
							set( 'appearance', value ? 'title' : 'none' )
						}
					/>
					{ circleTitle && titleColor }
				</>
			) }

			{ ! circle && (
				<VisualOptionCards
					label={ __(
						'Appearance',
						'productreels'
					) }
					value={ styles.appearance }
					onChange={ ( value ) => set( 'appearance', value ) }
					options={ [
						{
							value: 'overlay',
							label: __(
								'Overlay',
								'productreels'
							),
							preview: <AppearanceArt kind="overlay" />,
						},
						{
							value: 'title',
							label: __(
								'Only Title',
								'productreels'
							),
							preview: <AppearanceArt kind="title" />,
						},
						{
							value: 'none',
							label: __(
								'None',
								'productreels'
							),
							preview: <AppearanceArt kind="none" />,
						},
					] }
				/>
			) }

			{ ! circle && 'title' === styles.appearance && titleColor }

			{ ! circle && 'overlay' === styles.appearance && (
				<>
					<Switch
						label={ __(
							'Reel Title',
							'productreels'
						) }
						help={ __(
							'Show the reel title on the thumbnail. A reel tagged with a product shows the product card instead.',
							'productreels'
						) }
						checked={ styles.showFallbackTitle }
						onChange={ ( value ) =>
							set( 'showFallbackTitle', value )
						}
					/>
					<ColorPicker
						label={ __(
							'Title Color',
							'productreels'
						) }
						value={ styles.captionColor }
						onChange={ ( value ) => set( 'captionColor', value ) }
					/>
					<ColorPicker
						label={ __(
							'Overlay Color',
							'productreels'
						) }
						help={ __(
							'Fades to transparent towards the top. Supports transparency.',
							'productreels'
						) }
						value={ styles.overlayColor }
						onChange={ ( value ) => set( 'overlayColor', value ) }
					/>
				</>
			) }

			<Select
				label={ __(
					'Preview',
					'productreels'
				) }
				help={ __(
					'Play the video silently on the thumbnail itself.',
					'productreels'
				) }
				value={ preview }
				onChange={ setPreview }
				options={ [
					{
						value: 'click',
						label: __(
							'Off — open on click',
							'productreels'
						),
					},
					{
						value: 'hover',
						label: __(
							'Play on hover',
							'productreels'
						),
					},
					{
						value: 'autoplay',
						label: __(
							'Autoplay when visible',
							'productreels'
						),
					},
				] }
			/>

			<Select
				label={ __(
					'Hover effect',
					'productreels'
				) }
				value={ styles.hoverEffect }
				onChange={ ( value ) => set( 'hoverEffect', value ) }
				options={ [
					{
						value: 'none',
						label: __(
							'None',
							'productreels'
						),
					},
					{
						value: 'zoom-in',
						label: __(
							'Zoom in',
							'productreels'
						),
					},
					{
						value: 'zoom-out',
						label: __(
							'Zoom out',
							'productreels'
						),
					},
					{
						value: 'lift',
						label: __(
							'Lift',
							'productreels'
						),
					},
				] }
			/>

			<Group>
				{ __(
					'Play button',
					'productreels'
				) }
			</Group>
			<Switch
				label={ __(
					'Show Play Button',
					'productreels'
				) }
				checked={ styles.showPlayButton }
				onChange={ ( value ) => set( 'showPlayButton', value ) }
			/>

			{ styles.showPlayButton && (
				<>
					<Slider
						label={ __(
							'Play Icon Size',
							'productreels'
						) }
						min={ 16 }
						max={ 120 }
						value={ styles.playIconSize }
						onChange={ ( value ) => set( 'playIconSize', value ) }
						onReset={ () => set( 'playIconSize', 40 ) }
					/>
					<ColorPicker
						label={ __(
							'Play Icon Color',
							'productreels'
						) }
						value={ styles.playIconColor }
						onChange={ ( value ) => set( 'playIconColor', value ) }
					/>
				</>
			) }

			<Group>
				{ __(
					'View count',
					'productreels'
				) }
			</Group>
			<Switch
				label={ __(
					'Show Views',
					'productreels'
				) }
				checked={ styles.showViews }
				onChange={ ( value ) => set( 'showViews', value ) }
			/>

			{ styles.showViews && (
				<>
					<ColorPicker
						label={ __(
							'Background',
							'productreels'
						) }
						value={ styles.viewsBgColor }
						onChange={ ( value ) => set( 'viewsBgColor', value ) }
					/>
					<ColorPicker
						label={ __(
							'Text & Icon Color',
							'productreels'
						) }
						value={ styles.viewsTextIconColor }
						onChange={ ( value ) =>
							set( 'viewsTextIconColor', value )
						}
					/>
				</>
			) }
		</CollapsibleSection>
	);
};

const StylesSection = ( { styles, set, setDevice } ) => {
	const template = styles.template;

	return (
		<CollapsibleSection
			title={ __(
				'Styles',
				'productreels'
			) }
			icon={ IconPalette }
		>
			<Slider
				label={ __(
					'Border Width',
					'productreels'
				) }
				min={ 0 }
				max={ 20 }
				value={ styles.border.width }
				onChange={ ( value ) => set( 'border.width', value ) }
				onReset={ () => set( 'border.width', 2 ) }
			/>

			<ColorPicker
				label={ __(
					'Border Color',
					'productreels'
				) }
				value={ styles.border.color }
				onChange={ ( value ) => set( 'border.color', value ) }
			/>

			<ResponsiveSlider
				label={ __(
					'Border Radius',
					'productreels'
				) }
				min={ 0 }
				max={ 100 }
				values={ {
					desktop: styles.border.radius,
					tablet: styles.border.radiusOnTab,
					mobile: styles.border.radiusOnMobile,
				} }
				onChange={ ( which, value ) => {
					set(
						{
							desktop: 'border.radius',
							tablet: 'border.radiusOnTab',
							mobile: 'border.radiusOnMobile',
						}[ which ],
						value
					);
					setDevice( which );
				} }
				defaults={ { desktop: 6, tablet: 6, mobile: 6 } }
			/>

			<Slider
				label={ __(
					'Shadow',
					'productreels'
				) }
				min={ 0 }
				max={ 100 }
				value={ styles.shadow.size }
				onChange={ ( value ) => set( 'shadow.size', value ) }
				onReset={ () => set( 'shadow.size', 16 ) }
			/>

			<ColorPicker
				label={ __(
					'Background Color',
					'productreels'
				) }
				help={ __(
					'Supports transparency.',
					'productreels'
				) }
				value={ styles.cardBgColor }
				onChange={ ( value ) => set( 'cardBgColor', value ) }
			/>

			{ ( 'carousel' === template || 'stacked' === template ) && (
				<>
					<Group>
						{ __(
							'Carousel buttons',
							'productreels'
						) }
					</Group>
					<Slider
						label={ __(
							'Border Radius',
							'productreels'
						) }
						min={ 0 }
						max={ 100 }
						value={ styles.carouselBtnBorderRadius }
						onChange={ ( value ) =>
							set( 'carouselBtnBorderRadius', value )
						}
						onReset={ () => set( 'carouselBtnBorderRadius', 40 ) }
					/>
					<ButtonColors
						label={ __(
							'Button Colors',
							'productreels'
						) }
						styles={ styles }
						set={ set }
						keys={ {
							bg: 'carouselBtnBgColor',
							fg: 'carouselBtnIconColor',
							hoverBg: 'carouselBtnHoverBgColor',
							hoverFg: 'carouselBtnHoverIconColor',
						} }
					/>
				</>
			) }
		</CollapsibleSection>
	);
};

const AdvancedSection = ( { styles, set } ) => (
	<CollapsibleSection
		title={ __(
			'Advanced',
			'productreels'
		) }
		icon={ IconSliders }
	>
		<Switch
			label={ __(
				'Lazy load videos',
				'productreels'
			) }
			help={ __(
				'Defers video loading to reduce initial page weight.',
				'productreels'
			) }
			checked={ styles.lazyLoad }
			onChange={ ( value ) => set( 'lazyLoad', value ) }
		/>

		<TextField
			label={ __(
				'Custom class',
				'productreels'
			) }
			help={ __(
				'Added to the widget wrapper, for your own CSS. Separate several with spaces.',
				'productreels'
			) }
			value={ styles.customClass || '' }
			placeholder="my-reels"
			onChange={ ( value ) => set( 'customClass', value ) }
		/>
	</CollapsibleSection>
);

/* --------------------------------------------------------------- Player */

const PlayerAppearanceSection = ( { styles, set } ) => (
	<CollapsibleSection
		title={ __(
			'Appearance',
			'productreels'
		) }
		icon={ IconImage }
		defaultOpen
	>
		<VisualOptionCards
			label={ __(
				'Appearance',
				'productreels'
			) }
			value={ styles.playerAppearance }
			onChange={ ( value ) => set( 'playerAppearance', value ) }
			options={ [
				{
					value: 'overlay',
					label: __(
						'Overlay',
						'productreels'
					),
					preview: <AppearanceArt kind="overlay" />,
				},
				{
					value: 'title',
					label: __(
						'Only Title',
						'productreels'
					),
					preview: <AppearanceArt kind="title" />,
				},
				{
					value: 'none',
					label: __(
						'None',
						'productreels'
					),
					preview: <AppearanceArt kind="none" />,
				},
			] }
		/>

		{ 'overlay' === styles.playerAppearance && (
			<Switch
				label={ __(
					'Reel Title',
					'productreels'
				) }
				help={ __(
					'Show the reel title when it has no button to show instead.',
					'productreels'
				) }
				checked={ styles.showPlayerFallbackTitle }
				onChange={ ( value ) =>
					set( 'showPlayerFallbackTitle', value )
				}
			/>
		) }
	</CollapsibleSection>
);

const PlaybackSection = ( { styles, set } ) => (
	<CollapsibleSection
		title={ __(
			'Playback',
			'productreels'
		) }
		icon={ IconFilm }
	>
		<IconToggleGroup
			label={ __(
				'Slide direction',
				'productreels'
			) }
			help={ __(
				'How visitors move between reels: sideways, or up and down like a feed.',
				'productreels'
			) }
			value={ styles.slideDirection }
			onChange={ ( value ) => set( 'slideDirection', value ) }
			options={ [
				{
					value: 'horizontal',
					label: __(
						'Horizontal',
						'productreels'
					),
				},
				{
					value: 'vertical',
					label: __(
						'Vertical',
						'productreels'
					),
				},
			] }
		/>

		<Switch
			label={ __(
				'Play with sound',
				'productreels'
			) }
			help={ __(
				'Start with sound on. Visitors can still mute or unmute anytime while watching.',
				'productreels'
			) }
			checked={ styles.playWithSound }
			onChange={ ( value ) => set( 'playWithSound', value ) }
		/>

		<Switch
			label={ __(
				'Loop',
				'productreels'
			) }
			help={ __(
				'Replay the reel when it ends instead of moving to the next one.',
				'productreels'
			) }
			checked={ styles.loop }
			onChange={ ( value ) => set( 'loop', value ) }
		/>

		<Switch
			label={ __(
				'Show seekbar',
				'productreels'
			) }
			checked={ styles.showSeekbar }
			onChange={ ( value ) => set( 'showSeekbar', value ) }
		/>

		<Switch
			label={ __(
				'Show volume control',
				'productreels'
			) }
			checked={ styles.showVolumeControl }
			onChange={ ( value ) => set( 'showVolumeControl', value ) }
		/>
	</CollapsibleSection>
);

const NavButtonsSection = ( { styles, set } ) => (
	<CollapsibleSection
		title={ __(
			'Navigation Buttons',
			'productreels'
		) }
		icon={ IconChevronRight }
	>
		<ButtonColors
			label={ __(
				'Button Colors',
				'productreels'
			) }
			styles={ styles }
			set={ set }
			keys={ {
				bg: 'previewBtnBgColor',
				fg: 'previewBtnIconColor',
				hoverBg: 'previewBtnHoverBgColor',
				hoverFg: 'previewBtnHoverIconColor',
			} }
		/>
		<Slider
			label={ __(
				'Border Radius',
				'productreels'
			) }
			min={ 0 }
			max={ 100 }
			value={ styles.previewBtnBorderRadius }
			onChange={ ( value ) => set( 'previewBtnBorderRadius', value ) }
			onReset={ () => set( 'previewBtnBorderRadius', 40 ) }
		/>
	</CollapsibleSection>
);

const ProductCardSection = ( { styles, set } ) => (
	<CollapsibleSection
		title={ __(
			'Product Card',
			'productreels'
		) }
		icon={ IconCart }
	>
		<VisualOptionCards
			label={ __(
				'Style',
				'productreels'
			) }
			help={ __(
				'Used on the thumbnail and in the player.',
				'productreels'
			) }
			value={ styles.productCardStyle }
			onChange={ ( value ) => set( 'productCardStyle', value ) }
			options={ [
				{
					value: 'modern',
					label: __(
						'Modern',
						'productreels'
					),
					help: __(
						'Image, name and price on one compact row.',
						'productreels'
					),
					preview: <AppearanceArt kind="overlay" />,
				},
				{
					value: 'classic',
					label: __(
						'Classic',
						'productreels'
					),
					help: __(
						'Larger card with the image above the details.',
						'productreels'
					),
					preview: <AppearanceArt kind="title" />,
				},
			] }
		/>

		<Switch
			label={ __(
				'Show Ratings',
				'productreels'
			) }
			checked={ styles.showRatings }
			onChange={ ( value ) => set( 'showRatings', value ) }
		/>

		{ /* One button at a time: switching either on switches the other off,
		     so the card never has to choose between two buy actions. */ }
		<Switch
			label={ __(
				'Show Add to Cart',
				'productreels'
			) }
			help={ __(
				'Adds the product and keeps the shopper on the page.',
				'productreels'
			) }
			checked={ styles.showAddToCart }
			onChange={ ( value ) =>
				set(
					value
						? { showAddToCart: true, directCheckout: false }
						: { showAddToCart: false }
				)
			}
		/>

		{ styles.showAddToCart && (
			<TextField
				label={ __(
					'Button Text',
					'productreels'
				) }
				value={ styles.addToCartText }
				onChange={ ( value ) => set( 'addToCartText', value ) }
			/>
		) }

		<Switch
			label={ __(
				'Direct Checkout',
				'productreels'
			) }
			help={ __(
				'Adds the product and sends the shopper straight to checkout. Turning this on turns Add to Cart off.',
				'productreels'
			) }
			checked={ styles.directCheckout }
			onChange={ ( value ) =>
				set(
					value
						? { directCheckout: true, showAddToCart: false }
						: { directCheckout: false }
				)
			}
		/>

		{ styles.directCheckout && (
			<TextField
				label={ __(
					'Button Text',
					'productreels'
				) }
				value={ styles.directCheckoutText }
				onChange={ ( value ) => set( 'directCheckoutText', value ) }
			/>
		) }
	</CollapsibleSection>
);

/* ---------------------------------------------------------------- Panel */

export const StylePanel = ( { styles, set, setDevice } ) => {
	const [ tab, setTab ] = useState( 'thumbnail' );
	const tabs = [
		{
			value: 'thumbnail',
			label: __(
				'Thumbnail',
				'productreels'
			),
			hint: __(
				'What visitors see on the page.',
				'productreels'
			),
		},
		{
			value: 'player',
			label: __(
				'Player',
				'productreels'
			),
			hint: __(
				'What opens when a reel is clicked.',
				'productreels'
			),
		},
	];
	const current = tabs.find( ( entry ) => entry.value === tab ) || tabs[ 0 ];
	const props = { styles, set, setDevice };

	return (
		<div className="wr-style-panel">
			<div className="wr-style-panel__tabs">
				<Tabs
					label={ __(
						'Customize',
						'productreels'
					) }
					value={ tab }
					onChange={ setTab }
					tabs={ tabs }
				/>
				<p className="wr-style-panel__hint">{ current.hint }</p>
			</div>

			{ 'thumbnail' === tab && (
				<>
					<LayoutSection { ...props } />
					<ThumbnailSection { ...props } />
					<StylesSection { ...props } />
					<AdvancedSection { ...props } />
				</>
			) }

			{ 'player' === tab && (
				<>
					<PlayerAppearanceSection { ...props } />
					<PlaybackSection { ...props } />
					<NavButtonsSection { ...props } />
					<ProductCardSection { ...props } />
				</>
			) }
		</div>
	);
};
