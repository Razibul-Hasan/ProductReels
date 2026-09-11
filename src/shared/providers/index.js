/**
 * Pick the provider a file needs.
 *
 * Every provider answers to the same imperative interface —
 * play, pause, seek, setVolume, setMuted, getDuration, getCurrentTime —
 * so the player never knows which one it is talking to.
 */

import { NativeVideo } from './NativeVideo';
import { VimeoPlayer } from './VimeoPlayer';
import { YouTubePlayer } from './YouTubePlayer';

export const providerFor = ( file ) => {
	switch ( file && file.source ) {
		case 'vimeo':
			return VimeoPlayer;

		case 'youtube':
			return YouTubePlayer;

		default:
			return NativeVideo;
	}
};

export { NativeVideo, VimeoPlayer, YouTubePlayer };
