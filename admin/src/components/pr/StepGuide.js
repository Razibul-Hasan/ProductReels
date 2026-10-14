/**
 * StepGuide: the first-run guide on Widgets.
 *
 * Three steps that tick off from real data: a reel exists, a widget exists,
 * a widget has views. The current step opens to show what to do and the
 * page's one primary action; the others stay a single quiet line. The last
 * step also ticks off on its own once a widget is found on a page, and can
 * be marked done by hand for places the plugin can't see.
 *
 * The illustration fans out the store's own reel covers where it has any
 * and neutral frames where it doesn't.
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { Button } from './Button';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

/**
 * A cover image, or nothing so the frame shows through.
 *
 * @param {Object} props       Props.
 * @param {Array}  props.list  Cover URLs.
 * @param {number} props.index Which one; wraps around the list.
 */
const Cover = ( { list, index } ) => {
	const src = list.length ? list[ index % list.length ] : '';

	return src ? <img src={ src } alt="" loading="lazy" /> : null;
};

const GuideArt = ( { covers } ) => (
	<div className="pr-guide__art" aria-hidden="true">
		<div className="pr-guide__fan">
			<span className="pr-guide__reel pr-guide__reel--back">
				<Cover list={ covers } index={ 1 } />
			</span>
			<span className="pr-guide__reel pr-guide__reel--side">
				<Cover list={ covers } index={ 2 } />
			</span>
			<span className="pr-guide__reel pr-guide__reel--front">
				<Cover list={ covers } index={ 0 } />
				<span className="pr-guide__play">
					<Icon name="play" size={ 16 } />
				</span>
				<span className="pr-guide__product">
					<span className="pr-guide__thumb">
						<Cover list={ covers } index={ 0 } />
					</span>
					<span className="pr-guide__lines">
						<span />
						<span />
					</span>
				</span>
			</span>
		</div>
	</div>
);

/**
 * @param {Object}   props                 Props.
 * @param {number}   props.done            Steps already done: 0, 1 or 2.
 * @param {string[]} props.covers          Reel cover URLs for the illustration.
 * @param {string}   props.shortcode       The shortcode step 3 copies.
 * @param {Function} props.onAddReel       Step 1.
 * @param {Function} props.onCreateWidget  Step 2.
 * @param {Function} props.onCopyShortcode Step 3.
 * @param {Function} props.onMarkDone      Step 3 by hand; may return a promise.
 * @param {string}   props.title           Heading.
 * @param {string}   props.description     One sentence under it.
 * @return {Object} The guide.
 */
export const StepGuide = ( {
	done = 0,
	covers = [],
	shortcode = '[productreels id="1"]',
	onAddReel,
	onCreateWidget,
	onCopyShortcode,
	onMarkDone,
	title = __( 'Set up your first widget', 'productreels' ),
	description = __(
		'A widget is a styled set of reels you place on a page. Most stores are live in three steps.',
		'productreels'
	),
} ) => {
	const [ marking, setMarking ] = useState( false );

	const markDone = async () => {
		setMarking( true );

		try {
			await onMarkDone();
		} finally {
			setMarking( false );
		}
	};

	const steps = [
		{
			title: __( 'Add a reel', 'productreels' ),
			desc: __(
				'Upload a vertical video or paste a YouTube Shorts, Vimeo or video link. Tag the products it sells.',
				'productreels'
			),
			cta: __( 'Add reel', 'productreels' ),
			icon: 'plus',
			onClick: onAddReel,
		},
		{
			title: __( 'Create a widget', 'productreels' ),
			desc: __(
				'Pick reels, choose a layout and style it while you watch the live preview.',
				'productreels'
			),
			cta: __( 'Create widget', 'productreels' ),
			icon: 'grid',
			onClick: onCreateWidget,
		},
		{
			title: __( 'Place it on a page', 'productreels' ),
			desc: __(
				'Paste the shortcode, or add the ProductReels block in the editor or Elementor. This step ticks off once a widget is on a page.',
				'productreels'
			),
			cta: __( 'Copy shortcode', 'productreels' ),
			icon: 'copy',
			onClick: onCopyShortcode,
		},
	];

	return (
		<section className="pr-guide" aria-labelledby="pr-guide-title">
			<div className="pr-guide__main">
				<p className="pr-guide__eyebrow pr-t-caption">
					{ sprintf(
						/* translators: 1: steps done, 2: all steps. */
						__(
							'Getting started · %1$d of %2$d done',
							'productreels'
						),
						done,
						steps.length
					) }
				</p>
				<h2 id="pr-guide-title" className="pr-t-display-xl">
					{ title }
				</h2>
				<p className="pr-guide__lede pr-t-body">{ description }</p>
				<span
					className="pr-guide__progress"
					aria-hidden="true"
					style={ { '--pr-guide-done': done / steps.length } }
				/>
				<ol className="pr-guide__steps">
					{ steps.map( ( step, index ) => {
						let state = 'upcoming';

						if ( index < done ) {
							state = 'done';
						} else if ( index === done ) {
							state = 'current';
						}

						return (
							<li
								key={ step.title }
								className={ cx(
									'pr-step',
									`pr-step--${ state }`
								) }
								aria-current={
									state === 'current' ? 'step' : undefined
								}
							>
								<span className="pr-step__num pr-t-caption">
									{ state === 'done' ? (
										<Icon
											name="check"
											size={ 13 }
											strokeWidth={ 2.5 }
										/>
									) : (
										index + 1
									) }
								</span>
								<div className="pr-step__body">
									<h3 className="pr-step__title pr-t-heading">
										{ step.title }
									</h3>
									{ state === 'current' && (
										<>
											<p className="pr-step__desc pr-t-small">
												{ step.desc }
											</p>
											<div className="pr-step__foot">
												<Button
													variant="primary"
													icon={ step.icon }
													onClick={ step.onClick }
												>
													{ step.cta }
												</Button>
												{ index === 2 && (
													<code className="pr-guide__code pr-t-code">
														<bdi dir="ltr">
															{ shortcode }
														</bdi>
													</code>
												) }
											</div>
											{ index === 2 && onMarkDone && (
												<div className="pr-step__alt">
													<span className="pr-t-small">
														{ __(
															'Placed it another way?',
															'productreels'
														) }
													</span>
													<Button
														variant="ghost"
														size="sm"
														icon="check"
														busy={ marking }
														onClick={ markDone }
													>
														{ __(
															'Mark as done',
															'productreels'
														) }
													</Button>
												</div>
											) }
										</>
									) }
								</div>
								{ state === 'done' && (
									<span className="pr-step__state pr-t-caption">
										{ __( 'Done', 'productreels' ) }
									</span>
								) }
							</li>
						);
					} ) }
				</ol>
			</div>
			<GuideArt covers={ covers } />
		</section>
	);
};
