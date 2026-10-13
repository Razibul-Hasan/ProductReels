/**
 * StepGuide: the first-run guide on Widgets.
 *
 * Three steps that tick off from real data: a reel exists, a widget exists,
 * a widget has views. The current step's button is the page's one primary
 * action; steps after it are shown but disabled.
 *
 * The small illustrations use the store's own reel covers where it has any
 * and neutral frames where it doesn't.
 */

import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { Button } from './Button';

const cx = ( ...names ) => names.filter( Boolean ).join( ' ' );

/**
 * A cover image, or a neutral frame when there is none.
 *
 * @param {Object} props       Props.
 * @param {Array}  props.list  Cover URLs.
 * @param {number} props.index Which one; wraps around the list.
 */
const Cover = ( { list, index } ) => {
	const src = list.length ? list[ index % list.length ] : '';

	return src ? <img src={ src } alt="" loading="lazy" /> : null;
};

const StepArt = ( { step, covers, shortcode } ) => {
	if ( step === 0 ) {
		return (
			<div className="pr-stepart pr-stepart--reel">
				<div className="pr-stepart__frame pr-stepart__frame--lg">
					<Cover list={ covers } index={ 0 } />
					<span className="pr-stepart__card">
						<span className="pr-stepart__thumb">
							<Cover list={ covers } index={ 0 } />
						</span>
						<span className="pr-stepart__bar" />
					</span>
				</div>
				<div className="pr-stepart__badges">
					<span className="pr-badge pr-badge--brand pr-t-caption">
						<Icon name="upload" size={ 14 } />
						{ __( 'Upload', 'productreels' ) }
					</span>
					<span className="pr-badge pr-t-caption">
						<Icon name="youtube" size={ 14 } />
						{ __( 'Shorts', 'productreels' ) }
					</span>
					<span className="pr-badge pr-t-caption">
						<Icon name="tag" size={ 14 } />
						{ __( 'Tag products', 'productreels' ) }
					</span>
				</div>
			</div>
		);
	}

	if ( step === 1 ) {
		return (
			<div className="pr-stepart pr-stepart--row">
				{ [ 1, 2, 3, 4 ].map( ( index ) => (
					<div className="pr-stepart__frame" key={ index }>
						<Cover list={ covers } index={ index } />
					</div>
				) ) }
				<span className="pr-stepart__arrow">
					<Icon name="chevron-right" size={ 16 } />
				</span>
			</div>
		);
	}

	return (
		<div className="pr-stepart pr-stepart--page">
			<span className="pr-stepart__line" />
			<div className="pr-stepart__circles">
				{ [ 0, 1, 2, 3, 4 ].map( ( index ) => (
					<span className="pr-stepart__circle" key={ index }>
						<Cover list={ covers } index={ index } />
					</span>
				) ) }
			</div>
			<span className="pr-shortcode pr-t-code pr-stepart__code">
				<bdi dir="ltr">{ shortcode }</bdi>
				<span className="pr-shortcode__icon">
					<Icon name="copy" size={ 14 } />
				</span>
			</span>
		</div>
	);
};

/**
 * @param {Object}   props                 Props.
 * @param {number}   props.done            Steps already done: 0, 1 or 2.
 * @param {string[]} props.covers          Reel cover URLs for the illustrations.
 * @param {string}   props.shortcode       The shortcode step 3 copies.
 * @param {Function} props.onAddReel       Step 1.
 * @param {Function} props.onCreateWidget  Step 2.
 * @param {Function} props.onCopyShortcode Step 3.
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
	title = __( 'Set up your first widget', 'productreels' ),
	description = __(
		'A widget is a styled set of reels you place on a page. Most stores are live in three steps.',
		'productreels'
	),
} ) => {
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
				'Paste the shortcode, or add the ProductReels block in the editor or Elementor.',
				'productreels'
			),
			cta: __( 'Copy shortcode', 'productreels' ),
			icon: 'copy',
			onClick: onCopyShortcode,
		},
	];

	return (
		<section className="pr-guide" aria-labelledby="pr-guide-title">
			<div className="pr-guide__head">
				<h2 id="pr-guide-title" className="pr-t-display-xl">
					{ title }
				</h2>
				<p className="pr-t-body">{ description }</p>
			</div>
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
							className={ cx( 'pr-step', `pr-step--${ state }` ) }
						>
							<div className="pr-step__art" aria-hidden="true">
								<StepArt
									step={ index }
									covers={ covers }
									shortcode={ shortcode }
								/>
							</div>
							<div className="pr-step__top">
								<span className="pr-step__num pr-t-label">
									{ state === 'done' ? (
										<Icon
											name="check"
											size={ 15 }
											strokeWidth={ 2.5 }
										/>
									) : (
										index + 1
									) }
								</span>
								<h3 className="pr-t-title">{ step.title }</h3>
							</div>
							<p className="pr-step__desc pr-t-body">
								{ step.desc }
							</p>
							<div className="pr-step__foot">
								{ state === 'done' ? (
									<span className="pr-step__state pr-t-label">
										<Icon name="success" size={ 16 } />
										{ __( 'Done', 'productreels' ) }
									</span>
								) : (
									<Button
										variant={
											state === 'current'
												? 'primary'
												: 'secondary'
										}
										icon={ step.icon }
										disabled={ state === 'upcoming' }
										onClick={ step.onClick }
									>
										{ step.cta }
									</Button>
								) }
							</div>
						</li>
					);
				} ) }
			</ol>
		</section>
	);
};
