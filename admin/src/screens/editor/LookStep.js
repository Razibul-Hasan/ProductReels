/**
 * Look step: what visitors see before they press play.
 *
 * Part 07 interim: the 1.0.0 Thumbnail and Styles sections. Part 09 rebuilds
 * the step.
 */

import { StylesSection, ThumbnailSection } from '../StylePanel';
import { PanelSection } from '../../components/pr';

export const LookStep = ( { styles, set, setDevice } ) => (
	<PanelSection>
		<ThumbnailSection styles={ styles } set={ set } />
		<StylesSection styles={ styles } set={ set } setDevice={ setDevice } />
	</PanelSection>
);
