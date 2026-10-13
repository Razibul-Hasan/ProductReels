/**
 * Look step: what visitors see before they press play.
 *
 * Title, overlay, preview, hover, play button, view count, border and
 * shadow, and the carousel arrows. Each control writes the key 1.0.0 wrote.
 * Three 1.0.0 settings the design doesn't draw stay here, next to what they
 * belong to: the reel title on reels without a product card
 * (`showFallbackTitle`), the view count's background (`viewsBgColor`) and
 * the arrows' corner radius (`carouselBtnBorderRadius`); hover effect keeps
 * 1.0.0's "None", its default.
 */

import { __ } from '@wordpress/i18n';
import {
	Field,
	PanelSection,
	RangeField,
	Segmented,
	Toggle,
} from '../../components/pr';
import { DeviceNote, RESPONSIVE, StyleColor, read } from './fields';

export const LookStep = ( { styles, set, device } ) => {
	const circle = styles.shape === 'circle';
	const appearance = styles.appearance;

	// A circle has no overlay: its title sits underneath, so it is Below or
	// Hidden. As in 1.0.0, an overlay widget that shows titles reads as Below.
	const circleTitle =
		appearance === 'title' ||
		( appearance === 'overlay' && styles.showFallbackTitle );
	let titleValue = appearance;

	if ( circle ) {
		titleValue = circleTitle ? 'title' : 'none';
	}

	// "Off" is the click behaviour; 1.0.0's disable flag reads as Off and is
	// cleared on any change, so a widget can never say hover and not preview.
	const preview = styles.disablePreview ? 'click' : styles.playBehavior;
	const carouselArrows =
		styles.template === 'carousel' || styles.template === 'stacked';

	return (
		<>
			<PanelSection title={ __( 'Title', 'productreels' ) }>
				<Segmented
					block
					label={ __( 'Title', 'productreels' ) }
					value={ titleValue }
					onChange={ ( value ) => set( 'appearance', value ) }
					options={ [
						...( circle
							? []
							: [
									{
										value: 'overlay',
										label: __(
											'Over video',
											'productreels'
										),
									},
								] ),
						{
							value: 'title',
							label: __( 'Below', 'productreels' ),
						},
						{
							value: 'none',
							label: __( 'Hidden', 'productreels' ),
						},
					] }
				/>
				{ ! circle && appearance === 'overlay' && (
					<>
						<p className="pr-t-small pr-muted">
							{ __(
								'Reels tagged with a product show the product card instead.',
								'productreels'
							) }
						</p>
						<Toggle
							label={ __( 'Reel title', 'productreels' ) }
							description={ __(
								'On reels without a product card.',
								'productreels'
							) }
							checked={ !! styles.showFallbackTitle }
							onChange={ ( value ) =>
								set( 'showFallbackTitle', value )
							}
						/>
					</>
				) }
				{ titleValue === 'title' && (
					<StyleColor
						label={ __( 'Title colour', 'productreels' ) }
						path="titleColor"
						styles={ styles }
						set={ set }
					/>
				) }
			</PanelSection>

			{ ! circle && appearance === 'overlay' && (
				<PanelSection title={ __( 'Overlay', 'productreels' ) }>
					<div className="pr-fieldgrid">
						<StyleColor
							label={ __( 'Shade', 'productreels' ) }
							path="overlayColor"
							styles={ styles }
							set={ set }
						/>
						<StyleColor
							label={ __( 'Text', 'productreels' ) }
							path="captionColor"
							styles={ styles }
							set={ set }
						/>
					</div>
				</PanelSection>
			) }

			<PanelSection title={ __( 'Preview before play', 'productreels' ) }>
				<Segmented
					block
					label={ __( 'Preview before play', 'productreels' ) }
					value={ preview }
					onChange={ ( value ) =>
						set( { playBehavior: value, disablePreview: false } )
					}
					options={ [
						{ value: 'click', label: __( 'Off', 'productreels' ) },
						{
							value: 'hover',
							label: __( 'On hover', 'productreels' ),
						},
						{
							value: 'autoplay',
							label: __( 'When visible', 'productreels' ),
						},
					] }
				/>
				<p className="pr-t-small pr-muted">
					{ __(
						'Plays the video silently on the reel itself.',
						'productreels'
					) }
				</p>
			</PanelSection>

			<PanelSection title={ __( 'Hover effect', 'productreels' ) }>
				<Segmented
					block
					label={ __( 'Hover effect', 'productreels' ) }
					value={ styles.hoverEffect }
					onChange={ ( value ) => set( 'hoverEffect', value ) }
					options={ [
						{ value: 'none', label: __( 'None', 'productreels' ) },
						{
							value: 'zoom-in',
							label: __( 'Zoom in', 'productreels' ),
						},
						{
							value: 'zoom-out',
							label: __( 'Zoom out', 'productreels' ),
						},
						{ value: 'lift', label: __( 'Lift', 'productreels' ) },
					] }
				/>
			</PanelSection>

			<PanelSection>
				<Toggle
					label={ __( 'Play button', 'productreels' ) }
					description={ __(
						'A play icon in the middle of each reel.',
						'productreels'
					) }
					checked={ !! styles.showPlayButton }
					onChange={ ( value ) => set( 'showPlayButton', value ) }
				/>
				{ styles.showPlayButton && (
					<div className="pr-subfields">
						<RangeField
							label={ __( 'Size', 'productreels' ) }
							min={ 16 }
							max={ 120 }
							value={ styles.playIconSize }
							onChange={ ( value ) =>
								set( 'playIconSize', value )
							}
						/>
						<StyleColor
							label={ __( 'Colour', 'productreels' ) }
							path="playIconColor"
							styles={ styles }
							set={ set }
						/>
					</div>
				) }
				<Toggle
					label={ __( 'View count', 'productreels' ) }
					description={ __(
						'Shows how many times a reel was watched.',
						'productreels'
					) }
					checked={ !! styles.showViews }
					onChange={ ( value ) => set( 'showViews', value ) }
				/>
				{ styles.showViews && (
					<div className="pr-subfields pr-fieldgrid">
						<StyleColor
							label={ __( 'Text and icon', 'productreels' ) }
							path="viewsTextIconColor"
							styles={ styles }
							set={ set }
						/>
						<StyleColor
							label={ __( 'Background', 'productreels' ) }
							path="viewsBgColor"
							styles={ styles }
							set={ set }
						/>
					</div>
				) }
			</PanelSection>

			<PanelSection
				title={ __( 'Border and shadow', 'productreels' ) }
				aside={ <DeviceNote device={ device } /> }
			>
				<RangeField
					label={ __( 'Border width', 'productreels' ) }
					min={ 0 }
					max={ 20 }
					value={ styles.border.width }
					onChange={ ( value ) => set( 'border.width', value ) }
				/>
				<StyleColor
					label={ __( 'Border colour', 'productreels' ) }
					path="border.color"
					styles={ styles }
					set={ set }
				/>
				<RangeField
					label={ __( 'Corner radius', 'productreels' ) }
					help={ __(
						'Each device has its own; the rest are the same on every device.',
						'productreels'
					) }
					min={ 0 }
					max={ 100 }
					value={ read( styles, RESPONSIVE.radius[ device ] ) }
					onChange={ ( value ) =>
						set( RESPONSIVE.radius[ device ], value )
					}
				/>
				<RangeField
					label={ __( 'Shadow', 'productreels' ) }
					min={ 0 }
					max={ 100 }
					value={ styles.shadow.size }
					onChange={ ( value ) => set( 'shadow.size', value ) }
				/>
				<StyleColor
					label={ __( 'Background', 'productreels' ) }
					help={ __(
						'Behind each reel, around the video.',
						'productreels'
					) }
					path="cardBgColor"
					styles={ styles }
					set={ set }
				/>
			</PanelSection>

			{ carouselArrows && (
				<PanelSection title={ __( 'Carousel arrows', 'productreels' ) }>
					<Field label={ __( 'Normal', 'productreels' ) }>
						<div className="pr-fieldgrid">
							<StyleColor
								label={ __( 'Background', 'productreels' ) }
								path="carouselBtnBgColor"
								styles={ styles }
								set={ set }
							/>
							<StyleColor
								label={ __( 'Icon', 'productreels' ) }
								path="carouselBtnIconColor"
								styles={ styles }
								set={ set }
							/>
						</div>
					</Field>
					<Field label={ __( 'On hover', 'productreels' ) }>
						<div className="pr-fieldgrid">
							<StyleColor
								label={ __( 'Background', 'productreels' ) }
								path="carouselBtnHoverBgColor"
								styles={ styles }
								set={ set }
							/>
							<StyleColor
								label={ __( 'Icon', 'productreels' ) }
								path="carouselBtnHoverIconColor"
								styles={ styles }
								set={ set }
							/>
						</div>
					</Field>
					<RangeField
						label={ __( 'Corner radius', 'productreels' ) }
						min={ 0 }
						max={ 100 }
						value={ styles.carouselBtnBorderRadius }
						onChange={ ( value ) =>
							set( 'carouselBtnBorderRadius', value )
						}
					/>
				</PanelSection>
			) }
		</>
	);
};
