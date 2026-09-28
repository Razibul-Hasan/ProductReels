/**
 * Picks the template a widget's styles ask for.
 *
 * The single entry point both the admin preview and the public bundle render
 * through — §11.1's "same components, same CSS, zero drift" hinges on nothing
 * else knowing how to choose a template.
 */

import { useInView } from './hooks/useInView';
import { Carousel } from './templates/Carousel';
import { Grid } from './templates/Grid';
import { Marquee } from './templates/Marquee';
import { Popup } from './templates/Popup';
import { Stacked } from './templates/Stacked';
import { ProductsContext, useProducts } from './products';
import { styleVars } from './styleVars';

export { styleVars };

const TEMPLATES = {
	grid: Grid,
	carousel: Carousel,
	marquee: Marquee,
	stacked: Stacked,
	popup: Popup,
};

export const WidgetRenderer = ( {
	widget,
	styles,
	onOpen,
	onApproach,
	device,
	inEditor = false,
	className = '',
	services,
} ) => {
	const Template = TEMPLATES[ styles.template ] || Grid;
	const reels = widget.reels || [];
	// Looked up here, once per widget, for every thumbnail that shows a card.
	const products = useProducts( reels, services );
	// The cards rise into place the first time the widget scrolls into view.
	// Not in the editor, where every style change re-renders them and the
	// entrance would replay on each; and not for a popup, which has its own.
	const reveal = ! inEditor && styles.template !== 'popup';
	const [ revealRef, seen ] = useInView( { rootMargin: '0px' } );

	if ( reels.length === 0 ) {
		return null;
	}

	const titled = styles.widgetTitle.alignment !== 'hidden' && !! widget.name;

	return (
		<ProductsContext.Provider value={ products }>
			<div
				ref={ revealRef }
				className={ [
					'productreels-embed',
					device ? `productreels-embed--${ device }` : '',
					reveal ? 'productreels-embed--reveal' : '',
					reveal && seen ? 'is-revealed' : '',
					`productreels-embed--align-${
						styles.alignment || 'center'
					}`,
					inEditor ? 'productreels-embed--in-editor' : '',
					styles.customClass || '',
					className,
				]
					.filter( Boolean )
					.join( ' ' ) }
				style={ styleVars( styles ) }
				data-template={ styles.template }
				onPointerEnter={ onApproach }
				onTouchStart={ onApproach }
				onFocus={ onApproach }
			>
				{ titled && (
					<h2
						className="wr-widget-title"
						style={ { textAlign: styles.widgetTitle.alignment } }
					>
						{ widget.name }
					</h2>
				) }

				<Template
					// A popup's entrance depends on its corner; remounting on a
					// corner change replays it, so the editor shows the new
					// direction instead of the bubble just jumping across.
					key={
						inEditor && styles.template === 'popup'
							? styles.popup.position
							: undefined
					}
					reels={ reels }
					styles={ styles }
					onOpen={ onOpen }
					widgetId={ widget.id }
					alwaysOpen={ inEditor }
				/>
			</div>
		</ProductsContext.Provider>
	);
};
