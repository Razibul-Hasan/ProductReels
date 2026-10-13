/**
 * SettingsCard and SettingRow: a titled group of settings on the Settings
 * page, one row per setting with what it does on the left and its control on
 * the right (or below, for wide controls).
 *
 * `descriptionId` lets the control name the description with
 * aria-describedby; `foot` spans the whole row under both columns (a field's
 * error, which is wider than the control it belongs to).
 */

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

export const SettingRow = ( {
	title,
	description,
	descriptionId,
	children,
	below,
	foot,
} ) => (
	<div className={ cx( 'pr-setting', below && 'pr-setting--below' ) }>
		<div className="pr-setting__text">
			<h4 className="pr-t-heading">{ title }</h4>
			{ description && (
				<p className="pr-t-small" id={ descriptionId }>
					{ description }
				</p>
			) }
		</div>
		{ children && <div className="pr-setting__control">{ children }</div> }
		{ foot && <div className="pr-setting__foot">{ foot }</div> }
	</div>
);

export const SettingsCard = ( { title, description, tone, children, id } ) => (
	<section
		className={ cx(
			'pr-settings',
			tone === 'danger' && 'pr-settings--danger'
		) }
		id={ id }
		aria-labelledby={ id ? `${ id }-title` : undefined }
	>
		<div className="pr-settings__head">
			<h3 className="pr-t-title" id={ id ? `${ id }-title` : undefined }>
				{ title }
			</h3>
			{ description && <p className="pr-t-body">{ description }</p> }
		</div>
		{ children }
	</section>
);
