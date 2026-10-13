/**
 * Player step: what opens when a shopper taps a reel.
 *
 * Part 07 interim: the 1.0.0 Player tab's Appearance, Playback and
 * Navigation buttons sections. Part 09 rebuilds the step.
 */

import {
	NavButtonsSection,
	PlaybackSection,
	PlayerAppearanceSection,
} from '../StylePanel';
import { PanelSection } from '../../components/pr';

export const PlayerStep = ( { styles, set } ) => (
	<PanelSection>
		<PlayerAppearanceSection styles={ styles } set={ set } />
		<PlaybackSection styles={ styles } set={ set } />
		<NavButtonsSection styles={ styles } set={ set } />
	</PanelSection>
);
