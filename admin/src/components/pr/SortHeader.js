/**
 * SortHeader: a `pr-table` column header that sorts the rows on the client.
 *
 * The whole label is the button; only the active column shows its chevron,
 * and `aria-sort` says the direction, so it is never shown by colour alone.
 */

import { Icon } from '@shared/Icon';

/**
 * @param {Object}   props         Props.
 * @param {string}   props.column  The key this header sorts by.
 * @param {string}   props.label   The header text.
 * @param {Object}   props.sort    { column, direction: 'asc'|'desc' }.
 * @param {Function} props.onSort  Called with `column`.
 * @param {boolean}  props.numeric A number column (aligned to the end).
 * @return {Object} The header cell.
 */
export const SortHeader = ( {
	column,
	label,
	sort,
	onSort,
	numeric = false,
} ) => {
	const active = sort.column === column;
	let ariaSort = 'none';

	if ( active ) {
		ariaSort = sort.direction === 'asc' ? 'ascending' : 'descending';
	}

	return (
		<th
			scope="col"
			aria-sort={ ariaSort }
			className={ numeric ? 'num' : '' }
		>
			<button
				type="button"
				className="pr-sort pr-t-label"
				data-active={ active ? 'true' : undefined }
				onClick={ () => onSort( column ) }
			>
				{ label }
				{ active && (
					<Icon
						name={
							sort.direction === 'asc'
								? 'chevron-up'
								: 'chevron-down'
						}
						size={ 14 }
					/>
				) }
			</button>
		</th>
	);
};
