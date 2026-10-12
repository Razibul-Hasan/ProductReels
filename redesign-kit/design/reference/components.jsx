/**
 * ProductReels 1.1.0 reference components (port-ready).
 * - Markup and class names are final; port them into admin/src and the storefront source, splitting into files as the codebase does.
 * - Wrap every user-facing string in __() / _n() / sprintf() from @wordpress/i18n with the plugin text domain when porting.
 * - PosterArt, demo, WpAdminFrame and anything marked MOCKUP ONLY are for previews and must not ship.
 */
import { useState, Fragment } from '@wordpress/element';
import { ICONS } from './icons.js';
const cx = (...a) => a.filter(Boolean).join(' ');
const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : n);
const rate = (clicks, views) => (views ? ((clicks / views) * 100).toFixed(1) + '%' : '—');

/* ---------- Icon ---------- */
export function Icon({ name, size = 18, strokeWidth = 1.75, fill = 'none', className, label, style }) {
  return (
    <svg
      className={cx('pr-icon', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
      style={style}
      dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }}
    />
  );
}
export const iconNames = Object.keys(ICONS);

/* ---------- Placeholder poster art (mockups only) ---------- */
const POSTERS = {
  serum: { bg: '#f3dccd', floor: '#d9b49c', body: '#b5652f', cap: '#2a2420', label: '#fff3ea' },
  cream: { bg: '#dbe4f3', floor: '#b3c3de', body: '#ffffff', cap: '#8fa7d3', label: '#e8eef9' },
  lip: { bg: '#f5cbd6', floor: '#e29bb0', body: '#c0185a', cap: '#1d1b26', label: '#d1a94f' },
  tote: { bg: '#ebdfcf', floor: '#cdb89c', body: '#7b4a2b', cap: '#5e3820', label: '#d6b16c' },
  tube: { bg: '#cfe7dd', floor: '#9fcab8', body: '#ffffff', cap: '#2c7a63', label: '#e3f3ec' },
  pouch: { bg: '#2f3b8f', floor: '#212a6b', body: '#dfe6ff', cap: '#aebcf2', label: '#8fa3f5' },
  oil: { bg: '#262a36', floor: '#1a1d27', body: '#d9a548', cap: '#121212', label: '#f6e7c4' },
  perfume: { bg: '#e8e2f7', floor: '#c9bde9', body: '#b9a7e8', cap: '#3a2f5e', label: '#f4f0ff' },
};
function PosterShape({ kind, p }) {
  switch (kind) {
    case 'cream':
      return (<g><rect x="21" y="102" width="48" height="26" rx="6" fill={p.body} /><rect x="23" y="92" width="44" height="12" rx="3" fill={p.cap} /><rect x="31" y="110" width="28" height="9" rx="2" fill={p.label} /></g>);
    case 'lip':
      return (<g><rect x="37" y="94" width="16" height="34" rx="2" fill={p.cap} /><rect x="38" y="86" width="14" height="9" fill={p.label} /><path d="M39.5 86 V66 Q39.5 59 46 56 L50.5 60 V86 Z" fill={p.body} /></g>);
    case 'tote':
      return (<g><path d="M33 87 V78 a12 12 0 0 1 24 0 V87" fill="none" stroke={p.cap} strokeWidth="3" /><path d="M20 86 H70 L73 128 H17 Z" fill={p.body} /><rect x="40" y="96" width="10" height="6" rx="1" fill={p.label} /></g>);
    case 'tube':
      return (<g><path d="M32 44 H58 L54 112 H36 Z" fill={p.body} /><rect x="31" y="40" width="28" height="5" rx="1" fill={p.body} /><rect x="36" y="111" width="18" height="17" rx="3" fill={p.cap} /><rect x="38" y="64" width="14" height="26" rx="2" fill={p.label} /></g>);
    case 'pouch':
      return (<g><rect x="27" y="56" width="36" height="72" rx="3" fill={p.body} /><rect x="27" y="56" width="36" height="6" fill={p.cap} /><ellipse cx="37" cy="90" rx="7" ry="4" fill={p.label} /><ellipse cx="53" cy="90" rx="7" ry="4" fill={p.label} /></g>);
    case 'oil':
      return (<g><circle cx="45" cy="108" r="20" fill={p.body} /><rect x="40" y="78" width="10" height="14" fill={p.body} /><rect x="38" y="66" width="14" height="13" rx="2" fill={p.cap} /><rect x="36" y="103" width="18" height="10" rx="2" fill={p.label} /></g>);
    case 'perfume':
      return (<g><rect x="27" y="84" width="36" height="44" rx="5" fill={p.body} /><rect x="40" y="76" width="10" height="9" fill={p.cap} /><rect x="35" y="62" width="20" height="15" rx="3" fill={p.cap} /><rect x="34" y="98" width="22" height="14" rx="2" fill={p.label} /></g>);
    case 'serum':
    default:
      return (<g><rect x="31" y="74" width="28" height="54" rx="7" fill={p.body} /><rect x="38" y="62" width="14" height="14" rx="2" fill={p.cap} /><rect x="40" y="44" width="10" height="20" rx="5" fill={p.cap} /><rect x="35" y="92" width="20" height="20" rx="2" fill={p.label} /><rect x="34" y="78" width="3" height="40" rx="1.5" fill="#ffffff" opacity=".25" /></g>);
  }
}
/* MOCKUP ONLY */
export function PosterArt({ kind = 'serum', frame = 0, title, className }) {
  const p = POSTERS[kind] || POSTERS.serum;
  const dx = [0, -4, 3, -2, 5, -3, 1, 4, -1, 2][frame % 10];
  const s = 1 + (frame % 5) * 0.035;
  return (
    <svg viewBox="0 0 90 160" preserveAspectRatio="xMidYMid slice" className={cx('pr-poster', className)} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : 'true'}>
      <rect width="90" height="160" fill={p.bg} />
      <rect y="122" width="90" height="38" fill={p.floor} opacity=".45" />
      <g transform={`translate(${45 + dx} 126) scale(${s}) translate(-45 -126)`}>
        <ellipse cx="45" cy="128" rx="25" ry="3.5" fill="#000000" opacity=".16" />
        <PosterShape kind={kind} p={p} />
      </g>
    </svg>
  );
}
export const posterKinds = Object.keys(POSTERS);

/* ---------- Demo content (mockups only) ---------- */
/* MOCKUP ONLY: sample data for previews */
export const demo = {
  products: [
    { id: 101, name: 'Glow Serum 30 ml', price: '$24.00', regular: '$32.00', poster: 'serum', rating: 4.6, reviews: 128, sku: 'GS-30' },
    { id: 102, name: 'Velvet Lip Tint, Rose', price: '$14.00', poster: 'lip', rating: 4.8, reviews: 342, sku: 'VLT-RO' },
    { id: 103, name: 'Cloud Cream 50 ml', price: '$28.00', poster: 'cream', rating: 4.5, reviews: 86, sku: 'CC-50' },
    { id: 104, name: 'Everyday Tote, Cognac', price: '$89.00', poster: 'tote', rating: 4.9, reviews: 51, sku: 'ET-CG' },
    { id: 105, name: 'Daily SPF 50 Fluid', price: '$19.00', regular: '$22.00', poster: 'tube', rating: 4.4, reviews: 97, sku: 'SPF-50', outOfStock: true },
    { id: 106, name: 'Hydra Eye Patches, 10 pairs', price: '$12.00', poster: 'pouch', rating: 4.7, reviews: 210, sku: 'HEP-10' },
    { id: 107, name: 'Night Repair Oil', price: '$36.00', poster: 'oil', rating: 4.8, reviews: 64, sku: 'NRO-15' },
    { id: 108, name: 'Lilac Eau de Parfum', price: '$58.00', poster: 'perfume', rating: 4.3, reviews: 19, sku: 'LEP-50' },
  ],
  reels: [
    { id: 1, title: 'Glow serum in 20 seconds', poster: 'serum', views: 4210, clicks: 388, source: 'upload', product: 101, products: 1, buttons: 0, widgets: 3 },
    { id: 2, title: 'Velvet lip tint swatches', poster: 'lip', views: 3125, clicks: 301, source: 'upload', product: 102, products: 1, buttons: 1, widgets: 3 },
    { id: 3, title: 'Cloud cream texture', poster: 'cream', views: 1980, clicks: 122, source: 'youtube', product: 103, products: 1, buttons: 0, widgets: 2 },
    { id: 4, title: 'What fits in the tote', poster: 'tote', views: 1544, clicks: 97, source: 'vimeo', product: 104, products: 2, buttons: 0, widgets: 3 },
    { id: 5, title: 'Morning SPF routine', poster: 'tube', views: 902, clicks: 64, source: 'upload', product: 105, products: 1, buttons: 0, widgets: 2 },
    { id: 6, title: 'Ten-minute eye patches', poster: 'pouch', views: 455, clicks: 41, source: 'youtube', product: 106, products: 1, buttons: 0, widgets: 1 },
    { id: 7, title: 'Night oil, three drops', poster: 'oil', views: 188, clicks: 12, source: 'url', product: 107, products: 1, buttons: 0, widgets: 0 },
    { id: 8, title: 'Lilac, first spray', poster: 'perfume', views: 76, clicks: 6, source: 'upload', product: null, products: 0, buttons: 1, widgets: 1 },
  ],
  widgets: [
    { id: 12, name: 'Homepage stories', layout: 'carousel', shape: 'circle', reels: [1, 2, 3, 4, 5, 6], views: 6420, clicks: 512, created: 'Sep 14, 2026' },
    { id: 9, name: 'Product page reels', layout: 'carousel', shape: 'rect', reels: [1, 2, 3, 4, 5], views: 4980, clicks: 431, created: 'Aug 30, 2026' },
    { id: 7, name: 'Shop the look', layout: 'grid', shape: 'rect', reels: [2, 3, 1, 4, 5, 8], views: 812, clicks: 74, created: 'Aug 2, 2026' },
    { id: 4, name: 'Tote launch popup', layout: 'popup', shape: 'rect', reels: [4], views: 268, clicks: 15, created: 'Jul 19, 2026' },
  ],
  buttons: [
    { text: 'Shop the serum', campaign: 'October glow', url: '/product/glow-serum', clicks: 214 },
    { text: 'See all lip tints', campaign: 'Lip launch', url: '/collections/lips', clicks: 133 },
    { text: 'Get 15% off', campaign: 'Newsletter', url: '/offer/autumn15', clicks: 58 },
  ],
};
const productById = (id) => demo.products.find((p) => p.id === id);
const reelById = (id) => demo.reels.find((r) => r.id === id);

/* ---------- Buttons & badges ---------- */
export function Button({ variant = 'secondary', size = 'md', icon, iconRight, block, children, className, type = 'button', ...rest }) {
  const is = size === 'sm' ? 16 : 18;
  return (
    <button type={type} className={cx('pr-btn', 'pr-btn--' + variant, size !== 'md' && 'pr-btn--' + size, block && 'pr-btn--block', 'pr-t-body-strong', className)} {...rest}>
      {icon && <Icon name={icon} size={is} />}
      {children != null && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={is} />}
    </button>
  );
}

export function IconButton({ icon, label, size = 'sm', variant, iconSize, className, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx('pr-iconbtn', size === 'md' && 'pr-iconbtn--md', variant && 'pr-iconbtn--' + variant, className)} {...rest}>
      <Icon name={icon} size={iconSize || (size === 'md' ? 20 : 18)} />
    </button>
  );
}

export function Badge({ tone = 'neutral', icon, dot, children, className }) {
  return (
    <span className={cx('pr-badge', tone !== 'neutral' && 'pr-badge--' + tone, 'pr-t-caption', className)}>
      {dot && <span className="pr-badge__dot" />}
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

export const LAYOUTS = {
  grid: { label: 'Grid', icon: 'grid', desc: 'Rows of reels that wrap' },
  carousel: { label: 'Carousel', icon: 'carousel', desc: 'One row people swipe through' },
  marquee: { label: 'Marquee', icon: 'marquee', desc: 'A row that scrolls by itself' },
  stacked: { label: 'Stacked', icon: 'stacked', desc: 'A fanned deck of cards' },
  popup: { label: 'Popup', icon: 'popup', desc: 'Floats in a corner of the page' },
};
export function LayoutBadge({ layout = 'grid' }) {
  const l = LAYOUTS[layout] || LAYOUTS.grid;
  return <Badge icon={l.icon}>{l.label}</Badge>;
}

export function Count({ children }) {
  return <span className="pr-count pr-t-caption">{children}</span>;
}

export function FilterChips({ items = [], value, onChange }) {
  const [v, setV] = useState(value ?? (items[0] && items[0].id));
  return (
    <div className="pr-rowh" role="group" aria-label="Filter">
      {items.map((it) => (
        <button key={it.id} type="button" className="pr-chip pr-t-label" aria-pressed={v === it.id} onClick={() => { setV(it.id); onChange && onChange(it.id); }}>
          {it.label}
          {it.count != null && <span className="pr-chip__n">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- App shell ---------- */
export function AppHeader({ current = 'widgets', version = '1.0.0' }) {
  const items = [
    { id: 'widgets', label: 'Widgets', icon: 'grid' },
    { id: 'reels', label: 'Reels', icon: 'film' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  return (
    <header className="pr-appbar">
      <div className="pr-appbar__brand">
        <span className="pr-wordmark pr-t-display-sm">ProductReels</span>
        <span className="pr-version pr-t-caption">v{version}</span>
      </div>
      <nav className="pr-nav" aria-label="ProductReels">
        {items.map((it) => (
          <a key={it.id} href="#" className="pr-navpill pr-t-body-strong" aria-current={current === it.id ? 'page' : undefined}>
            <Icon name={it.icon} size={16} />
            {it.label}
          </a>
        ))}
      </nav>
      <div className="pr-appbar__end">
        <a className="pr-docs pr-t-label" href="#">Documentation <Icon name="external" size={14} /></a>
      </div>
    </header>
  );
}

export function PageHeader({ title, count, description, back, actions }) {
  return (
    <div className="pr-pagehead">
      <div className="pr-pagehead__lead">
        {back && <IconButton icon="arrow-left" label={back} size="md" variant="outline" className="pr-pagehead__back" />}
        <div>
          <h1 className="pr-pagehead__title pr-t-display">
            {title}
            {count != null && <Count>{count}</Count>}
          </h1>
          {description && <p className="pr-pagehead__desc pr-t-body">{description}</p>}
        </div>
      </div>
      {actions && <div className="pr-pagehead__actions">{actions}</div>}
    </div>
  );
}

/* ---------- Form controls ---------- */
export function Field({ label, help, error, htmlFor, aside, children }) {
  return (
    <div className="pr-field">
      {label && (
        <label className="pr-field__label pr-t-label" htmlFor={htmlFor}>
          <span>{label}</span>
          {aside}
        </label>
      )}
      {children}
      {error ? (
        <p className="pr-field__error pr-t-small"><Icon name="alert" size={15} />{error}</p>
      ) : help ? (
        <p className="pr-field__help pr-t-small">{help}</p>
      ) : null}
    </div>
  );
}

let _uid = 0;
const useId = () => { const [id] = useState(() => 'pr' + ++_uid); return id; };

export function TextField({ label, help, error, icon, suffix, multiline, aside, ...rest }) {
  const id = useId();
  const input = multiline ? (
    <textarea id={id} className="pr-input pr-t-body" aria-invalid={error ? 'true' : undefined} {...rest} />
  ) : (
    <input id={id} className="pr-input pr-t-body" aria-invalid={error ? 'true' : undefined} {...rest} />
  );
  return (
    <Field label={label} help={help} error={error} htmlFor={id} aside={aside}>
      {icon || suffix ? (
        <div className={cx('pr-inputwrap', icon && 'pr-inputwrap--icon', suffix && 'pr-inputwrap--suffix')}>
          {icon && <Icon name={icon} size={18} className="pr-inputwrap__icon" />}
          {input}
          {suffix && <span className="pr-inputwrap__suffix pr-t-small">{suffix}</span>}
        </div>
      ) : input}
    </Field>
  );
}

export function SearchField({ placeholder = 'Search', width, ...rest }) {
  return (
    <div className="pr-inputwrap pr-inputwrap--icon" style={{ width }}>
      <Icon name="search" size={18} className="pr-inputwrap__icon" />
      <input type="search" className="pr-input pr-t-body" placeholder={placeholder} aria-label={placeholder} {...rest} />
    </div>
  );
}

export function Checkbox({ label, checked, defaultChecked, onChange, className }) {
  const [c, setC] = useState(defaultChecked ?? !!checked);
  const box = <input type="checkbox" className={cx('pr-check', !label && className)} checked={checked ?? c} onChange={(e) => { setC(e.target.checked); onChange && onChange(e.target.checked); }} aria-label={label ? undefined : 'Select'} />;
  if (!label) return box;
  return <label className={cx('pr-checkline pr-t-body', className)}>{box}{label}</label>;
}

export function Switch({ checked, defaultChecked, onChange, label, tone, disabled }) {
  const [on, setOn] = useState(defaultChecked ?? !!checked);
  const v = checked ?? on;
  return (
    <button type="button" role="switch" aria-checked={v} aria-label={label} disabled={disabled} className={cx('pr-switch', tone === 'danger' && 'pr-switch--danger')} onClick={() => { setOn(!v); onChange && onChange(!v); }} />
  );
}

export function Toggle({ label, description, defaultChecked, checked, tone, onChange }) {
  return (
    <div className="pr-toggle">
      <div className="pr-toggle__text">
        <span className="pr-t-label">{label}</span>
        {description && <span className="pr-toggle__desc pr-t-small">{description}</span>}
      </div>
      <Switch label={label} defaultChecked={defaultChecked} checked={checked} tone={tone} onChange={onChange} />
    </div>
  );
}

export function Segmented({ options = [], value, defaultValue, onChange, block, variant, iconOnly, label }) {
  const first = options[0] && (options[0].value ?? options[0].id);
  const [v, setV] = useState(defaultValue ?? value ?? first);
  const cur = value ?? v;
  return (
    <div role="radiogroup" aria-label={label} className={cx('pr-seg', block && 'pr-seg--block', variant === 'studio' && 'pr-seg--studio', iconOnly && 'pr-seg--icons')}>
      {options.map((o) => {
        const val = o.value ?? o.id;
        return (
          <button key={val} type="button" role="radio" aria-checked={cur === val} aria-label={iconOnly ? o.label : undefined} title={iconOnly ? o.label : undefined} className="pr-seg__item pr-t-label" onClick={() => { setV(val); onChange && onChange(val); }}>
            {o.icon && <Icon name={o.icon} size={16} />}
            {!iconOnly && o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ColorField({ label, value = '#141629', alpha, help }) {
  return (
    <Field label={label} help={help}>
      <div className="pr-color">
        <span className="pr-color__swatch"><span style={{ background: value, opacity: alpha != null ? alpha / 100 : 1 }} /></span>
        <span className="pr-color__hex pr-t-code">{value.replace('#', '')}</span>
        {alpha != null && <span className="pr-color__alpha pr-t-small">{alpha}%</span>}
      </div>
    </Field>
  );
}

export function RangeField({ label, value = 50, min = 0, max = 100, unit = 'px', help }) {
  const [v, setV] = useState(value);
  const fill = ((v - min) / (max - min)) * 100 + '%';
  return (
    <div className="pr-range">
      <div className="pr-range__head">
        <span className="pr-t-label">{label}</span>
        <span className="pr-range__value pr-t-caption">{v}{unit && <span className="pr-muted">{unit}</span>}</span>
      </div>
      <input type="range" className="pr-slider" min={min} max={max} value={v} aria-label={label} style={{ '--pr-fill': fill }} onChange={(e) => setV(+e.target.value)} />
      {help && <p className="pr-field__help pr-t-small">{help}</p>}
    </div>
  );
}

export function SettingRow({ title, description, children, below }) {
  return (
    <div className={cx('pr-setting', below && 'pr-setting--below')}>
      <div className="pr-setting__text">
        <h4 className="pr-t-heading">{title}</h4>
        {description && <p className="pr-t-small">{description}</p>}
      </div>
      {children && <div className="pr-setting__control">{children}</div>}
    </div>
  );
}

export function SettingsCard({ title, description, tone, children, id }) {
  return (
    <section className={cx('pr-settings', tone === 'danger' && 'pr-settings--danger')} id={id}>
      <div className="pr-settings__head">
        <h3 className="pr-t-title">{title}</h3>
        {description && <p className="pr-t-body">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/* ---------- Layout template picker ---------- */
function MiniDiagram({ layout }) {
  const m = (style, cls) => <span className={cx('pr-mini', cls)} style={style} />;
  switch (layout) {
    case 'grid':
      return (<>{[0, 1, 2].map((i) => m({ left: 12 + i * 18, top: 6, width: 14, height: 20 }, null))}{[0, 1, 2].map((i) => m({ left: 12 + i * 18, top: 29, width: 14, height: 20 }, 'pr-mini--ghost'))}</>);
    case 'carousel':
      return (<>{m({ left: -6, top: 10, width: 16, height: 30 }, 'pr-mini--ghost')}{[0, 1, 2].map((i) => m({ left: 15 + i * 18, top: 10, width: 16, height: 30 }, null))}{m({ left: 69, top: 10, width: 16, height: 30 }, 'pr-mini--ghost')}{m({ left: 31, top: 45, width: 14, height: 3 }, 'pr-mini--round')}</>);
    case 'marquee':
      return (<>{[0, 1, 2, 3, 4].map((i) => m({ left: -4 + i * 17, top: 10, width: 14, height: 26 }, i === 0 || i === 4 ? 'pr-mini--ghost' : null))}{m({ left: 18, top: 42, width: 40, height: 3 }, 'pr-mini--ghost pr-mini--round')}</>);
    case 'stacked':
      return (<>{m({ left: 20, top: 12, width: 18, height: 32, transform: 'rotate(-12deg)' }, 'pr-mini--ghost')}{m({ left: 38, top: 12, width: 18, height: 32, transform: 'rotate(12deg)' }, 'pr-mini--ghost')}{m({ left: 29, top: 8, width: 19, height: 34 }, null)}</>);
    case 'popup':
      return (<>{m({ left: 8, top: 6, width: 60, height: 42, borderRadius: 4 }, 'pr-mini--page')}{m({ left: 14, top: 12, width: 30, height: 3 }, 'pr-mini--ghost pr-mini--round')}{m({ left: 14, top: 19, width: 22, height: 3 }, 'pr-mini--ghost pr-mini--round')}{m({ left: 50, top: 22, width: 13, height: 22 }, null)}</>);
    default:
      return null;
  }
}
export function TemplatePicker({ value = 'carousel', layouts = ['grid', 'carousel', 'marquee', 'stacked', 'popup'], variant = 'list', columns }) {
  const [v, setV] = useState(value);
  const cols = columns || (variant === 'tile' ? 5 : 1);
  return (
    <div className="pr-templates" role="radiogroup" aria-label="Layout" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {layouts.map((id) => {
        const l = LAYOUTS[id];
        const on = v === id;
        return (
          <button key={id} type="button" role="radio" aria-checked={on} className={cx('pr-template', variant === 'tile' && 'pr-template--tile')} onClick={() => setV(id)}>
            <span className="pr-template__art" aria-hidden="true">
              <span style={{ position: 'absolute', inset: 0, transform: variant === 'tile' ? 'scale(1.7)' : undefined, transformOrigin: 'center', left: variant === 'tile' ? 'calc(50% - 38px)' : 0, top: variant === 'tile' ? 'calc(50% - 27px)' : 0, width: 76, height: 54 }}>
                <MiniDiagram layout={id} />
              </span>
            </span>
            <span className="pr-template__text">
              <span className="pr-t-heading">{l.label}</span>
              <span className="pr-template__desc pr-t-small">{l.desc}</span>
            </span>
            {on && <span className="pr-template__tick"><Icon name="check" size={13} strokeWidth={2.5} /></span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Metrics, tables ---------- */
export function MetricBand({ items = [] }) {
  return (
    <div className="pr-metrics" role="list">
      {items.map((it) => (
        <div className="pr-metric" role="listitem" key={it.label}>
          <span className="pr-metric__label pr-t-label">{it.icon && <Icon name={it.icon} size={16} />}{it.label}</span>
          <span className="pr-metric__value pr-t-metric">{it.value}</span>
          {it.hint && <span className="pr-metric__hint pr-t-small">{it.hint}</span>}
        </div>
      ))}
    </div>
  );
}

export function ShortcodeChip({ code, copied: copiedProp }) {
  const [copied, setCopied] = useState(!!copiedProp);
  return (
    <button type="button" className="pr-shortcode pr-t-code" data-copied={copied} onClick={() => setCopied(true)} aria-label={copied ? 'Copied ' + code : 'Copy ' + code} title={copied ? 'Copied' : 'Copy shortcode'}>
      {code}
      <span className="pr-shortcode__icon"><Icon name={copied ? 'check' : 'copy'} size={15} /></span>
    </button>
  );
}

export function ReelStack({ posters = [], round, max = 3 }) {
  return (
    <span className={cx('pr-stack', round && 'pr-stack--round')} aria-hidden="true">
      {posters.slice(0, max).map((k, i) => (
        <span className="pr-stack__item" key={i} style={{ zIndex: max - i }}><PosterArt kind={k} /></span>
      ))}
    </span>
  );
}

export function BarCell({ value, max, label }) {
  const pct = max ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <span className="pr-bar">
      <span className="pr-bar__track" aria-hidden="true"><span className="pr-bar__fill" style={{ width: pct + '%' }} /></span>
      <span className="pr-bar__value pr-t-body">{label ?? fmt(value)}</span>
    </span>
  );
}

export function Menu({ items = [] }) {
  return (
    <div className="pr-menu" role="menu">
      {items.map((it, i) =>
        it === '-' ? (
          <div className="pr-menu__sep" role="separator" key={i} />
        ) : (
          <button key={i} type="button" role="menuitem" className={cx('pr-menu__item pr-t-body', it.danger && 'pr-menu__item--danger')}>
            {it.icon && <Icon name={it.icon} size={17} />}
            {it.label}
            {it.hint && <span className="pr-menu__hint pr-t-caption">{it.hint}</span>}
          </button>
        )
      )}
    </div>
  );
}

export function WidgetTable({ widgets = demo.widgets, menuOpenFor }) {
  return (
    <div className="pr-tablewrap" style={{ overflow: 'visible' }}>
      <table className="pr-table">
        <thead>
          <tr className="pr-t-label">
            <th>Widget</th>
            <th className="num">Reels</th>
            <th>Shortcode</th>
            <th className="num">Views</th>
            <th className="num">Clicks</th>
            <th className="num">Click rate</th>
            <th><button type="button" className="pr-sort pr-t-label">Created <Icon name="chevron-down" size={14} /></button></th>
            <th><span className="pr-sr">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {widgets.map((w) => (
            <tr key={w.id}>
              <td>
                <div className="pr-wname">
                  <ReelStack posters={w.reels.map((id) => reelById(id).poster)} round={w.shape === 'circle'} />
                  <div className="pr-wname__text">
                    <a href="#" className="pr-wname__title pr-t-body-strong">{w.name}</a>
                    <span className="pr-wname__meta"><LayoutBadge layout={w.layout} /><span className="pr-t-caption">#{w.id}</span></span>
                  </div>
                </div>
              </td>
              <td className="num pr-t-body">{w.reels.length}</td>
              <td><ShortcodeChip code={`[productreels id="${w.id}"]`} /></td>
              <td className="num pr-t-body">{fmt(w.views)}</td>
              <td className="num pr-t-body">{fmt(w.clicks)}</td>
              <td className="num pr-t-body">{rate(w.clicks, w.views)}</td>
              <td className="muted pr-t-body">{w.created}</td>
              <td style={{ position: 'relative' }}>
                <div className="pr-rowactions">
                  <Button size="sm" icon="pencil">Edit</Button>
                  <IconButton icon="more" label={`More actions for ${w.name}`} />
                </div>
                {menuOpenFor === w.id && (
                  <div style={{ position: 'absolute', right: 20, top: 50, zIndex: 5 }}>
                    <Menu items={[{ icon: 'chart', label: 'Statistics' }, { icon: 'duplicate', label: 'Duplicate' }, { icon: 'copy', label: 'Copy shortcode' }, '-', { icon: 'trash', label: 'Delete widget', danger: true }]} />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Empty states & onboarding ---------- */
export function EmptyState({ title, description, actions, icon = 'play', panel }) {
  return (
    <div className={cx('pr-empty', panel && 'pr-empty--panel')}>
      <div className="pr-empty__art" aria-hidden="true">
        <span /><span><Icon name={icon} size={20} /></span><span />
      </div>
      <h3 className="pr-t-title">{title}</h3>
      {description && <p className="pr-empty__desc pr-t-body">{description}</p>}
      {actions && <div className="pr-empty__actions">{actions}</div>}
    </div>
  );
}

function StepArt({ n }) {
  if (n === 1)
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{ width: 64, height: 114, borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--pr-shadow-reel)', position: 'relative' }}>
          <PosterArt kind="serum" />
          <div className="prs-card" style={{ position: 'absolute', left: 4, right: 4, bottom: 4, padding: 3, gap: 4, borderRadius: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, overflow: 'hidden', display: 'block', flex: 'none' }}><PosterArt kind="serum" /></span>
            <span style={{ height: 4, flex: 1, borderRadius: 4, background: 'var(--pr-line)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="pr-badge pr-badge--brand pr-t-caption"><Icon name="upload" size={14} />Upload</span>
          <span className="pr-badge pr-t-caption"><Icon name="youtube" size={14} />Shorts</span>
          <span className="pr-badge pr-t-caption"><Icon name="tag" size={14} />Tag products</span>
        </div>
      </div>
    );
  if (n === 2)
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {['lip', 'cream', 'tote', 'tube'].map((k, i) => (
          <div key={k} style={{ width: 52, height: 92, borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--pr-shadow-reel)', opacity: i === 3 ? 0.45 : 1 }}><PosterArt kind={k} /></div>
        ))}
        <span className="prs-arrow" style={{ position: 'absolute', right: 14, top: 'calc(50% - 16px)', width: 32, height: 32 }}><Icon name="chevron-right" size={16} /></span>
      </div>
    );
  return (
    <div style={{ position: 'absolute', inset: '16px 20px 0', background: 'var(--pr-surface)', borderRadius: '10px 10px 0 0', boxShadow: '0 0 0 1px var(--pr-line)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ height: 6, width: '45%', borderRadius: 6, background: 'var(--pr-line)' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {['serum', 'lip', 'cream', 'tote', 'pouch'].map((k) => (
          <div key={k} style={{ width: 30, height: 30, borderRadius: 99, overflow: 'hidden', boxShadow: '0 0 0 1.5px var(--pr-surface), 0 0 0 2.5px var(--pr-ink)' }}><PosterArt kind={k} /></div>
        ))}
      </div>
      <span className="pr-shortcode pr-t-code" style={{ alignSelf: 'flex-start', marginTop: 6 }}>[productreels id="1"]<span className="pr-shortcode__icon"><Icon name="copy" size={14} /></span></span>
    </div>
  );
}
export function StepGuide({ done = 0, title = 'Set up your first widget', description = 'A widget is a styled set of reels you place on a page. Most stores are live in three steps.' }) {
  const steps = [
    { t: 'Add a reel', d: 'Upload a vertical video or paste a YouTube Shorts, Vimeo or video link. Tag the products it sells.', cta: 'Add reel', icon: 'plus' },
    { t: 'Create a widget', d: 'Pick reels, choose a layout and style it while you watch the live preview.', cta: 'Create widget', icon: 'grid' },
    { t: 'Place it on a page', d: 'Paste the shortcode, or add the ProductReels block in the editor or Elementor.', cta: 'Copy shortcode', icon: 'copy' },
  ];
  return (
    <section className="pr-guide">
      <div className="pr-guide__head">
        <h2 className="pr-t-display-xl">{title}</h2>
        <p className="pr-t-body">{description}</p>
      </div>
      <ol className="pr-guide__steps" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {steps.map((s, i) => {
          const state = i < done ? 'done' : i === done ? 'current' : 'upcoming';
          return (
            <li key={i} className={cx('pr-step', 'pr-step--' + state)}>
              <div className="pr-step__art"><StepArt n={i + 1} /></div>
              <div className="pr-step__top">
                <span className="pr-step__num pr-t-label">{state === 'done' ? <Icon name="check" size={15} strokeWidth={2.5} /> : i + 1}</span>
                <h3 className="pr-t-title">{s.t}</h3>
              </div>
              <p className="pr-step__desc pr-t-body">{s.d}</p>
              <div className="pr-step__foot">
                {state === 'done' ? (
                  <span className="pr-step__state pr-t-label"><Icon name="success" size={16} />Done</span>
                ) : (
                  <Button variant={state === 'current' ? 'primary' : 'secondary'} icon={s.icon} disabled={state === 'upcoming'}>{s.cta}</Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------- Reel library ---------- */
const SOURCE = { upload: { icon: 'upload', label: 'Uploaded' }, youtube: { icon: 'youtube', label: 'YouTube Shorts' }, vimeo: { icon: 'video', label: 'Vimeo' }, url: { icon: 'link', label: 'Video link' } };
export function ReelCard({ reel = demo.reels[0], selected }) {
  const [sel, setSel] = useState(!!selected);
  const src = SOURCE[reel.source] || SOURCE.upload;
  return (
    <article className="pr-reelcard" data-selected={sel}>
      <div className="pr-reelcard__media">
        <PosterArt kind={reel.poster} />
        <span className="pr-reelcard__check"><Checkbox checked={sel} onChange={setSel} /></span>
        {reel.source !== 'upload' && <span className="pr-reelcard__source pr-pill-over pr-t-caption" title={src.label}><Icon name={src.icon} size={13} /><span className="pr-sr">{src.label}</span></span>}
        <span className="pr-reelcard__views pr-pill-over pr-t-caption"><Icon name="eye" size={13} />{fmt(reel.views)}</span>
        <button type="button" className="pr-reelcard__play" aria-label={`Preview ${reel.title}`}><Icon name="play" size={20} fill="currentColor" /></button>
      </div>
      <div className="pr-reelcard__row">
        <button type="button" className="pr-reelcard__open pr-reelcard__text" aria-label={`Edit ${reel.title}`}>
          <span className="pr-reelcard__title pr-t-body-strong">{reel.title}</span>
          <div className="pr-reelcard__meta pr-t-small">
            {reel.products > 0 && <span><Icon name="tag" size={13} />{reel.products} {reel.products === 1 ? 'product' : 'products'}</span>}
            {reel.buttons > 0 && <span><Icon name="link" size={13} />{reel.buttons} button</span>}
            <span>{reel.widgets === 0 ? 'Not in a widget' : `In ${reel.widgets} ${reel.widgets === 1 ? 'widget' : 'widgets'}`}</span>
          </div>
        </button>
        <div className="pr-reelcard__actions">
          <IconButton icon="more" label={`More actions for ${reel.title}`} />
        </div>
      </div>
    </article>
  );
}

export function FloatingBar({ text, dot, children }) {
  return (
    <div className="pr-floatbar" role="status">
      <span className="pr-floatbar__text pr-t-body-strong">{dot && <span className="pr-floatbar__dot" />}{text}</span>
      {children}
    </div>
  );
}

/* ---------- Widget editor pieces ---------- */
export function ReelRow({ reel = demo.reels[0], dragging, index }) {
  const p = reel.product ? productById(reel.product) : null;
  return (
    <div className="pr-reelrow" data-dragging={dragging ? 'true' : undefined}>
      <span className="pr-reelrow__grip" aria-label={`Reorder ${reel.title}`} role="button" tabIndex={0}><Icon name="grip" size={16} /></span>
      <span className="pr-reelrow__thumb"><PosterArt kind={reel.poster} /></span>
      <div className="pr-reelrow__text">
        <span className="pr-reelrow__title pr-t-body-strong">{reel.title}</span>
        <span className="pr-reelrow__meta pr-t-small">{p ? (<><Icon name="tag" size={13} />{p.name}</>) : reel.buttons ? (<><Icon name="link" size={13} />Custom button</>) : 'No links'}</span>
      </div>
      <IconButton icon="play" label={`Preview ${reel.title}`} />
      <IconButton icon="x" label={`Remove ${reel.title} from this widget`} />
    </div>
  );
}

export function ReelPicker({ reels = demo.reels, added = [] }) {
  return (
    <div className="pr-pickgrid">
      {reels.map((r) => {
        const on = added.includes(r.id);
        return (
          <button key={r.id} type="button" className="pr-pick" aria-pressed={on} aria-label={(on ? 'Remove ' : 'Add ') + r.title}>
            <span className="pr-pick__media"><PosterArt kind={r.poster} /><span className="pr-pick__add"><Icon name={on ? 'check' : 'plus'} size={16} strokeWidth={2.25} /></span></span>
            <span className="pr-pick__title pr-t-caption">{r.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export const STUDIO_STEPS = [
  { id: 'reels', label: 'Reels', icon: 'film' },
  { id: 'layout', label: 'Layout', icon: 'grid' },
  { id: 'thumbnails', label: 'Look', icon: 'palette' },
  { id: 'player', label: 'Player', icon: 'play' },
  { id: 'card', label: 'Product card', icon: 'tag' },
  { id: 'advanced', label: 'Advanced', icon: 'sliders' },
];
export function StudioRail({ current = 'layout', reels = 5 }) {
  return (
    <nav className="pr-rail" aria-label="Widget settings">
      {STUDIO_STEPS.map((s) => (
        <button key={s.id} type="button" className="pr-rail__item pr-t-caption" aria-current={current === s.id ? 'step' : undefined}>
          <Icon name={s.icon} size={20} />
          {s.label}
          {s.id === 'reels' && reels > 0 && <span className="pr-rail__n pr-t-caption">{reels}</span>}
        </button>
      ))}
      <div className="pr-rail__sep" />
      <button type="button" className="pr-rail__item pr-t-caption" aria-current={current === 'place' ? 'step' : undefined}>
        <Icon name="code" size={20} />
        Place it
      </button>
    </nav>
  );
}

export function StudioPanel({ title, description, children }) {
  return (
    <aside className="pr-panel">
      <div className="pr-panel__head">
        <h2 className="pr-t-title">{title}</h2>
        {description && <p className="pr-t-small">{description}</p>}
      </div>
      <div className="pr-panel__body">{children}</div>
    </aside>
  );
}
export function PanelSection({ title, aside, children }) {
  return (
    <section className="pr-panel__section">
      {(title || aside) && (
        <div className="pr-panel__sechead">
          {title && <h3 className="pr-t-heading">{title}</h3>}
          {aside && <span className="pr-t-small">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function DeviceSwitch({ value = 'desktop' }) {
  return <Segmented variant="studio" iconOnly label="Preview device" defaultValue={value} options={[{ value: 'desktop', label: 'Desktop', icon: 'monitor' }, { value: 'tablet', label: 'Tablet', icon: 'tablet' }, { value: 'mobile', label: 'Mobile', icon: 'smartphone' }]} />;
}

export function DeviceFrame({ device = 'desktop', url = 'yourstore.com/shop', children, context = true }) {
  return (
    <div className={cx('pr-device', 'pr-device--' + device)}>
      <div className="pr-device__screen">
        {device === 'mobile' ? <div className="pr-device__notch" /> : (
          <div className="pr-device__chrome"><span className="pr-device__dots"><span /><span /><span /></span><span className="pr-device__url pr-t-caption">{url}</span><span style={{ width: 34 }} /></div>
        )}
        <div className="pr-device__page">
          {context && <div className="pr-skel pr-skel--title"><span /></div>}
          {children}
          {context && <div className="pr-skel"><span style={{ width: '92%' }} /><span style={{ width: '78%' }} /><span style={{ width: '64%' }} /></div>}
        </div>
      </div>
    </div>
  );
}

export function Stage({ device = 'desktop', children, note = 'Live preview' }) {
  return (
    <section className="pr-stage" aria-label="Preview">
      <div className="pr-stage__bar">
        <span className="pr-stage__cap pr-t-label"><span className="pr-stage__live" />{note}</span>
        <DeviceSwitch value={device} />
        <span className="pr-stage__cap pr-t-label">{{ desktop: 'Desktop, 1280 px', tablet: 'Tablet, 768 px', mobile: 'Mobile, 390 px' }[device]}</span>
      </div>
      <div className="pr-stage__canvas">{children}</div>
    </section>
  );
}

export function StudioHeader({ name = 'Homepage stories', dirty = true, id }) {
  return (
    <header className="pr-studio__head">
      <IconButton icon="arrow-left" label="Back to widgets" size="md" />
      <span className="pr-studio__crumb pr-t-label">Widgets<Icon name="chevron-right" size={14} /></span>
      <button type="button" className="pr-studio__name pr-t-display-sm" style={{ border: 0, background: 'none', cursor: 'text' }} aria-label="Rename widget">{name}<Icon name="pencil" size={15} /></button>
      {dirty && <Badge tone="spark" dot>Unsaved changes</Badge>}
      <div className="pr-studio__end">
        {id && <ShortcodeChip code={`[productreels id="${id}"]`} />}
        <span className="pr-studio__divider" />
        <IconButton icon="undo" label="Discard changes" size="md" />
        <IconButton icon="more" label="More: duplicate or delete" size="md" />
        <Button variant="primary" size="lg" icon="check">Save widget</Button>
      </div>
    </header>
  );
}

export function StudioShell({ header, rail, panel, stage, style }) {
  return (
    <div className="pr-studio" style={style}>
      {header}
      {rail}
      {panel}
      {stage}
    </div>
  );
}

/* ---------- Reel editor pieces ---------- */
export function SourcePicker({ value = 'upload', state = 'empty' }) {
  const [v, setV] = useState(value);
  return (
    <div className="pr-stackv" style={{ gap: 12 }}>
      <Segmented block label="Video source" value={v} onChange={setV} options={[{ value: 'upload', label: 'Upload', icon: 'upload' }, { value: 'youtube', label: 'YouTube Shorts', icon: 'youtube' }, { value: 'vimeo', label: 'Vimeo', icon: 'video' }, { value: 'url', label: 'Video link', icon: 'link' }]} />
      {v === 'upload' ? (
        <div className="pr-drop" data-over={state === 'over' ? 'true' : undefined}>
          <span className="pr-drop__art"><Icon name="upload" size={20} /></span>
          <span className="pr-t-heading">Drop vertical videos here</span>
          <span className="pr-drop__hint pr-t-small">MP4 or WebM. Add several at once and each one becomes its own clip.</span>
          <span className="pr-rowh" style={{ marginTop: 8, justifyContent: 'center' }}>
            <Button size="sm" icon="image">Choose from Media Library</Button>
          </span>
        </div>
      ) : (
        <TextField multiline label={v === 'youtube' ? 'YouTube Shorts links' : v === 'vimeo' ? 'Vimeo links' : 'Video links'} placeholder={v === 'youtube' ? 'https://youtube.com/shorts/…' : v === 'vimeo' ? 'https://vimeo.com/…' : 'https://yourstore.com/videos/clip.mp4'} help={v === 'url' ? 'One link per line. MP4 plays everywhere; WebM does not play on older iPhones.' : 'One link per line to add several at once.'} error={state === 'error' ? 'Line 2 is not a YouTube Shorts link. Links look like youtube.com/shorts/abc123.' : undefined} defaultValue={state === 'error' ? 'https://youtube.com/shorts/x8f2LqP\nhttps://youtube.com/watch?v=9dk' : undefined} />
      )}
    </div>
  );
}

export function VideoList({ items }) {
  const list = items || [
    { name: 'glow-serum-vertical.mp4', poster: 'serum', meta: 'Uploaded, 8.4 MB', progress: null },
    { name: 'serum-closeup.mp4', poster: 'serum', frame: 3, meta: 'Uploading, 62%', progress: 62 },
  ];
  return (
    <div className="pr-videos">
      {list.map((v, i) => (
        <div className="pr-video" key={i}>
          <span className="pr-video__thumb"><PosterArt kind={v.poster} frame={v.frame || 0} /></span>
          <div className="pr-video__text">
            <span className="pr-video__name pr-t-body-strong">{v.name}</span>
            {v.progress != null ? (<><span className="pr-progress" role="progressbar" aria-label={`Uploading ${v.name}`} aria-valuenow={v.progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: v.progress + '%' }} /></span><span className="pr-video__meta pr-t-small">{v.meta}</span></>) : <span className="pr-video__meta pr-t-small"><Icon name="success" size={14} />{v.meta}</span>}
          </div>
          <div className="pr-video__actions">
            <IconButton icon="arrow-up" label="Move up" disabled={i === 0} />
            <IconButton icon="arrow-down" label="Move down" disabled={i === list.length - 1} />
            <IconButton icon="trash" label="Remove video" variant="danger" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Filmstrip({ kind = 'serum', position = 0.35, time = '0:04', crossDomain }) {
  if (crossDomain)
    return (
      <Notice tone="warn" title="Frames can't be captured from this video">
        It's hosted on another site that doesn't allow it. Upload a cover image instead, or the first frame is used.
      </Notice>
    );
  const active = Math.min(9, Math.floor(position * 10));
  return (
    <div className="pr-film">
      <div className="pr-film__strip" role="slider" aria-label="Cover frame" aria-valuetext={time} tabIndex={0}>
        {Array.from({ length: 10 }).map((_, i) => (
          <span className="pr-film__frame" key={i} data-active={i === active}><PosterArt kind={kind} frame={i} /></span>
        ))}
        <span className="pr-film__head" style={{ insetInlineStart: `calc(4px + (100% - 8px) * ${position})` }}>
          <span className="pr-film__time pr-t-caption">{time}</span>
        </span>
      </div>
      <div className="pr-film__row">
        <span className="pr-film__cover"><PosterArt kind={kind} frame={active} /></span>
        <div className="pr-film__actions">
          <span className="pr-t-label">Cover at {time}</span>
          <span className="pr-t-small pr-muted">Drag along the strip to pick the frame shoppers see before they press play.</span>
          <div className="pr-rowh" style={{ gap: 8 }}><Button size="sm" icon="image">Upload image</Button><Button size="sm" variant="ghost">Use first frame</Button></div>
        </div>
      </div>
    </div>
  );
}

export function ShopLinks({ items }) {
  const list = items || [
    { type: 'product', product: 101 },
    { type: 'button', text: 'Shop the serum', url: '/product/glow-serum', campaign: 'October glow' },
  ];
  return (
    <div className="pr-stackv" style={{ gap: 12 }}>
      <div className="pr-linkopts">
        <button type="button" className="pr-linkopt"><span className="pr-linkopt__icon"><Icon name="tag" size={18} /></span><span className="pr-linkopt__text"><span className="pr-t-body-strong">Tag products</span><span className="pr-t-small">From your WooCommerce store</span></span></button>
        <button type="button" className="pr-linkopt"><span className="pr-linkopt__icon"><Icon name="link" size={18} /></span><span className="pr-linkopt__text"><span className="pr-t-body-strong">Add a button</span><span className="pr-t-small">Any link, with a campaign</span></span></button>
      </div>
      {list.length > 0 && (
        <div className="pr-attached">
          {list.map((it, i) => {
            if (it.type === 'product') {
              const p = productById(it.product);
              return (
                <div className="pr-attach" key={i}>
                  <span className="pr-attach__thumb"><PosterArt kind={p.poster} /></span>
                  <span className="pr-attach__text"><span className="pr-t-body-strong">{p.name}</span><span className="pr-attach__meta pr-t-small">{p.price}{p.regular ? `, was ${p.regular}` : ''}</span></span>
                  <IconButton icon="x" label={`Remove ${p.name}`} />
                </div>
              );
            }
            return (
              <div className="pr-attach" key={i}>
                <span className="pr-attach__thumb"><Icon name="link" size={18} /></span>
                <span className="pr-attach__text"><span className="pr-t-body-strong">{it.text}</span><span className="pr-attach__meta pr-t-small">{it.url} in campaign “{it.campaign}”</span></span>
                <IconButton icon="pencil" label={`Edit ${it.text}`} />
                <IconButton icon="x" label={`Remove ${it.text}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProductPicker({ selected = [101, 103], query = 'cream', wooActive = true }) {
  if (!wooActive)
    return (
      <Notice tone="warn" title="WooCommerce is turned off" actions={<Button size="sm">Open Plugins</Button>}>
        Product tags need WooCommerce. Turn it on to tag products, or add a button with any link instead.
      </Notice>
    );
  const list = demo.products.slice(0, 6);
  return (
    <div className="pr-stackv" style={{ gap: 12 }}>
      <SearchField placeholder="Search products by name or SKU" defaultValue={query} />
      <div className="pr-plist" role="listbox" aria-multiselectable="true">
        {list.map((p) => {
          const on = selected.includes(p.id);
          return (
            <label className="pr-prow" key={p.id} data-checked={on} role="option" aria-selected={on}>
              <Checkbox defaultChecked={on} />
              <span className="pr-prow__thumb"><PosterArt kind={p.poster} /></span>
              <span className="pr-prow__text"><span className="pr-t-body-strong">{p.name}</span><span className="pr-prow__meta pr-t-small">{p.price} <span aria-hidden="true">/</span> SKU {p.sku}</span></span>
              {p.outOfStock && <Badge tone="warn" icon="alert">Out of stock</Badge>}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function LinkForm({ error }) {
  return (
    <div className="pr-stackv">
      <div className="pr-fieldgrid">
        <TextField label="Button text" defaultValue="Shop the serum" help="Short and specific works best." />
        <TextField label="Campaign" defaultValue="October glow" help="Groups this button's clicks in statistics." />
      </div>
      <TextField label="Link" icon="link" defaultValue={error ? 'yourstore.com/glow' : 'https://yourstore.com/product/glow-serum'} error={error ? 'Add https:// to the start of the link.' : undefined} />
      <Toggle label="Open in a new tab" description="Keeps the reel open behind it." defaultChecked={false} />
      <TextField label="CSS class" placeholder="optional" help="For your own styling. Added to the button." />
    </div>
  );
}

/* ---------- Feedback ---------- */
export function Notice({ tone = 'info', title, children, actions, icon }) {
  const ic = icon || { info: 'info', warn: 'alert', danger: 'alert', ok: 'success' }[tone];
  return (
    <div className={cx('pr-notice', tone !== 'info' && 'pr-notice--' + tone)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon name={ic} size={18} />
      <div className="pr-notice__body">
        {title && <span className="pr-t-body-strong">{title}</span>}
        {children && <span className="pr-t-body">{children}</span>}
        {actions && <div className="pr-notice__actions">{actions}</div>}
      </div>
    </div>
  );
}

export function Toast({ icon = 'success', children, action }) {
  return (
    <div className={cx('pr-toast', !action && 'pr-toast--plain')} role="status">
      <Icon name={icon} size={18} />
      <span className="pr-t-body">{children}</span>
      {action && <Button variant="on-ink" size="sm">{action}</Button>}
    </div>
  );
}

export function Dialog({ title, description, children, footer, note, noteTone, size, onClose = true, style }) {
  return (
    <div className={cx('pr-dialog', size && 'pr-dialog--' + size)} role="dialog" aria-modal="true" aria-label={title} style={style}>
      <div className="pr-dialog__head">
        <div className="pr-dialog__titles">
          <h2 className="pr-t-title">{title}</h2>
          {description && <p className="pr-t-small">{description}</p>}
        </div>
        {onClose && <IconButton icon="x" label="Close" size="md" />}
      </div>
      {children}
      {(footer || note) && (
        <div className="pr-dialog__foot">
          {note && <span className={cx('pr-dialog__note pr-t-small', noteTone === 'warn' && 'pr-dialog__note--warn')}>{noteTone === 'warn' && <Icon name="alert" size={15} />}{note}</span>}
          {footer}
        </div>
      )}
    </div>
  );
}

export function ConfirmDialog({ title = 'Delete “Homepage stories”?', children = 'Pages that use its shortcode or block will show nothing. Its reels stay in your library.', confirm = 'Delete widget' }) {
  return (
    <div className="pr-dialog" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="pr-confirm">
        <span className="pr-confirm__icon"><Icon name="trash" size={20} /></span>
        <div className="pr-confirm__text">
          <h2 className="pr-t-title">{title}</h2>
          <p className="pr-t-body">{children}</p>
        </div>
      </div>
      <div className="pr-dialog__foot">
        <Button>Cancel</Button>
        <Button variant="danger" icon="trash">{confirm}</Button>
      </div>
    </div>
  );
}

export function Tabs({ items = [], value }) {
  const [v, setV] = useState(value ?? (items[0] && items[0].id));
  return (
    <div className="pr-tabs" role="tablist">
      {items.map((it) => (
        <button key={it.id} type="button" role="tab" aria-selected={v === it.id} className="pr-tab pr-t-body-strong" onClick={() => setV(it.id)}>
          {it.icon && <Icon name={it.icon} size={16} />}
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function ReelEditor({ title = 'Glow serum in 20 seconds', style }) {
  return (
    <Dialog size="wide" title="Edit reel" description="One vertical video and the products it sells." style={style} note="Changes show up in every widget that uses this reel." footer={<><Button>Cancel</Button><Button variant="primary" icon="check">Save reel</Button></>}>
      <div className="pr-sheet" style={{ borderTop: '1px solid var(--pr-line)' }}>
        <div className="pr-sheet__preview">
          <div style={{ width: 236 }}>
            <ReelPlayer reel={demo.reels[0]} compact />
          </div>
          <span className="pr-sheet__previewcap pr-t-caption"><Icon name="eye" size={14} />How it looks when it opens</span>
        </div>
        <div className="pr-sheet__form">
          <section className="pr-sheet__section">
            <div className="pr-sheet__sechead"><h3 className="pr-t-heading">Video</h3><span className="pr-t-small">2 clips</span></div>
            <VideoList />
            <Button size="sm" variant="ghost" icon="plus" style={{ alignSelf: 'flex-start' }}>Add another video</Button>
          </section>
          <section className="pr-sheet__section">
            <TextField label="Title" defaultValue={title} help="Shown on the thumbnail when the reel has no product or button." />
          </section>
          <section className="pr-sheet__section">
            <div className="pr-sheet__sechead"><h3 className="pr-t-heading">Cover</h3></div>
            <Filmstrip />
          </section>
          <section className="pr-sheet__section">
            <div className="pr-sheet__sechead"><h3 className="pr-t-heading">Shop this reel</h3><span className="pr-t-small">Shown over the video</span></div>
            <ShopLinks />
          </section>
        </div>
      </div>
    </Dialog>
  );
}

/* ---------- Page builders ---------- */
export function BuilderPlaceholder({ builder = 'Block editor' }) {
  return (
    <div className="pr-builder">
      <div className="pr-builder__head">
        <span className="pr-builder__badge"><Icon name="film" size={18} /></span>
        <div>
          <div className="pr-t-heading">ProductReels</div>
          <div className="pr-t-small pr-muted">{builder}: choose which widget shows here.</div>
        </div>
      </div>
      <div className="pr-builder__row">
        <div className="pr-field" style={{ flex: 1 }}>
          <label className="pr-field__label pr-t-label">Widget</label>
          <div className="pr-selectwrap">
            <select className="pr-select pr-t-body" defaultValue=""><option value="" disabled>Choose a widget</option>{demo.widgets.map((w) => <option key={w.id}>{w.name}</option>)}</select>
            <Icon name="chevron-down" size={18} />
          </div>
        </div>
        <Button variant="primary">Insert</Button>
      </div>
      <div className="pr-builder__links pr-t-label"><a href="#">Create widget</a><a href="#">Open ProductReels</a></div>
    </div>
  );
}

/* ---------- WordPress admin frame (mockups only) ---------- */
/* MOCKUP ONLY */
export function WpAdminFrame({ current = 'Widgets', children, style }) {
  const menu = ['Dashboard', 'Posts', 'Media', 'Pages', 'Comments', 'WooCommerce', 'Products', 'Analytics', 'Marketing', 'Appearance', 'Plugins', 'Users', 'Tools', 'Settings'];
  return (
    <div className="pr-wp" style={style}>
      <div className="pr-wp__bar"><span>My Store</span><span>+ New</span><span>Howdy, admin</span></div>
      <aside className="pr-wp__side">
        {menu.slice(0, 7).map((m) => <span className="pr-wp__item" key={m}><i />{m}</span>)}
        <span className="pr-wp__item pr-wp__item--active"><i />ProductReels</span>
        <span className="pr-wp__sub">{['Widgets', 'Reels', 'Settings'].map((s) => <span key={s} data-on={s === current}>{s}</span>)}</span>
        {menu.slice(7).map((m) => <span className="pr-wp__item" key={m}><i />{m}</span>)}
      </aside>
      <main className="pr-wp__main">{children}</main>
    </div>
  );
}

/* ---------- Storefront ---------- */
export function Price({ price, regular }) {
  return (
    <span className="prs-price pr-t-caption">
      {regular && <s>{regular}</s>}
      <span className={regular ? 'prs-price__sale' : undefined}>{price}</span>
    </span>
  );
}
export function Stars({ rating = 4.5, reviews }) {
  return (
    <span className="prs-stars pr-t-caption" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={12} strokeWidth={1.5} fill={i <= Math.round(rating) ? 'currentColor' : 'none'} />)}
      {reviews != null && <span className="prs-stars__n">({reviews})</span>}
    </span>
  );
}
export function ProductCard({ product = demo.products[0], variant = 'modern', addToCart = true, ratings, buttonText = 'Add to cart', checkout }) {
  const p = product;
  if (variant === 'classic')
    return (
      <div className="prs-card prs-card--classic">
        <span className="prs-card__thumb"><PosterArt kind={p.poster} /></span>
        <span className="prs-card__text">
          <span className="prs-card__name pr-t-body-strong">{p.name}</span>
          {ratings && <Stars rating={p.rating} reviews={p.reviews} />}
          <Price price={p.price} regular={p.regular} />
        </span>
        {addToCart && <button type="button" className="prs-btn prs-btn--sm prs-btn--block pr-t-body-strong"><Icon name={checkout ? 'zap' : 'cart'} size={16} />{checkout ? 'Buy now' : buttonText}</button>}
      </div>
    );
  return (
    <div className="prs-card">
      <span className="prs-card__thumb"><PosterArt kind={p.poster} /></span>
      <span className="prs-card__text">
        <span className="prs-card__name pr-t-label">{p.name}</span>
        {ratings && <Stars rating={p.rating} />}
        <Price price={p.price} regular={p.regular} />
      </span>
      {addToCart && <button type="button" className="prs-card__add" aria-label={`${checkout ? 'Buy' : 'Add to cart'}: ${p.name}`}><Icon name={checkout ? 'zap' : 'plus'} size={16} strokeWidth={2.25} /></button>}
    </div>
  );
}

export function ReelTile({ reel = demo.reels[0], shape = 'rect', titleMode = 'overlay', showViews = true, showPlay = true, showProduct = true, hover = 'zoom-in', width, ring }) {
  const p = showProduct && reel.product ? productById(reel.product) : null;
  const style = {};
  if (width) style['--prs-tile-w'] = width + 'px';
  if (ring) style['--prs-ring'] = ring;
  if (shape === 'circle')
    return (
      <button type="button" className={cx('prs-tile prs-tile--circle', hover && 'prs-tile--' + hover)} style={style} aria-label={`Play ${reel.title}`}>
        <span className="prs-tile__media"><PosterArt kind={reel.poster} />{showPlay && <span className="prs-play"><Icon name="play" size={14} fill="currentColor" /></span>}</span>
        {titleMode !== 'none' && (
          <span className="prs-tile__label"><span className="pr-t-label">{reel.title}</span>{showViews && <span className="prs-views pr-t-caption"><Icon name="eye" size={12} />{fmt(reel.views)}</span>}</span>
        )}
      </button>
    );
  return (
    <button type="button" className={cx('prs-tile', hover && 'prs-tile--' + hover)} style={style} aria-label={`Play ${reel.title}`}>
      <span className="prs-tile__media">
        <PosterArt kind={reel.poster} />
        {(titleMode === 'overlay' || p) && <span className="prs-tile__scrim" />}
        {showViews && <span className="prs-views prs-tile__views pr-t-caption"><Icon name="eye" size={12} />{fmt(reel.views)}</span>}
        {showPlay && <span className="prs-play"><Icon name="play" size={18} fill="currentColor" /></span>}
        {p ? <span className="prs-tile__card"><ProductCard product={p} addToCart={false} /></span> : titleMode === 'overlay' ? <span className="prs-tile__title pr-t-body-strong">{reel.title}</span> : null}
      </span>
      {titleMode === 'title' && <span className="prs-tile__below pr-t-body-strong">{reel.title}</span>}
    </button>
  );
}

export function ReelsWidget({ layout = 'carousel', reels, shape = 'rect', title, align = 'start', arrows = 'outside', tileWidth, gap = 16, titleMode, showProduct = true, showPlay, hover, popupSide = 'right', speed = 40 }) {
  const list = (reels || demo.reels.slice(0, 6)).map((r) => (typeof r === 'number' ? reelById(r) : r));
  const tw = tileWidth || (shape === 'circle' ? 96 : layout === 'grid' ? 150 : 170);
  const tile = (r, i, extra, plain) => <ReelTile key={(extra || '') + r.id + '-' + i} reel={r} shape={shape} width={tw} titleMode={plain ? 'none' : titleMode || (shape === 'circle' ? 'title' : 'overlay')} showProduct={showProduct && !plain} showViews={!plain} showPlay={!plain && (showPlay ?? shape !== 'circle')} hover={hover} />;
  const vars = { '--prs-gap': gap + 'px', '--prs-tile-w': tw + 'px' };
  let body;
  if (layout === 'grid') body = <div className="prs-grid" style={vars}>{list.map((r, i) => tile(r, i))}</div>;
  else if (layout === 'marquee') body = <div className="prs-marquee" style={vars}><div className="prs-marquee__track" style={{ '--prs-speed': speed + 's' }}>{list.map((r, i) => tile(r, i, 'a'))}{list.map((r, i) => tile(r, i, 'b'))}</div></div>;
  else if (layout === 'stacked') {
    const n = Math.min(list.length, 5), mid = (n - 1) / 2;
    body = (
      <div className="prs-deck" style={{ ...vars, margin: align === 'center' ? '0 auto' : undefined }}>
        {list.slice(0, n).map((r, i) => {
          const o = i - mid;
          return <div key={r.id} style={{ position: 'absolute', left: '50%', top: 8, transform: `translateX(calc(-50% + ${o * tw * 0.42}px)) rotate(${o * 5}deg) scale(${1 - Math.abs(o) * 0.08})`, zIndex: 10 - Math.abs(Math.round(o)) }}>{tile(r, i, 's', Math.round(o) !== 0)}</div>;
        })}
      </div>
    );
  } else if (layout === 'popup')
    body = (
      <div className={cx('prs-popup', popupSide === 'left' && 'prs-popup--left')}>
        <button type="button" className="prs-close" aria-label="Close"><Icon name="x" size={14} strokeWidth={2.25} /></button>
        <ReelTile reel={list[0]} width={124} showProduct={showProduct} />
      </div>
    );
  else
    body = (
      <div className={cx('prs-carousel', arrows === 'inside' && 'prs-carousel--inside', align === 'center' && 'prs-carousel--center')}>
        {arrows !== 'none' && <button type="button" className="prs-arrow prs-arrow--prev" aria-label="Previous reels"><Icon name="chevron-left" size={20} /></button>}
        <div className="prs-carousel__track" style={vars}>{list.map((r, i) => tile(r, i))}</div>
        {arrows !== 'none' && <button type="button" className="prs-arrow prs-arrow--next" aria-label="Next reels"><Icon name="chevron-right" size={20} /></button>}
      </div>
    );
  if (layout === 'popup') return body;
  return (
    <section className={cx('prs prs-widget', align === 'center' && 'prs-widget--center')}>
      {title && <h2 className="prs-widget__title pr-t-title">{title}</h2>}
      {body}
    </section>
  );
}

export function ReelPlayer({ reel = demo.reels[0], compact, progress = 0.38, muted = false, sheet, checkout }) {
  const p = reel.product ? productById(reel.product) : null;
  return (
    <div className="prs prs-player">
      <PosterArt kind={reel.poster} frame={2} />
      <div className="prs-player__top">
        <span className="prs-views pr-t-caption"><Icon name="eye" size={12} />{fmt(reel.views)}</span>
        <span className="prs-player__tools">
          <button type="button" className="prs-iconbtn" aria-label={muted ? 'Unmute' : 'Mute'}><Icon name={muted ? 'mute' : 'volume'} size={17} /></button>
          {!compact && <button type="button" className="prs-iconbtn" aria-label="Close player"><Icon name="x" size={18} /></button>}
        </span>
      </div>
      <div className="prs-player__bottom">
        <span className="prs-player__title pr-t-body-strong">{reel.title}</span>
        <div className="prs-player__ctas">
          {reel.id === 1 && <button type="button" className="prs-btn prs-btn--light prs-btn--block pr-t-body-strong">Shop the serum</button>}
          {p && !sheet && <ProductCard product={p} checkout={checkout} />}
        </div>
        <div className="prs-seek" role="slider" aria-label="Seek" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} tabIndex={0}>
          <span className="prs-seek__track"><span className="prs-seek__fill" style={{ width: progress * 100 + '%' }} /><span className="prs-seek__knob" style={{ left: progress * 100 + '%' }} /></span>
        </div>
        {!compact && <span className="prs-player__time pr-t-caption"><span>0:08</span><span>0:20</span></span>}
      </div>
    </div>
  );
}

export function PlayerTheater({ index = 1, total = 6, reels }) {
  const list = reels || [demo.reels[1], demo.reels[0], demo.reels[2]];
  return (
    <div className="prs prs-theater">
      <span className="prs-theater__count pr-t-label">{index + 1} of {total}</span>
      <button type="button" className="prs-navbtn prs-theater__close" aria-label="Close player"><Icon name="x" size={20} /></button>
      <div className="prs-theater__peek"><PosterArt kind={list[0].poster} /></div>
      <button type="button" className="prs-navbtn" aria-label="Previous reel"><Icon name="chevron-left" size={22} /></button>
      <div className="prs-theater__main"><ReelPlayer reel={list[1]} compact /></div>
      <button type="button" className="prs-navbtn" aria-label="Next reel"><Icon name="chevron-right" size={22} /></button>
      <div className="prs-theater__peek"><PosterArt kind={list[2].poster} /></div>
    </div>
  );
}
