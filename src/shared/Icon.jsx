/**
 * One icon from the design's Lucide set (see icons.js).
 *
 * The admin's icon: it can draw every icon in the set. Storefront components
 * use ReelIcon instead, which carries only the icons shoppers see.
 */

import { ICONS } from './icons';
import { IconSvg } from './IconSvg';

export const iconNames = Object.keys( ICONS );

export const Icon = ( { name, ...rest } ) => (
	<IconSvg markup={ ICONS[ name ] } name={ name } { ...rest } />
);

export default Icon;
