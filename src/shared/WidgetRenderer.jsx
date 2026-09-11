/**
 * Picks the template a widget's styles ask for.
 *
 * The single entry point both the admin preview and the public bundle render
 * through — §11.1's "same components, same CSS, zero drift" hinges on nothing
 * else knowing how to choose a template.
 */

import { Carousel } from './templates/Carousel';
import { Grid } from './templates/Grid';
import { Marquee } from './templates/Marquee';
import { Popup } from './templates/Popup';
import { Stacked } from './templates/Stacked';
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
	device,
	inEditor = false,
	className = '',
} ) => {
	const Template = TEMPLATES[ styles.template ] || Grid;
	const reels = widget.reels || [];

	if ( reels.length === 0 ) {
		return null;
	}

	const titled = styles.widgetTitle.alignment !== 'hidden' && !! widget.name;

	return (
		<div
			className={ [
				'wooreels-embed',
				device ? `wooreels-embed--${ device }` : '',
				inEditor ? 'wooreels-embed--in-editor' : '',
				styles.customClass || '',
				className,
			]
				.filter( Boolean )
				.join( ' ' ) }
			style={ styleVars( styles ) }
			data-template={ styles.template }
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
				reels={ reels }
				styles={ styles }
				onOpen={ onOpen }
				widgetId={ widget.id }
				alwaysOpen={ inEditor }
			/>
		</div>
	);
};
