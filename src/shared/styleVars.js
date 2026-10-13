/**
 * Turn the style object into the custom properties the stylesheets read.
 *
 * Every size and colour a template or the player needs arrives this way, so
 * the stylesheets never have to know the shape of the style object. A stored
 * value always arrives here and always wins: the design's defaults are only
 * the fallbacks in the stylesheet, for a property that is not set.
 *
 * Responsive values are handed over as three buckets — `-desk`, `-tab`,
 * `-mob` — and never as the bare property. These land as inline styles, and
 * an inline `--prs-tile-w` would beat every media query and device class in
 * the stylesheet; embed.scss picks the bucket for the current width itself
 * and turns it into `--prs-tile-w`, `--prs-gap` and `--pr-radius-reel`.
 *
 * @param {Object} styles The widget's styles.
 * @return {Object} Inline custom properties for the widget's root.
 */
export const styleVars = ( styles ) => ( {
	'--wr-size-desk': `${ styles.size }px`,
	'--wr-size-tab': `${ styles.sizeOnTab }px`,
	'--wr-size-mob': `${ styles.sizeOnMobile }px`,
	'--wr-gap-desk': `${ styles.gap }px`,
	'--wr-gap-tab': `${ styles.gapOnTab }px`,
	'--wr-gap-mob': `${ styles.gapOnMobile }px`,
	'--wr-radius-desk': `${ styles.border.radius }px`,
	'--wr-radius-tab': `${ styles.border.radiusOnTab }px`,
	'--wr-radius-mob': `${ styles.border.radiusOnMobile }px`,
	'--wr-pad-block': `${ styles.topBottomSpacing }px`,
	'--pr-reel-scrim': styles.overlayColor,
	'--prs-caption': styles.captionColor,
	'--prs-below': styles.titleColor,
	'--prs-card-bg': styles.cardBgColor,
	'--prs-border-w': `${ styles.border.width }px`,
	'--prs-ring': styles.border.color,
	'--prs-shadow': `${ styles.shadow.size }px`,
	'--prs-play-size': `${ styles.playIconSize }px`,
	'--prs-play-fg': styles.playIconColor,
	'--prs-views-bg': styles.viewsBgColor,
	'--prs-views-fg': styles.viewsTextIconColor,
	'--prs-arrow-bg': styles.carouselBtnBgColor,
	'--prs-arrow-fg': styles.carouselBtnIconColor,
	'--prs-arrow-bg-hover': styles.carouselBtnHoverBgColor,
	'--prs-arrow-fg-hover': styles.carouselBtnHoverIconColor,
	'--prs-arrow-radius': `${ styles.carouselBtnBorderRadius }px`,
	'--prs-title-size': `${ styles.widgetTitle.fontSize }px`,
	'--prs-title-color': styles.widgetTitle.color,
	'--prs-title-mt': `${ styles.widgetTitle.spacingTop }px`,
	'--prs-title-mb': `${ styles.widgetTitle.spacingBottom }px`,
} );

/**
 * The player's share of the style object: its previous / next buttons.
 * Everything else in the player is the design's own stage, so a tile's
 * overlay shade or view-pill colour never reaches it.
 *
 * @param {Object} styles The widget's styles.
 * @return {Object} Inline custom properties for the player's root.
 */
export const playerVars = ( styles ) => ( {
	'--prs-nav-bg': styles.previewBtnBgColor,
	'--prs-nav-fg': styles.previewBtnIconColor,
	'--prs-nav-bg-hover': styles.previewBtnHoverBgColor,
	'--prs-nav-fg-hover': styles.previewBtnHoverIconColor,
	'--prs-nav-radius': `${ styles.previewBtnBorderRadius }px`,
} );
