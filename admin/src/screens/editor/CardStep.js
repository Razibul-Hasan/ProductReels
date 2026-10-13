/**
 * Product card step: how tagged products appear.
 *
 * Part 07 interim: the 1.0.0 Product Card section. Part 09 rebuilds the step.
 */

import { ProductCardSection } from '../StylePanel';
import { PanelSection } from '../../components/pr';

export const CardStep = ( { styles, set } ) => (
	<PanelSection>
		<ProductCardSection styles={ styles } set={ set } />
	</PanelSection>
);
