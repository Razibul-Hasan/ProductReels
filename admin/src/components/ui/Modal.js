/**
 * Modal and ConfirmDialog, as the 1.0.0 screens call them.
 *
 * 1.1.0: there is one dialog implementation, pr/Dialog.js. This file maps the
 * 1.0.0 props onto it so every existing dialog keeps working in the new look:
 * `wide` and `size` ('sm', 'xl') keep their 1.0.0 widths, and the body keeps
 * block layout for the content written for it. ConfirmDialog already accepts
 * the 1.0.0 props (confirmLabel, tone, busy). Part 14 removes this file once
 * no screen imports it.
 */

import { ConfirmDialog, Dialog } from '../pr/Dialog';

const SIZES = { sm: 'sm', xl: 'xl' };

export const Modal = ( { wide = false, size = '', ...props } ) => (
	<Dialog
		size={ wide ? 'lg' : SIZES[ size ] }
		bodyClassName="pr-dialog__body--legacy"
		{ ...props }
	/>
);

export { ConfirmDialog };
