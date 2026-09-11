/**
 * The icon set.
 *
 * Authored here rather than pulled from a package: the app needs about thirty
 * glyphs and an icon library would cost more than all of them put together.
 * Every icon is a 24-grid stroke drawing at 1.6 weight so they sit together
 * evenly, and every one is aria-hidden — the label always lives on the control.
 */

const Svg = ( { size = 16, children, ...rest } ) => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.6"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		focusable="false"
		{ ...rest }
	>
		{ children }
	</svg>
);

export const IconSearch = ( p ) => (
	<Svg { ...p }>
		<circle cx="11" cy="11" r="7" />
		<path d="m20 20-3.2-3.2" />
	</Svg>
);

export const IconClose = ( p ) => (
	<Svg { ...p }>
		<path d="M18 6 6 18M6 6l12 12" />
	</Svg>
);

export const IconPlus = ( p ) => (
	<Svg { ...p }>
		<path d="M12 5v14M5 12h14" />
	</Svg>
);

export const IconEdit = ( p ) => (
	<Svg { ...p }>
		<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
		<path d="m15 6 3 3" />
	</Svg>
);

export const IconTrash = ( p ) => (
	<Svg { ...p }>
		<path d="M4 7h16M9 7V5h6v2M6 7l1 12h10l1-12" />
		<path d="M10 11v5M14 11v5" />
	</Svg>
);

export const IconCopy = ( p ) => (
	<Svg { ...p }>
		<rect x="9" y="9" width="11" height="11" rx="2" />
		<path d="M5 15V6a2 2 0 0 1 2-2h9" />
	</Svg>
);

export const IconDuplicate = ( p ) => (
	<Svg { ...p }>
		<rect x="4" y="4" width="11" height="11" rx="2" />
		<path d="M9 20h9a2 2 0 0 0 2-2V9" />
	</Svg>
);

export const IconChart = ( p ) => (
	<Svg { ...p }>
		<path d="M5 20V11M12 20V4M19 20v-6" />
	</Svg>
);

export const IconCheck = ( p ) => (
	<Svg { ...p }>
		<path d="m5 12.5 4.5 4.5L19 7" />
	</Svg>
);

export const IconChevronRight = ( p ) => (
	<Svg { ...p }>
		<path d="m9 5 7 7-7 7" />
	</Svg>
);

export const IconChevronDown = ( p ) => (
	<Svg { ...p }>
		<path d="m5 9 7 7 7-7" />
	</Svg>
);

export const IconChevronLeft = ( p ) => (
	<Svg { ...p }>
		<path d="m15 5-7 7 7 7" />
	</Svg>
);

export const IconPlay = ( p ) => (
	<Svg { ...p }>
		<path d="M7 4.5v15l13-7.5-13-7.5Z" />
	</Svg>
);

export const IconEye = ( p ) => (
	<Svg { ...p }>
		<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
		<circle cx="12" cy="12" r="2.6" />
	</Svg>
);

export const IconLink = ( p ) => (
	<Svg { ...p }>
		<path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 1 0-5.7-5.7L11.6 6.7" />
		<path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 1 0 5.7 5.7l1.5-1.5" />
	</Svg>
);

export const IconTag = ( p ) => (
	<Svg { ...p }>
		<path d="M4 4h7l9 9-7 7-9-9V4Z" />
		<circle cx="8.5" cy="8.5" r="1.4" />
	</Svg>
);

export const IconImage = ( p ) => (
	<Svg { ...p }>
		<rect x="3" y="4" width="18" height="16" rx="2" />
		<circle cx="9" cy="10" r="1.6" />
		<path d="m4 18 5-5 4 4 3-3 4 4" />
	</Svg>
);

export const IconUpload = ( p ) => (
	<Svg { ...p }>
		<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
		<path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
	</Svg>
);

export const IconWarning = ( p ) => (
	<Svg { ...p }>
		<path d="M12 3.8 2.6 20h18.8L12 3.8Z" />
		<path d="M12 10v4M12 17.2v.1" />
	</Svg>
);

export const IconInfo = ( p ) => (
	<Svg { ...p }>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 11v5M12 8v.1" />
	</Svg>
);

export const IconSpinner = ( p ) => (
	<Svg { ...p } className="wr-spinner">
		<path d="M12 3a9 9 0 1 0 9 9" />
	</Svg>
);

export const IconGrip = ( p ) => (
	<Svg { ...p }>
		<circle cx="9" cy="6" r="1.1" fill="currentColor" />
		<circle cx="15" cy="6" r="1.1" fill="currentColor" />
		<circle cx="9" cy="12" r="1.1" fill="currentColor" />
		<circle cx="15" cy="12" r="1.1" fill="currentColor" />
		<circle cx="9" cy="18" r="1.1" fill="currentColor" />
		<circle cx="15" cy="18" r="1.1" fill="currentColor" />
	</Svg>
);

export const IconDesktop = ( p ) => (
	<Svg { ...p }>
		<rect x="2.5" y="4" width="19" height="12" rx="2" />
		<path d="M9 20h6M12 16v4" />
	</Svg>
);

export const IconTablet = ( p ) => (
	<Svg { ...p }>
		<rect x="5" y="2.5" width="14" height="19" rx="2" />
		<path d="M11 18.5h2" />
	</Svg>
);

export const IconMobile = ( p ) => (
	<Svg { ...p }>
		<rect x="7" y="2.5" width="10" height="19" rx="2" />
		<path d="M11 18.5h2" />
	</Svg>
);

export const IconReset = ( p ) => (
	<Svg { ...p }>
		<path d="M4 11a8 8 0 1 1 2.3 5.7" />
		<path d="M3.5 6.5V11H8" />
	</Svg>
);

export const IconVideo = ( p ) => (
	<Svg { ...p }>
		<rect x="2.5" y="5" width="13" height="14" rx="2" />
		<path d="m15.5 10.5 6-3.5v10l-6-3.5" />
	</Svg>
);

export const IconRectangle = ( p ) => (
	<Svg { ...p }>
		<rect x="7.5" y="3" width="9" height="18" rx="1.5" />
	</Svg>
);

export const IconCircle = ( p ) => (
	<Svg { ...p }>
		<circle cx="12" cy="12" r="8.5" />
	</Svg>
);

export const IconExternal = ( p ) => (
	<Svg { ...p }>
		<path d="M14 4h6v6" />
		<path d="M20 4 11 13" />
		<path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
	</Svg>
);

export const IconCamera = ( p ) => (
	<Svg { ...p }>
		<path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
		<circle cx="12" cy="13" r="3.4" />
	</Svg>
);

export const IconSave = ( p ) => (
	<Svg { ...p }>
		<path d="M5 4h11l3 3v13H5V4Z" />
		<path d="M8 4v5h7V4" />
		<path d="M8 20v-6h8v6" />
	</Svg>
);

export const IconPanel = ( p ) => (
	<Svg { ...p }>
		<rect x="3.5" y="4.5" width="17" height="15" rx="2" />
		<path d="M15 4.5v15" />
	</Svg>
);

export const IconLayout = ( p ) => (
	<Svg { ...p }>
		<rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
		<rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
		<rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
		<rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
	</Svg>
);

export const IconSliders = ( p ) => (
	<Svg { ...p }>
		<path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
		<circle cx="16" cy="7" r="2" />
		<circle cx="10" cy="17" r="2" />
	</Svg>
);

export const IconType = ( p ) => (
	<Svg { ...p }>
		<path d="M5 6V4h14v2" />
		<path d="M12 4v16" />
		<path d="M9 20h6" />
	</Svg>
);

export const IconCart = ( p ) => (
	<Svg { ...p }>
		<path d="M3 4h2l2.4 11h11.2L21 7H6" />
		<circle cx="9" cy="19" r="1.4" />
		<circle cx="17" cy="19" r="1.4" />
	</Svg>
);

export const IconUndo = ( p ) => (
	<Svg { ...p }>
		<path d="M8 8H4V4" />
		<path d="M4.5 8.5A8 8 0 1 1 4 13" />
	</Svg>
);

export const IconPalette = ( p ) => (
	<Svg { ...p }>
		<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.5 0 2-.9 2-2 0-1.2-.6-1.6-.6-2.5 0-1 .8-1.5 1.8-1.5h1.6a3.7 3.7 0 0 0 3.7-3.7C20.5 6.9 16.7 3.5 12 3.5Z" />
		<circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
		<circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
		<circle cx="16" cy="10" r="1.2" fill="currentColor" stroke="none" />
	</Svg>
);
