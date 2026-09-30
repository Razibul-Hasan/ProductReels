# Building ProductReels

The release includes the readable source for all compiled assets:

- `admin/src/`: administration interface.
- `public/src/`: public widget entry point.
- `block/src/`: block editor interface.
- `src/shared/`: shared renderer, player, providers and styles.

Use Node.js 20.19 or newer (or 22.13 or newer on the Node.js 22 line) and npm 8.19.2 or newer. From the plugin directory, run:

```sh
npm install
npm run build
```

`package.json` declares the build dependencies, and `webpack.config.js` defines the entry points. The build writes JavaScript, CSS and WordPress dependency metadata to `admin/dist/`, `public/dist/` and `block/dist/`. WordPress supplies React and the externalized WordPress packages at runtime.

To regenerate the translation template with WP-CLI available:

```sh
npm run make-pot
```

To build the assets and create the installable `productreels.zip` archive:

```sh
npm run zip
```

The release archive includes both the source and compiled assets. Development dependencies, source maps and local verification reports are excluded.
