/**
 * Mute toggle plus a volume slider that appears on hover or focus.
 *
 * The slider is a real slider to assistive technology and is keyboard
 * operable; the mute button is what most visitors will actually reach for.
 */

import { __ } from '@wordpress/i18n';
import { ReelIcon } from '../ReelIcon';

export const VolumeControl = ( { muted, volume, onToggleMute, onVolume } ) => {
	const shown = muted ? 0 : Math.round( volume * 100 );

	const onKeyDown = ( event ) => {
		let next = null;

		switch ( event.key ) {
			case 'ArrowRight':
			case 'ArrowUp':
				next = Math.min( 100, shown + 10 );
				break;

			case 'ArrowLeft':
			case 'ArrowDown':
				next = Math.max( 0, shown - 10 );
				break;

			case 'Home':
				next = 0;
				break;

			case 'End':
				next = 100;
				break;

			default:
				return;
		}

		event.preventDefault();
		event.stopPropagation();
		onVolume( next / 100 );
	};

	const onPointer = ( event ) => {
		if ( event.buttons !== 1 && event.type !== 'pointerdown' ) {
			return;
		}

		const rect = event.currentTarget.getBoundingClientRect();
		const rtl =
			window.getComputedStyle( event.currentTarget ).direction === 'rtl';
		let fraction = ( event.clientX - rect.left ) / rect.width;

		if ( rtl ) {
			fraction = 1 - fraction;
		}

		event.currentTarget.setPointerCapture( event.pointerId );
		onVolume( Math.min( 1, Math.max( 0, fraction ) ) );
	};

	return (
		<div className="prs-volume" data-wr-no-swipe="">
			<button
				type="button"
				className="prs-iconbtn"
				aria-label={
					muted
						? __( 'Unmute', 'productreels' )
						: __( 'Mute', 'productreels' )
				}
				aria-pressed={ muted ? 'true' : 'false' }
				onClick={ onToggleMute }
			>
				<ReelIcon name={ muted ? 'mute' : 'volume' } size={ 17 } />
			</button>

			<div
				className="prs-volume__slider"
				role="slider"
				tabIndex={ 0 }
				aria-label={ __( 'Volume', 'productreels' ) }
				aria-valuemin={ 0 }
				aria-valuemax={ 100 }
				aria-valuenow={ shown }
				aria-valuetext={ `${ shown }%` }
				aria-orientation="horizontal"
				onKeyDown={ onKeyDown }
				onPointerDown={ onPointer }
				onPointerMove={ onPointer }
			>
				<span className="prs-volume__track">
					<span
						className="prs-volume__fill"
						style={ { width: `${ shown }%` } }
					/>
				</span>
			</div>
		</div>
	);
};
