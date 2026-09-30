/**
 * Mute toggle plus a volume slider that appears on hover or focus.
 *
 * The slider is a real slider to assistive technology and is keyboard
 * operable; the mute button is what most visitors will actually reach for.
 */

import { __ } from '@wordpress/i18n';

const SpeakerIcon = ( { muted, level } ) => (
	<svg
		viewBox="0 0 24 24"
		width="20"
		height="20"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" stroke="none" />
		{ muted ? (
			<path d="m22 9-6 6M16 9l6 6" />
		) : (
			<>
				{ level > 0 && <path d="M15.5 8.5a5 5 0 0 1 0 7" /> }
				{ level > 0.5 && <path d="M19 5.5a9 9 0 0 1 0 13" /> }
			</>
		) }
	</svg>
);

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
		<div className="wr-volume" data-wr-no-swipe="">
			<button
				type="button"
				className="wr-player__ctl"
				aria-label={
					muted
						? __(
								'Unmute',
								'productreels'
							)
						: __(
								'Mute',
								'productreels'
							)
				}
				aria-pressed={ muted ? 'true' : 'false' }
				onClick={ onToggleMute }
			>
				<SpeakerIcon muted={ muted } level={ volume } />
			</button>

			<div
				className="wr-volume__slider"
				role="slider"
				tabIndex={ 0 }
				aria-label={ __(
					'Volume',
					'productreels'
				) }
				aria-valuemin={ 0 }
				aria-valuemax={ 100 }
				aria-valuenow={ shown }
				aria-valuetext={ `${ shown }%` }
				aria-orientation="horizontal"
				onKeyDown={ onKeyDown }
				onPointerDown={ onPointer }
				onPointerMove={ onPointer }
			>
				<span className="wr-volume__track">
					<span
						className="wr-volume__fill"
						style={ { width: `${ shown }%` } }
					/>
				</span>
			</div>
		</div>
	);
};
