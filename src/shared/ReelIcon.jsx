/**
 * An icon on the storefront: tiles, product cards and the player.
 *
 * The same component as Icon over the storefront subset (icons-storefront.js),
 * so the public bundle never carries the admin's icons.
 */

import { STOREFRONT_ICONS } from './icons-storefront';
import { IconSvg } from './IconSvg';

export const ReelIcon = ( { name, ...rest } ) => (
	<IconSvg markup={ STOREFRONT_ICONS[ name ] } name={ name } { ...rest } />
);
