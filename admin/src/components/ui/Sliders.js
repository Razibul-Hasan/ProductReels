/**
 * Slider and responsive slider.
 *
 * The responsive variant is the workhorse of the style panel: one label, three
 * device tabs, and a value per device. Switching device tabs is a view change,
 * not an edit — nothing is written until the slider moves.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconDesktop, IconMobile, IconReset, IconTablet } from '../icons';
import { IconButton } from './Button';

const DEVICES = [
	{
		value: 'desktop',
		icon: IconDesktop,
		label: __(
			'Desktop',
			'productreels'
		),
	},
	{
		value: 'tablet',
		icon: IconTablet,
		label: __(
			'Tablet',
			'productreels'
		),
	},
	{
		value: 'mobile',
		icon: IconMobile,
		label: __(
			'Mobile',
			'productreels'
		),
	},
];

export const Slider = ( {
	label,
	help,
	value,
	min,
	max,
	step = 1,
	unit = 'px',
	onChange,
	onReset,
} ) => {
	const clamp = ( next ) =>
		Math.min( max, Math.max( min, Number.isFinite( next ) ? next : min ) );

	return (
		<div className="wr-slider">
			<div className="wr-slider__head">
				<span className="wr-field__label">{ label }</span>
				<div className="wr-slider__tools">
					{ onReset && (
						<IconButton
							icon={ IconReset }
							label={ __(
								'Reset',
								'productreels'
							) }
							size={ 14 }
							onClick={ onReset }
						/>
					) }
				</div>
			</div>
			<div className="wr-slider__row">
				<input
					type="range"
					className="wr-slider__range"
					min={ min }
					max={ max }
					step={ step }
					value={ value }
					aria-label={ label }
					onChange={ ( event ) =>
						onChange( clamp( Number( event.target.value ) ) )
					}
				/>
				<input
					type="number"
					className="wr-slider__number"
					min={ min }
					max={ max }
					step={ step }
					value={ value }
					aria-label={ `${ label } (${ unit })` }
					onChange={ ( event ) =>
						onChange( clamp( Number( event.target.value ) ) )
					}
				/>
			</div>
			{ help && <span className="wr-field__help">{ help }</span> }
		</div>
	);
};

export const ResponsiveSlider = ( {
	label,
	help,
	values,
	min,
	max,
	step = 1,
	onChange,
	defaults,
} ) => {
	const [ device, setDevice ] = useState( 'desktop' );
	const deviceLabel = DEVICES.find(
		( entry ) => entry.value === device
	).label;

	return (
		<div className="wr-slider">
			<div className="wr-slider__head">
				<span className="wr-field__label">{ label }</span>
				<div className="wr-slider__tools">
					<div
						className="wr-toggle-group"
						role="group"
						aria-label={ __(
							'Device',
							'productreels'
						) }
					>
						{ DEVICES.map( ( entry ) => {
							const Icon = entry.icon;

							return (
								<button
									key={ entry.value }
									type="button"
									aria-pressed={
										entry.value === device
											? 'true'
											: 'false'
									}
									aria-label={ entry.label }
									className="wr-toggle-group__item"
									onClick={ () => setDevice( entry.value ) }
								>
									<Icon size={ 13 } />
								</button>
							);
						} ) }
					</div>
					{ defaults && (
						<IconButton
							icon={ IconReset }
							label={ __(
								'Reset',
								'productreels'
							) }
							size={ 14 }
							onClick={ () =>
								onChange( device, defaults[ device ] )
							}
						/>
					) }
				</div>
			</div>
			<div className="wr-slider__row">
				<input
					type="range"
					className="wr-slider__range"
					min={ min }
					max={ max }
					step={ step }
					value={ values[ device ] }
					aria-label={ `${ label } — ${ deviceLabel }` }
					onChange={ ( event ) =>
						onChange( device, Number( event.target.value ) )
					}
				/>
				<input
					type="number"
					className="wr-slider__number"
					min={ min }
					max={ max }
					step={ step }
					value={ values[ device ] }
					aria-label={ `${ label } — ${ deviceLabel }` }
					onChange={ ( event ) =>
						onChange(
							device,
							Math.min(
								max,
								Math.max(
									min,
									Number( event.target.value ) || min
								)
							)
						)
					}
				/>
			</div>
			{ help && <span className="wr-field__help">{ help }</span> }
		</div>
	);
};
