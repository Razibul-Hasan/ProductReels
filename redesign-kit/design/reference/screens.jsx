/**
 * ProductReels 1.1.0 reference screens: how the components compose into each screen.
 * Each function matches design/screens/<Name>.png. They use MOCKUP ONLY sample data (demo, PosterArt, WpAdminFrame);
 * real screens load data from the REST API. Extra CSS a screen needs for its mock surroundings is in the comment above it.
 */
import * as UI from "./components.jsx";

const P = { demo: UI.demo, iconNames: UI.iconNames, posterKinds: UI.posterKinds };
const { Icon, PosterArt, Button, IconButton, Badge, LayoutBadge, FilterChips, AppHeader, PageHeader, Field, TextField, SearchField, Checkbox, Switch, Toggle, Segmented, ColorField, RangeField, SettingRow, SettingsCard, TemplatePicker, MetricBand, ShortcodeChip, BarCell, Menu, WidgetTable, EmptyState, StepGuide, ReelCard, FloatingBar, ReelRow, ReelPicker, StudioRail, StudioPanel, PanelSection, DeviceSwitch, DeviceFrame, Stage, StudioHeader, StudioShell, Notice, Toast, Dialog, ConfirmDialog, ReelEditor, WpAdminFrame, Price, ReelTile, ReelsWidget, ReelPlayer, PlayerTheater } = UI;

/* Widgets: the home screen */
export function ScreenWidgets() {
  return (
    <WpAdminFrame current="Widgets" style={{height:1160}}>
      <AppHeader current="widgets"/>
      <div className="pr-page" style={{width:'100%'}}>
        <PageHeader title="Widgets" count={4} description="Styled sets of reels you can place on any page." actions={<><SearchField placeholder="Search widgets" width={240}/><Button icon="plus">Add reel</Button><Button variant="primary" icon="plus">Create widget</Button></>}/>
        <MetricBand items={[{label:'Views',icon:'eye',value:'12,480',hint:'Counted after one second of playback'},{label:'Clicks',icon:'click',value:'1,032',hint:'Buttons and product cards'},{label:'Click rate',icon:'percent',value:'8.3%',hint:'Clicks per view'},{label:'Reels in use',icon:'film',value:'7 of 8',hint:'1 reel isn’t in a widget'}]}/>
        <section style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><h2 className="pr-t-title">Top reels</h2><a href="#" className="pr-t-label">See all reels</a></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,150px)',justifyContent:'space-between',gap:16}}>
        {P.demo.reels.slice(0,6).map((r,i) => (
          <div key={r.id} style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{position:'relative'}}><ReelTile reel={r} width={150} titleMode="none" showProduct={false} showPlay={false} showViews={false}/><span className="pr-t-caption" style={{position:'absolute',top:10,left:10,width:24,height:24,borderRadius:99,display:'grid',placeItems:'center',background:'var(--pr-surface)',color:'var(--pr-ink)'}}>{i+1}</span></div>
            <span className="pr-t-body-strong" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title}</span>
            <span className="pr-t-small pr-muted" style={{display:'flex',gap:12}}><span style={{display:'inline-flex',gap:4,alignItems:'center'}}><Icon name="eye" size={13}/>{r.views.toLocaleString('en-US')}</span><span>{(r.clicks/r.views*100).toFixed(1)}% click rate</span></span>
          </div>))}
      </div>
    </section>
        <WidgetTable menuOpenFor={9}/>
      </div>
      <div style={{position:'absolute',left:0,right:0,bottom:24,display:'flex',justifyContent:'center'}}><Toast icon="copy">Shortcode copied</Toast></div>
    </WpAdminFrame>
  );
}

/* Widgets: first run */
export function ScreenFirstRun() {
  return (
    <WpAdminFrame current="Widgets" style={{height:720}}>
      <AppHeader current="widgets"/>
      <div className="pr-page" style={{width:'100%'}}>
        <StepGuide done={1}/>
      </div>
    </WpAdminFrame>
  );
}

/* Reels library with a bulk selection */
export function ScreenReels() {
  return (
    <WpAdminFrame current="Reels" style={{height:820}}>
      <AppHeader current="reels"/>
      <div className="pr-page" style={{width:'100%'}}>
        <PageHeader title="Reels" count={8} description="Each reel is one vertical video and the products it sells. Use it in as many widgets as you like." actions={<><SearchField placeholder="Search reels" width={240}/><Button variant="primary" icon="plus">Add reel</Button></>}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><FilterChips items={[{id:'all',label:'All',count:8},{id:'products',label:'Tagged products',count:7},{id:'buttons',label:'With a button',count:2},{id:'unused',label:'Not in a widget',count:1}]}/><Segmented iconOnly label="View" options={[{value:'grid',label:'Grid',icon:'grid'},{value:'list',label:'List',icon:'list'}]}/></div>
        <div className="pr-reelgrid" style={{gridTemplateColumns:'repeat(8,1fr)'}}>{P.demo.reels.map((r,i) => <ReelCard key={r.id} reel={r} selected={i===1||i===3||i===6}/>)}</div>
      </div>
      <div style={{position:'absolute',left:0,right:0,bottom:28,display:'flex',justifyContent:'center'}}><FloatingBar text="3 reels selected"><Button variant="on-ink" size="sm">Clear</Button><Button variant="danger" size="sm" icon="trash">Delete selected</Button></FloatingBar></div>
    </WpAdminFrame>
  );
}

/* Edit reel: video, cover and what it sells */
export function ScreenReelEditor() {
  return (
    <WpAdminFrame current="Reels" style={{height:1000}}>
      <AppHeader current="reels"/>
      <div className="pr-page" style={{width:'100%'}}>
        <PageHeader title="Reels" count={8} description="Each reel is one vertical video and the products it sells." actions={<Button variant="primary" icon="plus">Add reel</Button>}/>
        <div className="pr-reelgrid" style={{gridTemplateColumns:'repeat(8,1fr)'}}>{P.demo.reels.map(r => <ReelCard key={r.id} reel={r}/>)}</div>
      </div>
      <div className="pr-overlay" style={{padding:'40px 48px'}}><ReelEditor style={{height:'100%'}}/></div>
    </WpAdminFrame>
  );
}

/* Create widget: start from a layout */
export function ScreenCreateWidget() {
  return (
    <WpAdminFrame current="Widgets" style={{height:900}}>
      <AppHeader current="widgets"/>
      <div className="pr-page" style={{width:'100%'}}>
        <PageHeader title="Widgets" count={4} description="Styled sets of reels you can place on any page." actions={<Button variant="primary" icon="plus">Create widget</Button>}/>
        <WidgetTable/>
      </div>
      <div className="pr-overlay"><Dialog size="wide" title="Create widget" description="Choose how reels sit on the page. You can change it any time." footer={<><Button>Cancel</Button><Button variant="primary" iconRight="chevron-right">Choose reels</Button></>}>
        <div className="pr-dialog__body" style={{gap:20}}>
          <TextField label="Widget name" defaultValue="Homepage stories" help="Only you see this."/>
          <TemplatePicker value="carousel" variant="tile" columns={5}/>
          <div style={{display:'flex',gap:16,alignItems:'center'}}><span className="pr-t-label">Reel shape</span><Segmented label="Shape" defaultValue="circle" options={[{value:'rect',label:'Rectangle',icon:'rectangle'},{value:'circle',label:'Circle',icon:'circle'}]}/></div>
        </div>
      </Dialog></div>
    </WpAdminFrame>
  );
}

/* Widget editor: Layout step, desktop preview */
export function ScreenStudioLayout() {
  return (
    <StudioShell style={{height:900}}
      header={<StudioHeader name="Homepage stories" dirty id={12}/>}
      rail={<StudioRail current="layout" reels={6}/>}
      panel={<StudioPanel title="Layout" description="How reels sit on the page.">
        <PanelSection><TemplatePicker value="carousel"/></PanelSection>
        <PanelSection title="Shape"><Segmented block label="Shape" defaultValue="circle" options={[{value:'rect',label:'Rectangle',icon:'rectangle'},{value:'circle',label:'Circle',icon:'circle'}]}/></PanelSection>
        <PanelSection title="Size and spacing" aside={<span style={{display:'inline-flex',gap:4,alignItems:'center'}}><Icon name="monitor" size={14}/>Desktop</span>}><RangeField label="Reel width" value={96} min={64} max={200}/><RangeField label="Gap" value={20} min={0} max={48}/><Field label="Alignment"><Segmented block label="Alignment" defaultValue="center" options={[{value:'l',label:'Left',icon:'align-left'},{value:'center',label:'Center',icon:'align-center'},{value:'r',label:'Right',icon:'align-right'}]}/></Field></PanelSection>
        <PanelSection title="Carousel arrows"><Segmented block label="Arrows" options={[{value:'outside',label:'Outside'},{value:'inside',label:'Inside'}]}/></PanelSection>
      </StudioPanel>}
      stage={<Stage device="desktop"><DeviceFrame device="desktop" url="yourstore.com"><ReelsWidget layout="carousel" shape="circle" title="Watch and shop" align="center" tileWidth={96} gap={20}/><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>{[0,1,2].map(i => <div key={i} style={{height:120,borderRadius:10,background:'var(--pr-surface-sunken)'}}/>)}</div></DeviceFrame></Stage>}
    />
  );
}

/* Widget editor: Reels step, mobile preview */
export function ScreenStudioReels() {
  return (
    <StudioShell style={{height:900}}
      header={<StudioHeader name="Product page reels" id={9} dirty={false}/>}
      rail={<StudioRail current="reels" reels={5}/>}
      panel={<StudioPanel title="Reels" description="Drag to set the order they appear in.">
        <PanelSection><div className="pr-reelrows">{[1,2,3,4,5].map((id,i) => <ReelRow key={id} reel={P.demo.reels[id-1]} dragging={i===1}/>)}</div></PanelSection>
        <PanelSection title="Add from your library" aside="Tap to add"><div style={{display:'flex',gap:8}}><div style={{flex:1}}><SearchField placeholder="Search reels"/></div><IconButton icon="plus" label="Add new reel" size="md" variant="outline"/></div><ReelPicker reels={P.demo.reels.slice(3,8)} added={[4,5]}/></PanelSection>
      </StudioPanel>}
      stage={<Stage device="mobile"><DeviceFrame device="mobile"><ReelsWidget layout="carousel" title="Seen on our customers" reels={[1,2,3,4,5]} tileWidth={150} gap={12} arrows="inside"/></DeviceFrame></Stage>}
    />
  );
}

/* Widget editor: Look step, grid on desktop */
export function ScreenStudioLook() {
  return (
    <StudioShell style={{height:900}}
      header={<StudioHeader name="Shop the look" id={7}/>}
      rail={<StudioRail current="thumbnails" reels={6}/>}
      panel={<StudioPanel title="Look" description="What visitors see before they press play.">
        <PanelSection title="Title"><Segmented block label="Title" defaultValue="overlay" options={[{value:'overlay',label:'Over video'},{value:'below',label:'Below'},{value:'none',label:'Hidden'}]}/><p className="pr-t-small pr-muted">Reels tagged with a product show the product card instead.</p></PanelSection>
        <PanelSection title="Overlay"><div className="pr-fieldgrid"><ColorField label="Shade" value="#0a0c1a" alpha={80}/><ColorField label="Text" value="#ffffff"/></div></PanelSection>
        <PanelSection title="Preview before play"><Segmented block label="Preview" defaultValue="hover" options={[{value:'off',label:'Off'},{value:'hover',label:'On hover'},{value:'auto',label:'When visible'}]}/></PanelSection>
        <PanelSection title="Hover effect"><Segmented block label="Hover" defaultValue="zoom-in" options={[{value:'zoom-in',label:'Zoom in'},{value:'zoom-out',label:'Zoom out'},{value:'lift',label:'Lift'}]}/></PanelSection>
        <PanelSection><Toggle label="Play button" description="A play icon in the middle of each reel." defaultChecked/><Toggle label="View count" description="Shows how many times a reel was watched." defaultChecked/></PanelSection>
      </StudioPanel>}
      stage={<Stage device="desktop"><DeviceFrame device="desktop" url="yourstore.com/shop-the-look"><ReelsWidget layout="grid" title="Shop the look" reels={[2,3,1,4,5,8]} tileWidth={128} gap={14}/></DeviceFrame></Stage>}
    />
  );
}

/* Statistics for one widget */
export function ScreenStatistics() {
  return (
    <WpAdminFrame current="Widgets" style={{height:1290}}>
      <AppHeader current="widgets"/>
      <div className="pr-page" style={{width:'100%'}}>
        <PageHeader title="Statistics" back="Back to widgets" description="Homepage stories, all time." actions={<><ShortcodeChip code='[productreels id="12"]'/><Button icon="pencil">Edit widget</Button></>}/>
        <MetricBand items={[{label:'Views',icon:'eye',value:'6,420',hint:'Counted after one second of playback'},{label:'Clicks',icon:'click',value:'512',hint:'Buttons and product cards'},{label:'Click rate',icon:'percent',value:'8.0%',hint:'Clicks per view'}]}/>
        <div className="pr-tablewrap">
          <div className="pr-tablehead"><h2 className="pr-t-title">Reels</h2><span className="pr-t-small pr-muted">Sorted by views</span></div>
          <table className="pr-table"><thead><tr className="pr-t-label"><th>Reel</th><th className="num">Views</th><th className="num">Clicks</th><th className="num">Click rate</th></tr></thead>
          <tbody>{P.demo.reels.slice(0,6).map(r => <tr key={r.id}><td><div className="pr-wname"><span className="pr-reelrow__thumb"><PosterArt kind={r.poster}/></span><span className="pr-t-body-strong">{r.title}</span></div></td><td className="num"><BarCell value={r.views} max={4210}/></td><td className="num pr-t-body">{r.clicks}</td><td className="num pr-t-body">{(r.clicks/r.views*100).toFixed(1)}%</td></tr>)}</tbody></table>
        </div>
        <div className="pr-tablewrap">
          <div className="pr-tablehead"><h2 className="pr-t-title">Buttons</h2><span className="pr-t-small pr-muted">Custom buttons across this widget's reels</span></div>
          <table className="pr-table"><thead><tr className="pr-t-label"><th>Button text</th><th>Campaign</th><th>Link</th><th className="num">Clicks</th></tr></thead>
          <tbody>{P.demo.buttons.map(b => <tr key={b.text}><td className="pr-t-body-strong">{b.text}</td><td><Badge tone="brand">{b.campaign}</Badge></td><td className="pr-t-body muted">{b.url}</td><td className="num"><BarCell value={b.clicks} max={214}/></td></tr>)}</tbody></table>
        </div>
      </div>
    </WpAdminFrame>
  );
}

/* Settings with unsaved changes */
export function ScreenSettings() {
  return (
    <WpAdminFrame current="Settings" style={{height:1180}}>
      <AppHeader current="settings"/>
      <div className="pr-page" style={{width:'100%'}}>
        <PageHeader title="Settings" description="How views are counted, who can read your widgets, caching, and what happens on uninstall."/>
        <div style={{display:'grid',gridTemplateColumns:'200px minmax(0,1fr)',gap:32,alignItems:'start'}}>
          <nav style={{display:'flex',flexDirection:'column',gap:2,position:'sticky',top:24}} aria-label="Settings sections">{[['View tracking','eye',true],['Public API','code'],['Performance','zap'],['Data','trash']].map(([l,ic,on]) => <a key={l} href="#" className="pr-menu__item pr-t-body" style={{background:on?'var(--pr-surface)':undefined,boxShadow:on?'0 0 0 1px var(--pr-line)':undefined,textDecoration:'none'}}><Icon name={ic} size={17}/>{l}</a>)}</nav>
          <div style={{display:'flex',flexDirection:'column',gap:20,maxWidth:820}}>
            <SettingsCard title="View tracking" description="Each visitor can add a limited number of views to a reel in a time window, so refreshes don't inflate your numbers.">
              <SettingRow title="Views per visitor" description="Per reel, within the time window."><div style={{width:140}}><TextField defaultValue="2" aria-label="Views per visitor"/></div></SettingRow>
              <SettingRow title="Time window" description="How long the limit lasts."><div style={{width:140}}><TextField defaultValue="60" suffix="min" aria-label="Time window"/></div></SettingRow>
              <SettingRow below title="What this means"><div className="pr-summary pr-t-body" style={{width:'100%'}}><Icon name="info" size={16}/>A visitor adds at most 2 views to each reel per hour. IPs are hashed and never stored.</div></SettingRow>
            </SettingsCard>
            <SettingsCard title="Public API" description="Your own pages always work. This decides whether other sites and apps can read a widget from the REST API.">
              <SettingRow title="Allow public fetch" description="GET /productreels/v1/render/{id} answers anyone. It returns reel titles, video and cover links, view counts and product links, never anything about visitors or orders."><Switch label="Allow public fetch" defaultChecked/></SettingRow>
            </SettingsCard>
            <SettingsCard title="Performance" description="Widgets are assembled once and reused until something changes.">
              <SettingRow title="Cache widgets" description="Editing a widget, reel or video clears its cache straight away."><Switch label="Cache widgets" defaultChecked/></SettingRow>
              <SettingRow title="Cache lifetime" description="Between 1 minute and 7 days."><div style={{width:160}}><TextField defaultValue="720" suffix="min" aria-label="Cache lifetime"/></div></SettingRow>
            </SettingsCard>
            <SettingsCard title="Data" tone="danger" description="What happens to your reels, widgets and statistics when the plugin is deleted. Deactivating never removes anything.">
              <SettingRow title="Delete all data on uninstall" description="Removes every reel, widget and statistic when you delete ProductReels from Plugins. This can't be undone."><Switch label="Delete all data on uninstall" tone="danger"/></SettingRow>
            </SettingsCard>
          </div>
        </div>
      </div>
      <div style={{position:'absolute',left:160,right:0,bottom:24,display:'flex',justifyContent:'center'}}><FloatingBar text="You have unsaved changes" dot><Button variant="on-ink" size="sm">Discard</Button><Button variant="primary" size="sm" icon="check">Save settings</Button></FloatingBar></div>
    </WpAdminFrame>
  );
}

/* A product page with a carousel and a popup
   Mock CSS: .store{position:relative;background:var(--pr-surface);height:1230px;overflow:hidden;font-family:"Helvetica Neue",Arial,sans-serif}.nav{display:flex;justify-content:space-between;align-items:center;padding:20px 64px;border-bottom:1px solid var(--pr-line)}.nav span{color:var(--pr-ink-muted)}.prod{display:grid;grid-template-columns:440px 1fr;gap:56px;padding:32px 160px}.img{aspect-ratio:1;border-radius:4px;overflow:hidden}.img svg{width:100%;height:100%;display:block}.info{display:flex;flex-direction:column;gap:16px;padding-top:12px}.info h1{font-family:Georgia,serif;font-size:36px;line-height:42px;font-weight:400}.sect{padding:24px 160px 48px} */
export function ScreenStorefront() {
  return (
    <div className="store">
      <div className="nav"><span className="pr-t-body">Home</span><span className="pr-t-body">Shop</span><span style={{fontFamily:'Georgia,serif',fontSize:24,color:'var(--pr-ink)'}}>Lumen Skin</span><span className="pr-t-body">Journal</span><span className="pr-t-body">Cart (0)</span></div>
      <div style={{padding:'24px 0 0'}}><ReelsWidget layout="carousel" shape="circle" align="center" arrows="none" tileWidth={86} gap={24} reels={[1,2,3,4,5,6]}/></div>
      <div className="prod"><div className="img"><PosterArt kind="serum"/></div><div className="info"><span className="pr-t-small pr-muted">Serums</span><h1>Glow Serum 30 ml</h1><span style={{display:'flex',gap:10,alignItems:'baseline',fontSize:20}}><s style={{color:'var(--pr-ink-muted)',fontSize:16}}>$32.00</s><span>$24.00</span></span><p className="pr-t-body pr-muted" style={{maxWidth:420}}>A light vitamin C serum for morning skin. Three drops, pressed in, before SPF.</p><button className="prs-btn pr-t-body-strong" style={{alignSelf:'flex-start',padding:'0 32px'}}>Add to cart</button></div></div>
      <div className="sect"><ReelsWidget layout="carousel" title="See it on real skin" reels={[1,2,3,5,6,4]} tileWidth={180}/></div>
      <ReelsWidget layout="popup" reels={[4]}/>
    </div>
  );
}

/* Grid, marquee, stacked and popup on the storefront
   Mock CSS: .page{position:relative;background:var(--pr-surface);min-height:1350px;padding:48px 96px;display:flex;flex-direction:column;gap:56px}.lab{color:var(--pr-ink-muted)}.two{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start}.mock{position:relative;height:420px;border-radius:16px;background:var(--pr-canvas);overflow:hidden;padding:24px}.mock .bar{height:12px;border-radius:99px;background:var(--pr-line);margin-bottom:10px} */
export function ScreenLayouts() {
  return (
    <div className="page">
      <div><p className="pr-t-label lab" style={{marginBottom:12}}>Grid</p><ReelsWidget layout="grid" title="Shop the look" reels={[2,3,1,4,5,8,6]} tileWidth={150}/></div>
      <div><p className="pr-t-label lab" style={{marginBottom:12}}>Marquee</p><ReelsWidget layout="marquee" reels={[1,2,3,4,5,6,7]} tileWidth={150} showProduct={false} titleMode="overlay"/></div>
      <div className="two">
        <div><p className="pr-t-label lab" style={{marginBottom:12}}>Stacked</p><ReelsWidget layout="stacked" reels={[2,1,3,4,5]} tileWidth={160} align="center"/></div>
        <div><p className="pr-t-label lab" style={{marginBottom:12}}>Popup</p><div className="mock"><div className="bar" style={{width:'60%'}}/><div className="bar" style={{width:'85%'}}/><div className="bar" style={{width:'70%'}}/><ReelsWidget layout="popup" reels={[2]}/></div></div>
      </div>
    </div>
  );
}

/* The player on mobile and desktop
   Mock CSS: .row{display:grid;grid-template-columns:420px 1fr;height:900px}.phone{background:var(--pr-canvas);display:grid;place-items:center}.phone>div{width:340px} */
export function ScreenPlayer() {
  return (
    <div className="row"><div className="phone"><div><ReelPlayer reel={P.demo.reels[0]}/></div></div><PlayerTheater index={1} total={6}/></div>
  );
}
