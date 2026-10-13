/**
 * Layout step: how reels sit on the page, and the widget title.
 *
 * Part 07 interim: the 1.0.0 Layout section and the title fields that used
 * to open from the header. Part 08 rebuilds the step.
 */

import { LayoutSection } from '../StylePanel';
import { TitleAppearanceFields } from '../TitleAppearanceDialog';
import { PanelSection } from '../../components/pr';
import { __ } from '@wordpress/i18n';

export const LayoutStep = ( { name, styles, set, setDevice } ) => (
	<>
		<PanelSection>
			<LayoutSection
				styles={ styles }
				set={ set }
				setDevice={ setDevice }
			/>
		</PanelSection>
		<PanelSection title={ __( 'Title', 'productreels' ) }>
			<TitleAppearanceFields
				name={ name }
				styles={ styles }
				set={ set }
			/>
		</PanelSection>
	</>
);
