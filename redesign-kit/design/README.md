# Design files for ProductReels 1.1.0

Everything Claude Code needs to make the plugin look and behave like the design. Start with the screens, then the docs, then the reference code.

```
design/
├── screens/        13 target screens (PNG, 1440px wide)
├── components/     49 components in their states (PNG)
├── docs/
│   ├── flows.md          screens, flows, and which editor step holds every setting
│   ├── brand-book.md     voice, colour, type, spacing, states, icons
│   ├── components.md     usage rules for every component
│   ├── storefront.md     storefront rules and merchant-editable defaults
│   └── wordpress.md      how the design maps onto WordPress
├── reference/
│   ├── components.jsx    working React for every component (@wordpress/element), final markup and classes
│   ├── screens.jsx       the 13 screens composed from those components, with sample data
│   ├── icons.js          Lucide icon paths used by the design (ISC)
│   └── mock-only.css     styles for preview-only helpers — never ship
├── css/
│   ├── pr-tokens.css     tokens as --pr-* custom properties + .pr-t-* type classes (admin and storefront)
│   ├── pr-fonts.css      @font-face for the two Archivo files (admin only)
│   ├── pr-admin.css      admin component styles (pr-*)
│   └── prs-storefront.css storefront styles (prs-*)
├── fonts/          Archivo + Archivo Expanded (woff2, variable weight) and OFL.txt
├── tokens.json     token source
└── build-tokens.mjs  node design/build-tokens.mjs → regenerates pr-tokens.css and pr-fonts.css
```

Rendering `reference/screens.jsx` with the four CSS files reproduces the PNGs exactly; that was checked pixel for pixel when the kit was made.

The live, browsable version of this design system (with interactive previews) is the "ProductReels" Design System artifact in your Claude account.
