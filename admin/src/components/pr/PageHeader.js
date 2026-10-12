/**
 * PageHeader: the top of a list or settings page.
 *
 * The page title in `display`, an optional count, one sentence saying what
 * lives here, and the page's actions on the right: search first, the primary
 * action last. `back` adds a back button for sub-pages such as Statistics.
 */

import { Count } from './Badge';
import { IconButton } from './Button';

/**
 * @param {Object}   props             Props.
 * @param {string}   props.title       The page title.
 * @param {?number}  props.count       A count beside the title, or null.
 * @param {string}   props.description One sentence under the title.
 * @param {string}   props.back        The back button's label, when there is one.
 * @param {Function} props.onBack      Called by the back button.
 * @param {Object}   props.actions     Search and Buttons, primary last.
 * @return {Object} The header.
 */
export const PageHeader = ( {
	title,
	count,
	description,
	back,
	onBack,
	actions,
} ) => (
	<div className="pr-pagehead">
		<div className="pr-pagehead__lead">
			{ back && (
				<IconButton
					icon="arrow-left"
					label={ back }
					size="md"
					variant="outline"
					className="pr-pagehead__back"
					onClick={ onBack }
				/>
			) }
			<div>
				<h1 className="pr-pagehead__title pr-t-display">
					{ title }
					{ count !== null && count !== undefined && (
						<Count>{ count }</Count>
					) }
				</h1>
				{ description && (
					<p className="pr-pagehead__desc pr-t-body">
						{ description }
					</p>
				) }
			</div>
		</div>
		{ actions && <div className="pr-pagehead__actions">{ actions }</div> }
	</div>
);
