/**
 * Layout step: how reels sit on the page.
 *
 * Template and shape, then size and spacing (reel width and gap are kept per
 * device, and edit the device the stage shows), then whatever only the
 * chosen layout has, then the widget title. Every control writes the key
 * 1.0.0 wrote, in 1.0.0's units, and the sliders keep 1.0.0's ranges; a
 * stored value outside a range shows as it is.
 */

import { __ } from '@wordpress/i18n';
import { boot } from '../../api';
import {
	Button,
	Field,
	PanelSection,
	RangeField,
	Segmented,
	TemplatePicker,
	Toggle,
} from '../../components/pr';
import { SHAPES } from '../CreateWidget';
import { DeviceNote, RESPONSIVE, SelectField, StyleColor } from './fields';

const ALIGNMENTS = [
	{ value: 'left', label: __( 'Left', 'productreels' ), icon: 'align-left' },
	{
		value: 'center',
		label: __( 'Center', 'productreels' ),
		icon: 'align-center',
	},
	{
		value: 'right',
		label: __( 'Right', 'productreels' ),
		icon: 'align-right',
	},
];

const TITLE_KEYS = [
	'alignment',
	'fontSize',
	'color',
	'spacingTop',
	'spacingBottom',
];

/* The title defaults (default_styles()), in case the bootstrap lacks them. */
const TITLE_FALLBACK = {
	alignment: 'hidden',
	fontSize: 17,
	color: '#141629',
	spacingTop: 0,
	spacingBottom: 16,
};

const LayoutOptions = ( { styles, set } ) => {
	const { marquee, stacked, popup } = styles;

	switch ( styles.template ) {
		case 'carousel':
			return (
				<PanelSection title={ __( 'Carousel arrows', 'productreels' ) }>
					<Segmented
						block
						label={ __( 'Carousel arrows', 'productreels' ) }
						value={ styles.carouselBtnPosition }
						onChange={ ( value ) =>
							set( 'carouselBtnPosition', value )
						}
						options={ [
							{
								value: 'outside',
								label: __( 'Outside', 'productreels' ),
							},
							{
								value: 'inside',
								label: __( 'Inside', 'productreels' ),
							},
						] }
					/>
				</PanelSection>
			);

		case 'marquee':
			return (
				<PanelSection title={ __( 'Marquee', 'productreels' ) }>
					<RangeField
						label={ __( 'Speed', 'productreels' ) }
						min={ 5 }
						max={ 200 }
						unit="px/s"
						value={ marquee.speed }
						onChange={ ( value ) => set( 'marquee.speed', value ) }
					/>
					<Field label={ __( 'Direction', 'productreels' ) }>
						<Segmented
							block
							label={ __( 'Direction', 'productreels' ) }
							value={ marquee.direction }
							onChange={ ( value ) =>
								set( 'marquee.direction', value )
							}
							options={ [
								{
									value: 'left',
									label: __( 'Left', 'productreels' ),
								},
								{
									value: 'right',
									label: __( 'Right', 'productreels' ),
								},
							] }
						/>
					</Field>
					<Toggle
						label={ __( 'Pause on hover', 'productreels' ) }
						description={ __(
							'Stops the marquee while a pointer is over it.',
							'productreels'
						) }
						checked={ !! marquee.pauseOnHover }
						onChange={ ( value ) =>
							set( 'marquee.pauseOnHover', value )
						}
					/>
				</PanelSection>
			);

		case 'stacked':
			return (
				<PanelSection title={ __( 'Stack', 'productreels' ) }>
					<RangeField
						label={ __( 'Depth', 'productreels' ) }
						help={ __(
							'How many cards show in the deck.',
							'productreels'
						) }
						min={ 2 }
						max={ 5 }
						unit=""
						value={ stacked.depth }
						onChange={ ( value ) => set( 'stacked.depth', value ) }
					/>
					<RangeField
						label={ __( 'Offset', 'productreels' ) }
						min={ 0 }
						max={ 80 }
						value={ stacked.offset }
						onChange={ ( value ) => set( 'stacked.offset', value ) }
					/>
					<RangeField
						label={ __( 'Scale', 'productreels' ) }
						help={ __(
							'How much smaller each card behind is.',
							'productreels'
						) }
						min={ 0.5 }
						max={ 1 }
						step={ 0.01 }
						unit=""
						value={ stacked.scale }
						onChange={ ( value ) => set( 'stacked.scale', value ) }
					/>
				</PanelSection>
			);

		case 'popup':
			return (
				<PanelSection title={ __( 'Popup', 'productreels' ) }>
					<Field label={ __( 'Trigger', 'productreels' ) }>
						<Segmented
							block
							label={ __( 'Trigger', 'productreels' ) }
							value={ popup.trigger }
							onChange={ ( value ) =>
								set( 'popup.trigger', value )
							}
							options={ [
								{
									value: 'load',
									label: __( 'On page load', 'productreels' ),
								},
								{
									value: 'delay',
									label: __(
										'After a delay',
										'productreels'
									),
								},
								{
									value: 'scroll',
									label: __(
										'After scrolling',
										'productreels'
									),
								},
							] }
						/>
					</Field>
					{ popup.trigger === 'delay' && (
						<RangeField
							label={ __( 'Delay', 'productreels' ) }
							min={ 0 }
							max={ 60 }
							unit="s"
							value={ popup.delaySeconds }
							onChange={ ( value ) =>
								set( 'popup.delaySeconds', value )
							}
						/>
					) }
					{ popup.trigger === 'scroll' && (
						<RangeField
							label={ __( 'Scroll distance', 'productreels' ) }
							help={ __(
								'How far down the page, as a share of its height.',
								'productreels'
							) }
							min={ 0 }
							max={ 100 }
							unit="%"
							value={ popup.scrollPercent }
							onChange={ ( value ) =>
								set( 'popup.scrollPercent', value )
							}
						/>
					) }
					<Field label={ __( 'Corner', 'productreels' ) }>
						<div className="pr-corners">
							<Segmented
								block
								label={ __( 'Corner', 'productreels' ) }
								value={ popup.position }
								onChange={ ( value ) =>
									set( 'popup.position', value )
								}
								options={ [
									{
										value: 'top-left',
										label: __( 'Top left', 'productreels' ),
									},
									{
										value: 'top-right',
										label: __(
											'Top right',
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
										value: 'bottom-right',
										label: __(
											'Bottom right',
											'productreels'
										),
									},
								] }
							/>
						</div>
					</Field>
					<Toggle
						label={ __( 'Show on mobile', 'productreels' ) }
						description={ __(
							'Phones get the popup too.',
							'productreels'
						) }
						checked={ !! popup.showOnMobile }
						onChange={ ( value ) =>
							set( 'popup.showOnMobile', value )
						}
					/>
					<SelectField
						label={ __( 'Show again', 'productreels' ) }
						help={ __(
							'When a visitor who closed it sees it again.',
							'productreels'
						) }
						value={ popup.dismissFor || 'session' }
						onChange={ ( value ) =>
							set( 'popup.dismissFor', value )
						}
						options={ [
							{
								value: 'page',
								label: __( 'Next page', 'productreels' ),
							},
							{
								value: 'session',
								label: __( 'Next visit', 'productreels' ),
							},
							{
								value: 'day',
								label: __( 'After 1 day', 'productreels' ),
							},
							{
								value: 'week',
								label: __( 'After 7 days', 'productreels' ),
							},
							{
								value: 'month',
								label: __( 'After 30 days', 'productreels' ),
							},
						] }
					/>
				</PanelSection>
			);

		default:
			return null;
	}
};

const TitleSection = ( { styles, set } ) => {
	const title = styles.widgetTitle;
	const defaults = { ...TITLE_FALLBACK, ...boot.defaults?.widgetTitle };
	const hidden = title.alignment === 'hidden';
	const isDefault = TITLE_KEYS.every(
		( key ) => title[ key ] === defaults[ key ]
	);

	return (
		<PanelSection
			title={ __( 'Title', 'productreels' ) }
			aside={
				! isDefault && (
					<Button
						variant="ghost"
						size="sm"
						icon="undo"
						onClick={ () =>
							set(
								Object.fromEntries(
									TITLE_KEYS.map( ( key ) => [
										`widgetTitle.${ key }`,
										defaults[ key ],
									] )
								)
							)
						}
					>
						{ __( 'Reset', 'productreels' ) }
					</Button>
				)
			}
		>
			<Field
				label={ __( 'Position', 'productreels' ) }
				help={ __(
					'The title is the widget’s name, above its reels.',
					'productreels'
				) }
			>
				<Segmented
					block
					label={ __( 'Title position', 'productreels' ) }
					value={ title.alignment }
					onChange={ ( value ) =>
						set( 'widgetTitle.alignment', value )
					}
					options={ [
						...ALIGNMENTS,
						{
							value: 'hidden',
							label: __( 'Hidden', 'productreels' ),
						},
					] }
				/>
			</Field>
			{ ! hidden && (
				<>
					<RangeField
						label={ __( 'Size', 'productreels' ) }
						min={ 8 }
						max={ 96 }
						value={ title.fontSize }
						onChange={ ( value ) =>
							set( 'widgetTitle.fontSize', value )
						}
					/>
					<StyleColor
						label={ __( 'Colour', 'productreels' ) }
						path="widgetTitle.color"
						styles={ styles }
						set={ set }
					/>
					<RangeField
						label={ __( 'Space above', 'productreels' ) }
						min={ 0 }
						max={ 160 }
						value={ title.spacingTop }
						onChange={ ( value ) =>
							set( 'widgetTitle.spacingTop', value )
						}
					/>
					<RangeField
						label={ __( 'Space below', 'productreels' ) }
						min={ 0 }
						max={ 160 }
						value={ title.spacingBottom }
						onChange={ ( value ) =>
							set( 'widgetTitle.spacingBottom', value )
						}
					/>
				</>
			) }
		</PanelSection>
	);
};

export const LayoutStep = ( { styles, set, device } ) => {
	// Marquee runs edge to edge and popup is pinned to a corner; neither has
	// anything to align (as in 1.0.0).
	const alignable =
		styles.template !== 'marquee' && styles.template !== 'popup';

	return (
		<>
			<PanelSection>
				<TemplatePicker
					value={ styles.template }
					onChange={ ( value ) => set( 'template', value ) }
				/>
			</PanelSection>

			<PanelSection title={ __( 'Shape', 'productreels' ) }>
				<Segmented
					block
					label={ __( 'Shape', 'productreels' ) }
					value={ styles.shape }
					onChange={ ( value ) => set( 'shape', value ) }
					options={ SHAPES }
				/>
			</PanelSection>

			<PanelSection
				title={ __( 'Size and spacing', 'productreels' ) }
				aside={ <DeviceNote device={ device } /> }
			>
				<RangeField
					label={ __( 'Reel width', 'productreels' ) }
					min={ 80 }
					max={ 400 }
					value={ styles[ RESPONSIVE.size[ device ] ] }
					onChange={ ( value ) =>
						set( RESPONSIVE.size[ device ], value )
					}
				/>
				<RangeField
					label={ __( 'Gap', 'productreels' ) }
					min={ 0 }
					max={ 64 }
					value={ styles[ RESPONSIVE.gap[ device ] ] }
					onChange={ ( value ) =>
						set( RESPONSIVE.gap[ device ], value )
					}
				/>
				<RangeField
					label={ __( 'Space above and below', 'productreels' ) }
					help={ __( 'The same on every device.', 'productreels' ) }
					min={ 0 }
					max={ 120 }
					value={ styles.topBottomSpacing }
					onChange={ ( value ) => set( 'topBottomSpacing', value ) }
				/>
				{ alignable && (
					<Field
						label={ __( 'Alignment', 'productreels' ) }
						help={ __(
							'Where the reels sit when they don’t fill the width. The same on every device.',
							'productreels'
						) }
					>
						<Segmented
							block
							label={ __( 'Alignment', 'productreels' ) }
							value={ styles.alignment }
							onChange={ ( value ) => set( 'alignment', value ) }
							options={ ALIGNMENTS }
						/>
					</Field>
				) }
			</PanelSection>

			<LayoutOptions styles={ styles } set={ set } />

			<TitleSection styles={ styles } set={ set } />
		</>
	);
};
