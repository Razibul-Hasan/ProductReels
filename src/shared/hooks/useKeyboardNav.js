/**
 * Keyboard control for the player.
 *
 * Arrows follow the slide direction — left/right for a horizontal player,
 * up/down for a vertical one — and the remaining keys are the ones a visitor
 * would try on any video: Space to play or pause, M to mute, Escape to close.
 *
 * Listens on the document so the player answers no matter which of its
 * controls has focus, but leaves the arrows alone while a slider owns them.
 */

import { useEffect } from '@wordpress/element';

export const useKeyboardNav = ( {
	direction,
	onStep,
	onToggle,
	onMute,
	onClose,
	enabled = true,
} ) => {
	useEffect( () => {
		if ( ! enabled ) {
			return undefined;
		}

		const onKeyDown = ( event ) => {
			if (
				event.defaultPrevented ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey
			) {
				return;
			}

			const target = event.target;
			const onSlider =
				target &&
				target.getAttribute &&
				target.getAttribute( 'role' ) === 'slider';
			const onButton = target && target.tagName === 'BUTTON';
			const rtl = document.documentElement.dir === 'rtl';
			const horizontal = direction === 'horizontal';

			switch ( event.key ) {
				case 'Escape':
					event.preventDefault();
					onClose();
					break;

				case ' ':
				case 'Spacebar':
					// A focused button already activates on Space.
					if ( onButton || onSlider ) {
						return;
					}

					event.preventDefault();
					onToggle();
					break;

				case 'k':
				case 'K':
					event.preventDefault();
					onToggle();
					break;

				case 'm':
				case 'M':
					event.preventDefault();
					onMute();
					break;

				case 'ArrowRight':
					if ( horizontal && ! onSlider ) {
						event.preventDefault();
						onStep( rtl ? -1 : 1 );
					}
					break;

				case 'ArrowLeft':
					if ( horizontal && ! onSlider ) {
						event.preventDefault();
						onStep( rtl ? 1 : -1 );
					}
					break;

				case 'ArrowDown':
					if ( ! horizontal && ! onSlider ) {
						event.preventDefault();
						onStep( 1 );
					}
					break;

				case 'ArrowUp':
					if ( ! horizontal && ! onSlider ) {
						event.preventDefault();
						onStep( -1 );
					}
					break;

				default:
					break;
			}
		};

		document.addEventListener( 'keydown', onKeyDown );

		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [ direction, onStep, onToggle, onMute, onClose, enabled ] );
};
