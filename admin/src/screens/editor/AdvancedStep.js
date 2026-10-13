/**
 * Advanced step: lazy loading and a class for the merchant's own CSS.
 *
 * Part 07 interim: the 1.0.0 Advanced section. Part 09 rebuilds the step.
 */

import { AdvancedSection } from '../StylePanel';
import { PanelSection } from '../../components/pr';

export const AdvancedStep = ( { styles, set } ) => (
	<PanelSection>
		<AdvancedSection styles={ styles } set={ set } />
	</PanelSection>
);
