/**
 * The style panel — every control that shapes a widget.
 *
 * Organised as an accordion so the whole surface is scannable: a store owner
 * looking for "border radius" opens Thumbnail, not a wall of two hundred
 * inputs. Sections that only apply to one template appear only for that
 * template, rather than sitting greyed out and unexplained.
 *
 * Every control writes through `set( path, value )`, so the panel never holds
 * its own copy of the styles — the editor owns them, and the live preview and
 * the panel are always looking at the same object.
 */

import { __ } from '@wordpress/i18n';
import { IconCircle, IconRectangle } from '../components/icons';
import { ColorPicker } from '../components/ui/ColorPicker';
import {
	IconToggleGroup,
	Select,
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

export const StylePanel = ( { styles, set, setDevice } ) => {
	const template = styles.template;

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
		<div className="wr-style-panel">
			<CollapsibleSection
				title={ __( 'Layout', 'wooreels' ) }
				defaultOpen
			>
				<VisualOptionCards
					label={ __( 'Layout', 'wooreels' ) }
					value={ template }
					onChange={ ( value ) => set( 'template', value ) }
					options={ [
						{
							value: 'grid',
							label: __( 'Grid', 'wooreels' ),
							preview: <TemplateArt kind="grid" />,
						},
						{
							value: 'carousel',
							label: __( 'Carousel', 'wooreels' ),
							preview: <TemplateArt kind="carousel" />,
						},
						{
							value: 'marquee',
							label: __( 'Marquee', 'wooreels' ),
							preview: <TemplateArt kind="marquee" />,
						},
						{
							value: 'stacked',
							label: __( 'Stacked', 'wooreels' ),
							preview: <TemplateArt kind="stacked" />,
						},
						{
							value: 'popup',
							label: __( 'Popup', 'wooreels' ),
							preview: <TemplateArt kind="popup" />,
						},
					] }
				/>

				<IconToggleGroup
					label={ __( 'Shape', 'wooreels' ) }
					value={ styles.shape }
					onChange={ ( value ) => set( 'shape', value ) }
					options={ [
						{
							value: 'rectangle',
							label: __( 'Rectangle', 'wooreels' ),
							icon: IconRectangle,
						},
						{
							value: 'circle',
							label: __( 'Circle', 'wooreels' ),
							icon: IconCircle,
						},
					] }
				/>

				<ResponsiveSlider
					label={ __( 'Size', 'wooreels' ) }
					min={ 80 }
					max={ 400 }
					values={ responsive( [
						'size',
						'sizeOnTab',
						'sizeOnMobile',
					] ) }
					onChange={ setResponsive( [
						'size',
						'sizeOnTab',
						'sizeOnMobile',
					] ) }
					defaults={ { desktop: 200, tablet: 150, mobile: 150 } }
				/>

				<ResponsiveSlider
					label={ __( 'Gap', 'wooreels' ) }
					min={ 0 }
					max={ 64 }
					values={ responsive( [
						'gap',
						'gapOnTab',
						'gapOnMobile',
					] ) }
					onChange={ setResponsive( [
						'gap',
						'gapOnTab',
						'gapOnMobile',
					] ) }
					defaults={ { desktop: 16, tablet: 16, mobile: 16 } }
				/>

				<Slider
					label={ __( 'Top/bottom spacing', 'wooreels' ) }
					min={ 0 }
					max={ 120 }
					value={ styles.topBottomSpacing }
					onChange={ ( value ) => set( 'topBottomSpacing', value ) }
					onReset={ () => set( 'topBottomSpacing', 0 ) }
				/>

				{ 'carousel' === template && (
					<Select
						label={ __( 'Position', 'wooreels' ) }
						help={ __(
							'Where the previous and next buttons sit on the rail.',
							'wooreels'
						) }
						value={ styles.carouselBtnPosition }
						onChange={ ( value ) =>
							set( 'carouselBtnPosition', value )
						}
						options={ [
							{
								value: 'inside',
								label: __( 'Inside', 'wooreels' ),
							},
							{
								value: 'outside',
								label: __( 'Outside', 'wooreels' ),
							},
						] }
					/>
				) }

				{ 'marquee' === template && (
					<>
						<Slider
							label={ __( 'Speed', 'wooreels' ) }
							min={ 5 }
							max={ 200 }
							unit="px/s"
							value={ styles.marquee.speed }
							onChange={ ( value ) =>
								set( 'marquee.speed', value )
							}
							onReset={ () => set( 'marquee.speed', 40 ) }
						/>
						<IconToggleGroup
							label={ __( 'Position', 'wooreels' ) }
							value={ styles.marquee.direction }
							onChange={ ( value ) =>
								set( 'marquee.direction', value )
							}
							options={ [
								{
									value: 'left',
									label: __( 'Left', 'wooreels' ),
								},
								{
									value: 'right',
									label: __( 'Right', 'wooreels' ),
								},
							] }
						/>
						<Switch
							label={ __( 'Pause on hover', 'wooreels' ) }
							checked={ styles.marquee.pauseOnHover }
							onChange={ ( value ) =>
								set( 'marquee.pauseOnHover', value )
							}
						/>
					</>
				) }

				{ 'stacked' === template && (
					<>
						<Slider
							label={ __( 'Depth', 'wooreels' ) }
							min={ 2 }
							max={ 5 }
							unit=""
							value={ styles.stacked.depth }
							onChange={ ( value ) =>
								set( 'stacked.depth', value )
							}
							onReset={ () => set( 'stacked.depth', 3 ) }
						/>
						<Slider
							label={ __( 'Offset', 'wooreels' ) }
							min={ 0 }
							max={ 80 }
							value={ styles.stacked.offset }
							onChange={ ( value ) =>
								set( 'stacked.offset', value )
							}
							onReset={ () => set( 'stacked.offset', 24 ) }
						/>
						<Slider
							label={ __( 'Scale', 'wooreels' ) }
							min={ 0.5 }
							max={ 1 }
							step={ 0.01 }
							unit=""
							value={ styles.stacked.scale }
							onChange={ ( value ) =>
								set( 'stacked.scale', value )
							}
							onReset={ () => set( 'stacked.scale', 0.92 ) }
						/>
					</>
				) }

				{ 'popup' === template && (
					<>
						<Select
							label={ __( 'Trigger', 'wooreels' ) }
							value={ styles.popup.trigger }
							onChange={ ( value ) =>
								set( 'popup.trigger', value )
							}
							options={ [
								{
									value: 'load',
									label: __(
										'Initial Page Load',
										'wooreels'
									),
								},
								{
									value: 'delay',
									label: __( 'After Some Time', 'wooreels' ),
								},
								{
									value: 'scroll',
									label: __(
										'After Scrolling Distance',
										'wooreels'
									),
								},
							] }
						/>
						{ 'delay' === styles.popup.trigger && (
							<Slider
								label={ __( 'Delay', 'wooreels' ) }
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
								label={ __( 'Scroll', 'wooreels' ) }
								min={ 0 }
								max={ 100 }
								unit="%"
								value={ styles.popup.scrollPercent }
								onChange={ ( value ) =>
									set( 'popup.scrollPercent', value )
								}
								onReset={ () =>
									set( 'popup.scrollPercent', 30 )
								}
							/>
						) }
						<Select
							label={ __( 'Position', 'wooreels' ) }
							value={ styles.popup.position }
							onChange={ ( value ) =>
								set( 'popup.position', value )
							}
							options={ [
								{
									value: 'bottom-right',
									label: __( 'Bottom right', 'wooreels' ),
								},
								{
									value: 'bottom-left',
									label: __( 'Bottom left', 'wooreels' ),
								},
								{
									value: 'top-right',
									label: __( 'Top right', 'wooreels' ),
								},
								{
									value: 'top-left',
									label: __( 'Top left', 'wooreels' ),
								},
							] }
						/>
						<Slider
							label={ __( 'Size', 'wooreels' ) }
							min={ 80 }
							max={ 400 }
							value={ styles.popup.size }
							onChange={ ( value ) => set( 'popup.size', value ) }
							onReset={ () => set( 'popup.size', 180 ) }
						/>
						<Switch
							label={ __( 'Show on mobile', 'wooreels' ) }
							checked={ styles.popup.showOnMobile }
							onChange={ ( value ) =>
								set( 'popup.showOnMobile', value )
							}
						/>
					</>
				) }
			</CollapsibleSection>

			<CollapsibleSection title={ __( 'Thumbnail', 'wooreels' ) }>
				<VisualOptionCards
					label={ __( 'Appearance', 'wooreels' ) }
					value={ styles.appearance }
					onChange={ ( value ) => set( 'appearance', value ) }
					options={ [
						{
							value: 'overlay',
							label: __( 'Overlay', 'wooreels' ),
							preview: <AppearanceArt kind="overlay" />,
						},
						{
							value: 'title',
							label: __( 'Only Title', 'wooreels' ),
							preview: <AppearanceArt kind="title" />,
						},
						{
							value: 'none',
							label: __( 'None', 'wooreels' ),
							preview: <AppearanceArt kind="none" />,
						},
					] }
				/>

				{ 'overlay' === styles.appearance && (
					<Switch
						label={ __( 'Reel Title', 'wooreels' ) }
						help={ __(
							'Show the reel title when it has no button to show instead.',
							'wooreels'
						) }
						checked={ styles.showFallbackTitle }
						onChange={ ( value ) =>
							set( 'showFallbackTitle', value )
						}
					/>
				) }

				<Select
					label={ __( 'Hover effect', 'wooreels' ) }
					value={ styles.hoverEffect }
					onChange={ ( value ) => set( 'hoverEffect', value ) }
					options={ [
						{ value: 'none', label: __( 'None', 'wooreels' ) },
						{
							value: 'zoom-in',
							label: __( 'Zoom in', 'wooreels' ),
						},
						{
							value: 'zoom-out',
							label: __( 'Zoom out', 'wooreels' ),
						},
					] }
				/>

				<Slider
					label={ __( 'Border Width', 'wooreels' ) }
					min={ 0 }
					max={ 20 }
					value={ styles.border.width }
					onChange={ ( value ) => set( 'border.width', value ) }
					onReset={ () => set( 'border.width', 2 ) }
				/>

				<ColorPicker
					label={ __( 'Border Color', 'wooreels' ) }
					value={ styles.border.color }
					onChange={ ( value ) => set( 'border.color', value ) }
				/>

				<ResponsiveSlider
					label={ __( 'Border Radius', 'wooreels' ) }
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
					label={ __( 'Shadow', 'wooreels' ) }
					min={ 0 }
					max={ 100 }
					value={ styles.shadow.size }
					onChange={ ( value ) => set( 'shadow.size', value ) }
					onReset={ () => set( 'shadow.size', 16 ) }
				/>

				<ColorPicker
					label={ __( 'Card background', 'wooreels' ) }
					help={ __( 'Supports transparency.', 'wooreels' ) }
					value={ styles.cardBgColor }
					onChange={ ( value ) => set( 'cardBgColor', value ) }
				/>

				<Switch
					label={ __( 'Show Play Button', 'wooreels' ) }
					checked={ styles.showPlayButton }
					onChange={ ( value ) => set( 'showPlayButton', value ) }
				/>

				{ styles.showPlayButton && (
					<>
						<Slider
							label={ __( 'Play Icon Size', 'wooreels' ) }
							min={ 16 }
							max={ 120 }
							value={ styles.playIconSize }
							onChange={ ( value ) =>
								set( 'playIconSize', value )
							}
							onReset={ () => set( 'playIconSize', 40 ) }
						/>
						<ColorPicker
							label={ __( 'Play icon colour', 'wooreels' ) }
							value={ styles.playIconColor }
							onChange={ ( value ) =>
								set( 'playIconColor', value )
							}
						/>
					</>
				) }

				<Switch
					label={ __( 'Show Views', 'wooreels' ) }
					checked={ styles.showViews }
					onChange={ ( value ) => set( 'showViews', value ) }
				/>

				{ styles.showViews && (
					<>
						<ColorPicker
							label={ __( 'Views background', 'wooreels' ) }
							value={ styles.viewsBgColor }
							onChange={ ( value ) =>
								set( 'viewsBgColor', value )
							}
						/>
						<ColorPicker
							label={ __( 'Views text', 'wooreels' ) }
							value={ styles.viewsTextIconColor }
							onChange={ ( value ) =>
								set( 'viewsTextIconColor', value )
							}
						/>
					</>
				) }
			</CollapsibleSection>

			<CollapsibleSection title={ __( 'Player', 'wooreels' ) }>
				<VisualOptionCards
					label={ __( 'Appearance', 'wooreels' ) }
					value={ styles.playerAppearance }
					onChange={ ( value ) => set( 'playerAppearance', value ) }
					options={ [
						{
							value: 'overlay',
							label: __( 'Overlay', 'wooreels' ),
							preview: <AppearanceArt kind="overlay" />,
						},
						{
							value: 'title',
							label: __( 'Only Title', 'wooreels' ),
							preview: <AppearanceArt kind="title" />,
						},
						{
							value: 'none',
							label: __( 'None', 'wooreels' ),
							preview: <AppearanceArt kind="none" />,
						},
					] }
				/>

				{ 'overlay' === styles.playerAppearance && (
					<Switch
						label={ __( 'Reel Title', 'wooreels' ) }
						checked={ styles.showPlayerFallbackTitle }
						onChange={ ( value ) =>
							set( 'showPlayerFallbackTitle', value )
						}
					/>
				) }

				<IconToggleGroup
					label={ __( 'Position', 'wooreels' ) }
					value={ styles.slideDirection }
					onChange={ ( value ) => set( 'slideDirection', value ) }
					options={ [
						{
							value: 'horizontal',
							label: __( 'Horizontal', 'wooreels' ),
						},
						{
							value: 'vertical',
							label: __( 'Vertical', 'wooreels' ),
						},
					] }
				/>

				<Select
					label={ __( 'Play behaviour', 'wooreels' ) }
					value={ styles.playBehavior }
					onChange={ ( value ) => set( 'playBehavior', value ) }
					options={ [
						{ value: 'click', label: __( 'On click', 'wooreels' ) },
						{
							value: 'autoplay',
							label: __( 'Autoplay', 'wooreels' ),
						},
						{
							value: 'hover',
							label: __( 'Play on Hover', 'wooreels' ),
						},
					] }
				/>

				<Switch
					label={ __( 'Play with sound', 'wooreels' ) }
					help={ __(
						'Play with sound by default. Visitors can still mute or unmute anytime while watching.',
						'wooreels'
					) }
					checked={ styles.playWithSound }
					onChange={ ( value ) => set( 'playWithSound', value ) }
				/>

				<Switch
					label={ __( 'Loop', 'wooreels' ) }
					checked={ styles.loop }
					onChange={ ( value ) => set( 'loop', value ) }
				/>

				<Switch
					label={ __( 'Show seekbar', 'wooreels' ) }
					checked={ styles.showSeekbar }
					onChange={ ( value ) => set( 'showSeekbar', value ) }
				/>

				<Switch
					label={ __( 'Show volume control', 'wooreels' ) }
					checked={ styles.showVolumeControl }
					onChange={ ( value ) => set( 'showVolumeControl', value ) }
				/>

				<Switch
					label={ __( 'Disable preview', 'wooreels' ) }
					help={ __(
						'Turn off previews for a cleaner, more focused browse.',
						'wooreels'
					) }
					checked={ styles.disablePreview }
					onChange={ ( value ) => set( 'disablePreview', value ) }
				/>

				<ColorPicker
					label={ __( 'Button background', 'wooreels' ) }
					value={ styles.previewBtnBgColor }
					onChange={ ( value ) => set( 'previewBtnBgColor', value ) }
				/>
				<ColorPicker
					label={ __( 'Button icon', 'wooreels' ) }
					value={ styles.previewBtnIconColor }
					onChange={ ( value ) =>
						set( 'previewBtnIconColor', value )
					}
				/>
				<ColorPicker
					label={ __( 'Button hover background', 'wooreels' ) }
					value={ styles.previewBtnHoverBgColor }
					onChange={ ( value ) =>
						set( 'previewBtnHoverBgColor', value )
					}
				/>
				<ColorPicker
					label={ __( 'Button hover icon', 'wooreels' ) }
					value={ styles.previewBtnHoverIconColor }
					onChange={ ( value ) =>
						set( 'previewBtnHoverIconColor', value )
					}
				/>
				<Slider
					label={ __( 'Border Radius', 'wooreels' ) }
					min={ 0 }
					max={ 100 }
					value={ styles.previewBtnBorderRadius }
					onChange={ ( value ) =>
						set( 'previewBtnBorderRadius', value )
					}
					onReset={ () => set( 'previewBtnBorderRadius', 40 ) }
				/>
			</CollapsibleSection>

			<CollapsibleSection title={ __( 'Product Card', 'wooreels' ) }>
				<VisualOptionCards
					label={ __( 'Product Card', 'wooreels' ) }
					value={ styles.productCardStyle }
					onChange={ ( value ) => set( 'productCardStyle', value ) }
					options={ [
						{
							value: 'modern',
							label: __( 'Modern', 'wooreels' ),
							help: __(
								'Image, name and price on one compact row.',
								'wooreels'
							),
							preview: <AppearanceArt kind="overlay" />,
						},
						{
							value: 'classic',
							label: __( 'Classic', 'wooreels' ),
							help: __(
								'Larger card with the image above the details.',
								'wooreels'
							),
							preview: <AppearanceArt kind="title" />,
						},
					] }
				/>

				<Switch
					label={ __( 'Show Ratings', 'wooreels' ) }
					help={ __(
						'Control whether product ratings are visible.',
						'wooreels'
					) }
					checked={ styles.showRatings }
					onChange={ ( value ) => set( 'showRatings', value ) }
				/>

				<Switch
					label={ __( 'Show Add to Cart', 'wooreels' ) }
					checked={ styles.showAddToCart }
					onChange={ ( value ) => set( 'showAddToCart', value ) }
				/>

				{ styles.showAddToCart && (
					<TextField
						label={ __( 'Button Text', 'wooreels' ) }
						value={ styles.addToCartText }
						onChange={ ( value ) => set( 'addToCartText', value ) }
					/>
				) }
			</CollapsibleSection>

			<CollapsibleSection title={ __( 'Widget Title', 'wooreels' ) }>
				<Select
					label={ __( 'Alignment', 'wooreels' ) }
					value={ styles.widgetTitle.alignment }
					onChange={ ( value ) =>
						set( 'widgetTitle.alignment', value )
					}
					options={ [
						{ value: 'hidden', label: __( 'Hidden', 'wooreels' ) },
						{ value: 'left', label: __( 'Left', 'wooreels' ) },
						{ value: 'center', label: __( 'Center', 'wooreels' ) },
						{ value: 'right', label: __( 'Right', 'wooreels' ) },
					] }
				/>

				{ 'hidden' !== styles.widgetTitle.alignment && (
					<>
						<Slider
							label={ __( 'Font size', 'wooreels' ) }
							min={ 8 }
							max={ 96 }
							value={ styles.widgetTitle.fontSize }
							onChange={ ( value ) =>
								set( 'widgetTitle.fontSize', value )
							}
							onReset={ () => set( 'widgetTitle.fontSize', 24 ) }
						/>
						<ColorPicker
							label={ __( 'Title Color', 'wooreels' ) }
							value={ styles.widgetTitle.color }
							onChange={ ( value ) =>
								set( 'widgetTitle.color', value )
							}
						/>
					</>
				) }
			</CollapsibleSection>

			<CollapsibleSection title={ __( 'Advanced', 'wooreels' ) }>
				<Switch
					label={ __( 'Lazy load videos', 'wooreels' ) }
					help={ __(
						'Defers video loading to reduce initial page weight.',
						'wooreels'
					) }
					checked={ styles.lazyLoad }
					onChange={ ( value ) => set( 'lazyLoad', value ) }
				/>

				<TextField
					label={ __( 'Custom class', 'wooreels' ) }
					help={ __(
						'Added to the widget wrapper, for your own CSS. Separate several with spaces.',
						'wooreels'
					) }
					value={ styles.customClass || '' }
					placeholder="my-reels"
					onChange={ ( value ) => set( 'customClass', value ) }
				/>
			</CollapsibleSection>
		</div>
	);
};
