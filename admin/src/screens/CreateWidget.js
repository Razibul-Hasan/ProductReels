/**
 * Create widget: name, layout and shape, before the editor opens.
 *
 * Nothing is written here. "Choose reels" keeps the three answers as a draft
 * for this browser tab and opens the editor on `#/widgets/draft`, where the
 * widget stays unsaved until Save widget creates it, exactly as 1.0.0's
 * create screen did (one POST, on the first save). Keeping the draft in
 * sessionStorage means a reload of the editor still starts from what was
 * chosen.
 */

import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { boot } from '../api';
import {
	Button,
	Dialog,
	Segmented,
	TemplatePicker,
	TextField,
} from '../components/pr';

export const DRAFT_ROUTE = '#/widgets/draft';

const DRAFT_KEY = 'productreels_widget_draft';

let memoryDraft = null;

/**
 * The layout, shape and name chosen in the dialog, if any.
 *
 * @return {{name: string, template: string, shape: string}|null} The draft.
 */
export const readDraft = () => {
	try {
		const stored = window.sessionStorage.getItem( DRAFT_KEY );

		if ( stored ) {
			return JSON.parse( stored );
		}
	} catch ( error ) {
		// Storage blocked or the value unreadable: fall back to memory.
	}

	return memoryDraft;
};

const writeDraft = ( draft ) => {
	memoryDraft = draft;

	try {
		window.sessionStorage.setItem( DRAFT_KEY, JSON.stringify( draft ) );
	} catch ( error ) {
		// Memory is enough for this page load.
	}
};

/** Forget the draft once the widget exists. */
export const clearDraft = () => {
	memoryDraft = null;

	try {
		window.sessionStorage.removeItem( DRAFT_KEY );
	} catch ( error ) {
		// Nothing stored.
	}
};

export const SHAPES = [
	{
		value: 'rectangle',
		label: __( 'Rectangle', 'productreels' ),
		icon: 'rectangle',
	},
	{ value: 'circle', label: __( 'Circle', 'productreels' ), icon: 'circle' },
];

export const CreateWidgetDialog = ( { navigate, onClose } ) => {
	const formId = useInstanceId( CreateWidgetDialog, 'pr-create-widget' );
	const [ name, setName ] = useState( '' );
	const [ template, setTemplate ] = useState(
		boot.defaults?.template || 'carousel'
	);
	const [ shape, setShape ] = useState( boot.defaults?.shape || 'rectangle' );

	const submit = ( event ) => {
		event.preventDefault();
		writeDraft( { name: name.trim(), template, shape } );
		navigate( DRAFT_ROUTE );
	};

	return (
		<Dialog
			size="wide"
			title={ __( 'Create widget', 'productreels' ) }
			description={ __(
				'Choose how reels sit on the page. You can change it any time.',
				'productreels'
			) }
			onClose={ onClose }
			footer={
				<>
					<Button onClick={ onClose }>
						{ __( 'Cancel', 'productreels' ) }
					</Button>
					<Button
						type="submit"
						form={ formId }
						variant="primary"
						iconRight="chevron-right"
					>
						{ __( 'Choose reels', 'productreels' ) }
					</Button>
				</>
			}
		>
			<form id={ formId } className="pr-create" onSubmit={ submit }>
				<TextField
					label={ __( 'Widget name', 'productreels' ) }
					help={ __( 'Only you see this.', 'productreels' ) }
					placeholder={ __( 'Homepage stories', 'productreels' ) }
					maxLength={ 191 }
					value={ name }
					onChange={ ( event ) => setName( event.target.value ) }
				/>
				<TemplatePicker
					variant="tile"
					value={ template }
					onChange={ setTemplate }
				/>
				<div className="pr-create__shape">
					<span className="pr-t-label" aria-hidden="true">
						{ __( 'Reel shape', 'productreels' ) }
					</span>
					<Segmented
						label={ __( 'Reel shape', 'productreels' ) }
						value={ shape }
						onChange={ setShape }
						options={ SHAPES }
					/>
				</div>
			</form>
		</Dialog>
	);
};
