/**
 * The widget title dialog.
 *
 * The title is typed in the app bar, so its appearance is set from there too
 * rather than buried in the style accordion. Four decisions live here —
 * where it sits (or whether it shows at all), how big it is, what colour,
 * and how much air it gets above and below — with the real name rendered
 * above them so the answer is visible before the dialog closes. Edits apply
 * straight to the widget, the same as the panel.
 */

import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	IconEyeOff,
	IconReset,
	IconTextCenter,
	IconTextLeft,
	IconTextRight,
} from '../components/icons';
import { Button } from '../components/ui/Button';
import { IconToggleGroup } from '../components/ui/Choice';
import { ColorPicker } from '../components/ui/ColorPicker';
import { Field } from '../components/ui/Fields';
import { Modal } from '../components/ui/Modal';

const SIZE = { min: 8, max: 96 };
const SPACING = { min: 0, max: 160 };

const DEFAULTS = {
	'widgetTitle.alignment': 'hidden',
	'widgetTitle.fontSize': 24,
	'widgetTitle.color': '#000000',
	'widgetTitle.spacingTop': 0,
	'widgetTitle.spacingBottom': 16,
};

const clamp = ( next, range = SIZE ) =>
	Math.min(
		range.max,
		Math.max( range.min, Number.isFinite( next ) ? next : range.min )
	);

/**
 * One of the two spacing inputs: a caption and a number, in pixels.
 *
 * @param {Object}   props          Props.
 * @param {string}   props.label    The caption.
 * @param {number}   props.value    Pixels.
 * @param {boolean}  props.disabled Whether the title is hidden.
 * @param {Function} props.onChange Receives the clamped number.
 * @return {Object} The input.
 */
const SpacingInput = ( { label, value, disabled, onChange } ) => {
	const id = useInstanceId( SpacingInput, 'wr-title-spacing' );

	return (
		<span className="wr-title-dialog__spacing-input">
			<label htmlFor={ id } className="wr-title-dialog__spacing-label">
				{ label }
			</label>
			<input
				id={ id }
				type="number"
				className="wr-slider__number"
				min={ SPACING.min }
				max={ SPACING.max }
				value={ value }
				disabled={ disabled }
				onChange={ ( event ) =>
					onChange( clamp( Number( event.target.value ), SPACING ) )
				}
			/>
			<span className="wr-title-dialog__spacing-unit">px</span>
		</span>
	);
};

export const TitleAppearanceDialog = ( { name, styles, set, onClose } ) => {
	const title = styles.widgetTitle;
	const hidden = 'hidden' === title.alignment;
	const isDefault = Object.keys( DEFAULTS ).every(
		( path ) => title[ path.split( '.' )[ 1 ] ] === DEFAULTS[ path ]
	);

	return (
		<Modal
			title={ __(
				'Widget title',
				'productreels'
			) }
			size="sm"
			onClose={ onClose }
			footer={
				<>
					{ ! isDefault && (
						<Button
							variant="ghost"
							icon={ IconReset }
							className="wr-title-dialog__reset"
							onClick={ () => set( DEFAULTS ) }
						>
							{ __(
								'Reset',
								'productreels'
							) }
						</Button>
					) }
					<Button variant="primary" onClick={ onClose }>
						{ __(
							'Done',
							'productreels'
						) }
					</Button>
				</>
			}
		>
			<div className="wr-title-dialog">
				<p className="wr-title-dialog__lede">
					{ __(
						'The widget name can sit above the reels on the page. Choose where, or keep it off.',
						'productreels'
					) }
				</p>

				<div
					className={ [
						'wr-title-dialog__preview',
						hidden ? 'wr-title-dialog__preview--off' : '',
					]
						.filter( Boolean )
						.join( ' ' ) }
					aria-hidden="true"
				>
					{ hidden ? (
						<span className="wr-title-dialog__preview-off">
							<IconEyeOff size={ 14 } />
							{ __(
								'Title stays off the page',
								'productreels'
							) }
						</span>
					) : (
						<span
							className="wr-title-dialog__preview-text"
							style={ {
								textAlign: title.alignment,
								fontSize: `${ title.fontSize }px`,
								color: title.color,
								marginTop: `${ title.spacingTop }px`,
								marginBottom: `${ title.spacingBottom }px`,
							} }
						>
							{ name ||
								__(
									'Untitled widget',
									'productreels'
								) }
						</span>
					) }
					<span className="wr-title-dialog__preview-reels">
						<i />
						<i />
						<i />
						<i />
					</span>
				</div>

				<IconToggleGroup
					label={ __(
						'Position',
						'productreels'
					) }
					value={ title.alignment }
					onChange={ ( value ) =>
						set( 'widgetTitle.alignment', value )
					}
					options={ [
						{
							value: 'left',
							label: __(
								'Left',
								'productreels'
							),
							icon: IconTextLeft,
							showLabel: false,
						},
						{
							value: 'center',
							label: __(
								'Centre',
								'productreels'
							),
							icon: IconTextCenter,
							showLabel: false,
						},
						{
							value: 'right',
							label: __(
								'Right',
								'productreels'
							),
							icon: IconTextRight,
							showLabel: false,
						},
						{
							value: 'hidden',
							label: __(
								'Hidden',
								'productreels'
							),
							icon: IconEyeOff,
						},
					] }
				/>

				<div
					className="wr-title-dialog__when-shown"
					data-disabled={ hidden ? 'true' : 'false' }
				>
					<Field
						label={ __(
							'Size',
							'productreels'
						) }
					>
						<div className="wr-slider__row">
							<input
								type="range"
								className="wr-slider__range"
								min={ SIZE.min }
								max={ SIZE.max }
								value={ title.fontSize }
								disabled={ hidden }
								aria-label={ __(
									'Size',
									'productreels'
								) }
								onChange={ ( event ) =>
									set(
										'widgetTitle.fontSize',
										clamp( Number( event.target.value ) )
									)
								}
							/>
							<span className="wr-title-dialog__size">
								<input
									type="number"
									className="wr-slider__number"
									min={ SIZE.min }
									max={ SIZE.max }
									value={ title.fontSize }
									disabled={ hidden }
									aria-label={ __(
										'Size (px)',
										'productreels'
									) }
									onChange={ ( event ) =>
										set(
											'widgetTitle.fontSize',
											clamp(
												Number( event.target.value )
											)
										)
									}
								/>
								<span>px</span>
							</span>
						</div>
					</Field>

					<ColorPicker
						label={ __(
							'Colour',
							'productreels'
						) }
						value={ title.color }
						disabled={ hidden }
						onChange={ ( value ) =>
							set( 'widgetTitle.color', value )
						}
					/>

					<Field
						label={ __(
							'Spacing',
							'productreels'
						) }
					>
						<div className="wr-title-dialog__spacing">
							<SpacingInput
								label={ __(
									'Top',
									'productreels'
								) }
								value={ title.spacingTop }
								disabled={ hidden }
								onChange={ ( value ) =>
									set( 'widgetTitle.spacingTop', value )
								}
							/>
							<SpacingInput
								label={ __(
									'Bottom',
									'productreels'
								) }
								value={ title.spacingBottom }
								disabled={ hidden }
								onChange={ ( value ) =>
									set( 'widgetTitle.spacingBottom', value )
								}
							/>
						</div>
					</Field>
				</div>
			</div>
		</Modal>
	);
};
