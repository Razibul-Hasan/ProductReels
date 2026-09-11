/**
 * Turn the style object into the custom properties the SCSS reads.
 *
 * Every size and colour a template or the player needs arrives this way, so
 * the stylesheets never have to know the shape of the style object. Lives in
 * its own module because both the widget renderer and the (separately
 * loaded) player need it.
 *
 * @param {Object} styles The widget's styles.
 * @return {Object} Inline custom properties.
 */
export const styleVars = ( styles ) => ( {
	'--wr-size': `${ styles.size }px`,
	'--wr-size-tab': `${ styles.sizeOnTab }px`,
	'--wr-size-mob': `${ styles.sizeOnMobile }px`,
	'--wr-gap': `${ styles.gap }px`,
	'--wr-gap-tab': `${ styles.gapOnTab }px`,
	'--wr-gap-mob': `${ styles.gapOnMobile }px`,
	'--wr-pad-block': `${ styles.topBottomSpacing }px`,
	'--wr-card-bg': styles.cardBgColor,
	'--wr-border-w': `${ styles.border.width }px`,
	'--wr-border-c': styles.border.color,
	'--wr-radius': `${ styles.border.radius }px`,
	'--wr-radius-tab': `${ styles.border.radiusOnTab }px`,
	'--wr-radius-mob': `${ styles.border.radiusOnMobile }px`,
	'--wr-shadow-size': `${ styles.shadow.size }px`,
	'--wr-nav-bg': styles.carouselBtnBgColor,
	'--wr-nav-fg': styles.carouselBtnIconColor,
	'--wr-nav-bg-hover': styles.carouselBtnHoverBgColor,
	'--wr-nav-fg-hover': styles.carouselBtnHoverIconColor,
	'--wr-nav-radius': `${ styles.carouselBtnBorderRadius }px`,
	'--wr-title-size': `${ styles.widgetTitle.fontSize }px`,
	'--wr-title-color': styles.widgetTitle.color,
	'--wr-pbtn-bg': styles.previewBtnBgColor,
	'--wr-pbtn-fg': styles.previewBtnIconColor,
	'--wr-pbtn-bg-hover': styles.previewBtnHoverBgColor,
	'--wr-pbtn-fg-hover': styles.previewBtnHoverIconColor,
	'--wr-pbtn-radius': `${ styles.previewBtnBorderRadius }px`,
} );
