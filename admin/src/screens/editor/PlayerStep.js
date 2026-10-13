/**
 * Player step: what opens when a shopper taps a reel.
 *
 * Slide direction, sound, loop, seek bar, volume and the navigation buttons.
 * Two 1.0.0 settings the design doesn't draw stay here: what shows over the
 * video in the player (`playerAppearance`, with `showPlayerFallbackTitle`)
 * and the navigation buttons' corner radius (`previewBtnBorderRadius`).
 */

import { __ } from '@wordpress/i18n';
import {
	Field,
	PanelSection,
	RangeField,
	Segmented,
	Toggle,
} from '../../components/pr';
import { StyleColor } from './fields';

export const PlayerStep = ( { styles, set } ) => (
	<>
		<PanelSection title={ __( 'Slide direction', 'productreels' ) }>
			<Segmented
				block
				label={ __( 'Slide direction', 'productreels' ) }
				value={ styles.slideDirection }
				onChange={ ( value ) => set( 'slideDirection', value ) }
				options={ [
					{
						value: 'horizontal',
						label: __( 'Horizontal', 'productreels' ),
					},
					{
						value: 'vertical',
						label: __( 'Vertical', 'productreels' ),
					},
				] }
			/>
			<p className="pr-t-small pr-muted">
				{ __(
					'Sideways, or up and down like a feed.',
					'productreels'
				) }
			</p>
		</PanelSection>

		<PanelSection>
			<Toggle
				label={ __( 'Play with sound', 'productreels' ) }
				description={ __(
					'Browsers start muted until a visitor taps once.',
					'productreels'
				) }
				checked={ !! styles.playWithSound }
				onChange={ ( value ) => set( 'playWithSound', value ) }
			/>
			<Toggle
				label={ __( 'Loop', 'productreels' ) }
				description={ __(
					'Replays a reel when it ends instead of moving to the next.',
					'productreels'
				) }
				checked={ !! styles.loop }
				onChange={ ( value ) => set( 'loop', value ) }
			/>
			<Toggle
				label={ __( 'Seek bar', 'productreels' ) }
				description={ __(
					'Shows progress and lets visitors skip ahead.',
					'productreels'
				) }
				checked={ !! styles.showSeekbar }
				onChange={ ( value ) => set( 'showSeekbar', value ) }
			/>
			<Toggle
				label={ __( 'Volume control', 'productreels' ) }
				description={ __(
					'A sound button and slider on the video.',
					'productreels'
				) }
				checked={ !! styles.showVolumeControl }
				onChange={ ( value ) => set( 'showVolumeControl', value ) }
			/>
		</PanelSection>

		<PanelSection title={ __( 'Over the video', 'productreels' ) }>
			<Segmented
				block
				label={ __( 'Over the video', 'productreels' ) }
				value={ styles.playerAppearance }
				onChange={ ( value ) => set( 'playerAppearance', value ) }
				options={ [
					{
						value: 'overlay',
						label: __( 'Products', 'productreels' ),
					},
					{
						value: 'title',
						label: __( 'Title only', 'productreels' ),
					},
					{ value: 'none', label: __( 'Nothing', 'productreels' ) },
				] }
			/>
			<p className="pr-t-small pr-muted">
				{ __(
					'Products shows the product card and buttons; the other two hide them in the player.',
					'productreels'
				) }
			</p>
			{ styles.playerAppearance === 'overlay' && (
				<Toggle
					label={ __( 'Reel title', 'productreels' ) }
					description={ __(
						'On reels with no product or button to show.',
						'productreels'
					) }
					checked={ !! styles.showPlayerFallbackTitle }
					onChange={ ( value ) =>
						set( 'showPlayerFallbackTitle', value )
					}
				/>
			) }
		</PanelSection>

		<PanelSection title={ __( 'Navigation buttons', 'productreels' ) }>
			<Field label={ __( 'Normal', 'productreels' ) }>
				<div className="pr-fieldgrid">
					<StyleColor
						label={ __( 'Background', 'productreels' ) }
						path="previewBtnBgColor"
						styles={ styles }
						set={ set }
					/>
					<StyleColor
						label={ __( 'Icon', 'productreels' ) }
						path="previewBtnIconColor"
						styles={ styles }
						set={ set }
					/>
				</div>
			</Field>
			<Field label={ __( 'On hover', 'productreels' ) }>
				<div className="pr-fieldgrid">
					<StyleColor
						label={ __( 'Background', 'productreels' ) }
						path="previewBtnHoverBgColor"
						styles={ styles }
						set={ set }
					/>
					<StyleColor
						label={ __( 'Icon', 'productreels' ) }
						path="previewBtnHoverIconColor"
						styles={ styles }
						set={ set }
					/>
				</div>
			</Field>
			<RangeField
				label={ __( 'Corner radius', 'productreels' ) }
				min={ 0 }
				max={ 100 }
				value={ styles.previewBtnBorderRadius }
				onChange={ ( value ) => set( 'previewBtnBorderRadius', value ) }
			/>
		</PanelSection>
	</>
);
