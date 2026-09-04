const FILE_COUNT = 14;
const authorMode = location.protocol === 'file:' || ['localhost','127.0.0.1','terminal.local'].includes(location.hostname) || new URLSearchParams(location.search).has('edit');
if (!authorMode) { document.body.classList.add('published-view'); document.querySelectorAll('[contenteditable]').forEach(element => element.removeAttribute('contenteditable')); }
const root = document.documentElement;
const masthead = document.getElementById('archive-masthead');
const mastheadExtension = document.getElementById('masthead-extension');
const mastheadTabs = [...document.querySelectorAll('[data-masthead-panel]')];
const customizer = document.getElementById('customizer');
const recordDialog = document.getElementById('record-dialog');
const recordMedia = document.getElementById('record-media');
const phonePreviewDock = document.getElementById('phone-preview-dock');
const phonePreviewViewport = document.getElementById('phone-preview-viewport');
let activeFileId = '01';
let activeRecordFigure = null;
let draggedItem = null;
let recordStore = {};
let regionThemes = {};
let isRestoringSections = false;
const recordMediaStore = {};

const pad = value => String(value).padStart(2, '0');
const fileLetter = value => String.fromCharCode(64 + Number(value));

function storyPlaceholder(language) {
  if (language === 'chinese') return '<p class="section-code">中文转录</p><p>点击“编辑文字”，在这里粘贴或输入这一组作品的中文内容。</p>';
  return '<p class="section-code">ENGLISH TRANSMISSION</p><p>Select “EDIT STORY TEXT” and replace this paragraph with the English text for this test board.</p>';
}

function springMarkup() {
  const choices = [
    ['THE REMNANT OF SPRING', '春天的残党'],
    ['SPRING UPON RELEASED FROM PRISON', '刑满释放的春天'],
    ['THE SPRING OF OVERFLOWING TEARS', '泪水决堤的春天'],
    ['THE “WELL-WORN” SPRING', '被用惯的春天'],
    ['THE HEALING SPRING', '愈合的春天']
  ];
  return `<section class="spring-selector" aria-labelledby="spring-title-07">
    <header><p class="section-code">INTERACTIVE TEST / 07—S</p><h2 id="spring-title-07" contenteditable="${authorMode}" spellcheck="false">CHOOSE YOUR SPRING</h2><p lang="zh-Hans" contenteditable="${authorMode}" spellcheck="false">选择你的春天</p></header>
    <div class="spring-machine">
      <div class="spring-options" role="radiogroup" aria-label="Choose your spring">
        ${choices.map((choice, index) => `<button class="spring-option" type="button" role="radio" aria-checked="false" data-spring-index="${index}"><i aria-hidden="true"></i><span>${choice[0]}</span><small lang="zh-Hans">${choice[1]}</small></button>`).join('')}
      </div>
      <div class="spring-result" aria-live="polite">
        <div class="spring-orbit" aria-hidden="true"><i></i><b></b></div>
        <span>NO SPECIMEN SELECTED</span><strong>—</strong>
        <p class="spring-response">Awaiting seasonal signal.</p>
        <div class="spring-signal" aria-hidden="true"><i></i></div>
        <small>SELECT ONE SLOT TO ACTIVATE THE TRACE</small>
      </div>
    </div>
  </section>`;
}

function controlsMarkup() {
  return `<div class="item-controls" aria-label="Media controls">
    <button type="button" data-action="up" aria-label="Move item up">↑</button>
    <button type="button" data-action="down" aria-label="Move item down">↓</button>
    <button type="button" data-action="size" data-span="12">1</button>
    <button type="button" data-action="size" data-span="6">½</button>
    <button type="button" data-action="size" data-span="4">⅓</button>
    <button type="button" data-action="size" data-span="3">¼</button>
    <button type="button" data-action="remove" aria-label="Remove item">×</button>
    <span class="span-readout">COL 12</span>
  </div><button class="resize-slot" type="button" data-action="resize" aria-label="Drag to resize image"></button>`;
}

function videoMarkup(fileId, slot) {
  return `<figure class="visual-item video-item" data-record-id="video-${fileId}-${pad(slot)}" data-video-url="" data-poster-key="" data-poster-name="" style="--visual-span: 12">
    <div class="video-frame"><button class="video-placeholder" type="button" data-action="video">ADD VIMEO / YOUTUBE LINK <small>VIDEO SLOT ${pad(slot)}</small></button></div>
    <label class="video-cover-control">CHANGE COVER<input class="video-cover-upload" type="file" accept="image/*"></label>
    <figcaption contenteditable="${authorMode}" spellcheck="false">MOVING IMAGE ${fileLetter(fileId)}—${pad(slot)}</figcaption>
    ${controlsMarkup()}
  </figure>`;
}

function fileMarkup(number) {
  const id = pad(number);
  const videos = number === 5 ? videoMarkup(id, 1) : number === 11 ? `${videoMarkup(id, 1)}${videoMarkup(id, 2)}` : '';
  return `<section class="archive-file archive-file-template" data-file-id="${id}">
    <section class="project-intro"><p class="eyebrow">TEST BOARD ${id} / ACTIVE RECORD</p><div class="formula-heading"><h1 class="project-formula" contenteditable="${authorMode}" spellcheck="false">FORMULA ${id}</h1><p class="work-title" contenteditable="${authorMode}" spellcheck="false">ADD WORK TITLE.</p></div></section>
    <section class="document-zone" aria-label="Test Board ${id} document">
      <div class="document-stack" data-material="glass" data-shape="notched">
        <div class="back-plate back-plate-two" aria-hidden="true"></div><div class="back-plate back-plate-one" aria-hidden="true"></div>
        <nav class="folder-tabs" aria-label="Document layers" role="tablist">
          <button class="folder-tab is-active" type="button" role="tab" aria-selected="true" aria-controls="panel-${id}-visuals" data-target="visuals"><span>VISUALS</span><small>01</small></button>
          <button class="folder-tab" type="button" role="tab" aria-selected="false" aria-controls="panel-${id}-story" data-target="story"><span>STORY</span><small>02</small></button>
        </nav>
        <article class="document-sheet is-active" id="panel-${id}-visuals" role="tabpanel" data-panel="visuals">
          <header class="sheet-header"><span>DOCUMENT ${fileLetter(id)}—01</span><span class="visual-count">${videos ? `${number === 11 ? '02' : '01'} MEDIA RECORD${number === 11 ? 'S' : ''}` : '00 MEDIA RECORDS'}</span></header>
          <div class="visual-editor-bar"><button type="button" data-action="edit-layout">EDIT LAYOUT</button><button type="button" data-action="auto-arrange">AUTO ARRANGE</button><label>ADD IMAGES<input class="visual-upload-inline" type="file" accept="image/*" multiple></label><label class="grid-number">ROW HEIGHT<input data-layout-setting="rowHeight" type="number" min="4" max="120" step="0.1" value="28"></label><label class="grid-number">GUTTER<input data-layout-setting="gutter" type="number" min="0" max="48" step="0.5" value="4"></label><span>DRAG TO REORDER / PULL THE LOWER-RIGHT SLOT TO RESIZE</span></div>
          ${number === 7 ? springMarkup() : ''}
          <div class="visual-field layout-grid">${videos}</div>
          <footer class="sheet-footer"><span>TRANSMISSION STATE / EDITABLE</span><span>TEST BOARD ${id}</span></footer>
        </article>
        <article class="document-sheet" id="panel-${id}-story" role="tabpanel" data-panel="story" hidden>
          <header class="sheet-header"><span>TEXT RECORD ${fileLetter(id)}—01</span><span>EN / 中文</span></header>
          <div class="story-editor-bar"><button type="button" data-action="edit-story">EDIT STORY TEXT</button><span>ENGLISH / 中文 ARE EDITED INDEPENDENTLY</span></div>
          <div class="story-layout"><section lang="en" class="story-record" data-story="english" contenteditable="false">${storyPlaceholder('english')}</section><section lang="zh-Hans" class="chinese-record story-record" data-story="chinese" contenteditable="false">${storyPlaceholder('chinese')}</section></div>
          <footer class="sheet-footer"><span>TEXT LAYER / EDITABLE</span><span>TEST BOARD ${id}</span></footer>
        </article>
      </div>
    </section>
  </section>`;
}

document.getElementById('additional-files').innerHTML = Array.from({ length: FILE_COUNT - 1 }, (_, index) => fileMarkup(index + 2)).join('');

const controls = {
  pageColor: document.getElementById('page-color'), sheetColor: document.getElementById('sheet-color'), inkColor: document.getElementById('ink-color'), glowColor: document.getElementById('glow-color'),
  opacity: document.getElementById('sheet-opacity'), frost: document.getElementById('sheet-frost'), glowStrength: document.getElementById('glow-strength'), engraveStrength: document.getElementById('engrave-strength'), metalReflection: document.getElementById('metal-reflection'),
  material: document.getElementById('material'), shape: document.getElementById('tab-shape'), layout: document.getElementById('visual-layout'), formulaSize: document.getElementById('formula-size'), titleSize: document.getElementById('title-size'),
  mastheadWidth: document.getElementById('masthead-width'), mastheadRatio: document.getElementById('masthead-ratio'), mastheadTitleSize: document.getElementById('masthead-title-size'), mastheadMobileWidth: document.getElementById('masthead-mobile-width'), mastheadMobileTitleSize: document.getElementById('masthead-mobile-title-size'), mastheadGap: document.getElementById('masthead-gap'),
  storySize: document.getElementById('story-size'), storyCnSize: document.getElementById('story-cn-size'), dataSize: document.getElementById('data-size'), uiSize: document.getElementById('ui-size')
};

const defaults = { pageColor:'#dfe9e8', sheetColor:'#d9eded', inkColor:'#1e3033', glowColor:'#9debf0', opacity:'78', frost:'16', glowStrength:'26', engraveStrength:'44', metalReflection:'58', material:'glass', shape:'notched', layout:'grid', formulaSize:'124', titleSize:'17', mastheadWidth:'30', mastheadRatio:'2', mastheadTitleSize:'38', mastheadMobileWidth:'68', mastheadMobileTitleSize:'27', mastheadGap:'24', storySize:'18', storyCnSize:'18', dataSize:'14', uiSize:'11' };

const regionControls = {
  target: document.getElementById('region-target'), sheetColor: document.getElementById('region-sheet-color'), inkColor: document.getElementById('region-ink-color'), glowColor: document.getElementById('region-glow-color'), bgStart: document.getElementById('region-bg-start'), bgEnd: document.getElementById('region-bg-end'), material: document.getElementById('region-material'), shape: document.getElementById('region-shape'), opacity: document.getElementById('region-opacity'), frost: document.getElementById('region-frost'), glowStrength: document.getElementById('region-glow-strength'), engraveStrength: document.getElementById('region-engrave-strength'), metalReflection: document.getElementById('region-metal-reflection')
};

const recordInputs = { title: document.getElementById('record-title'), year: document.getElementById('record-year'), medium: document.getElementById('record-medium'), material: document.getElementById('record-material'), software: document.getElementById('record-software'), notes: document.getElementById('record-notes') };

regionControls.target.innerHTML = Array.from({ length: FILE_COUNT }, (_, index) => { const id = pad(index + 1); return `<option value="file${id}-visuals">TEST BOARD ${id} / VISUALS</option><option value="file${id}-story">TEST BOARD ${id} / STORY</option>`; }).join('');

function fileElement(id) { return document.querySelector(`.archive-file[data-file-id="${id}"]`); }
function hexToRgb(hex) { const value = hex.replace('#', ''); return `${parseInt(value.slice(0,2),16)}, ${parseInt(value.slice(2,4),16)}, ${parseInt(value.slice(4,6),16)}`; }
function currentRegionDefaults() { return { sheetColor:controls.sheetColor.value, inkColor:controls.inkColor.value, glowColor:controls.glowColor.value, bgStart:controls.pageColor.value, bgEnd:controls.sheetColor.value, material:controls.material.value, shape:controls.shape.value, opacity:controls.opacity.value, frost:controls.frost.value, glowStrength:controls.glowStrength.value, engraveStrength:controls.engraveStrength.value, metalReflection:controls.metalReflection.value }; }
function regionThemeFromControls() { return Object.fromEntries(Object.entries(regionControls).filter(([key]) => key !== 'target').map(([key, control]) => [key, control.value])); }

function setRegionVariables(element, theme) {
  if (!element) return;
  element.style.setProperty('--sheet-rgb', hexToRgb(theme.sheetColor)); element.style.setProperty('--ink', theme.inkColor); element.style.setProperty('--glow-rgb', hexToRgb(theme.glowColor));
  element.style.setProperty('--sheet-opacity', String(Number(theme.opacity) / 100)); element.style.setProperty('--sheet-frost', `${theme.frost}px`); element.style.setProperty('--glow-strength', String(Number(theme.glowStrength) / 100)); element.style.setProperty('--engrave-strength', String(Number(theme.engraveStrength) / 100)); element.style.setProperty('--metal-reflection', String(Number(theme.metalReflection) / 100));
  element.style.setProperty('--region-bg-start', theme.bgStart); element.style.setProperty('--region-bg-end', theme.bgEnd); element.dataset.material = theme.material; element.dataset.shape = theme.shape;
}

function parseThemeTarget(target) { const match = /^file(\d{2})-(visuals|story)$/.exec(target); return match ? { id:match[1], panel:match[2] } : { id:'01', panel:'visuals' }; }
function applyActiveZoneTheme(file, panelName) {
  const key = `file${file.dataset.fileId}-${panelName}`; const theme = regionThemes[key] || currentRegionDefaults();
  setRegionVariables(file.querySelector('.document-stack'), theme); setRegionVariables(file.querySelector(`[data-panel="${panelName}"]`), theme);
  const zone = file.querySelector('.document-zone'); zone.style.setProperty('--region-bg-start', theme.bgStart); zone.style.setProperty('--region-bg-end', theme.bgEnd);
}
function applyRegionTheme(target, shouldSave = true) {
  const parsed = parseThemeTarget(target); const file = fileElement(parsed.id); const theme = regionThemes[target] || currentRegionDefaults();
  setRegionVariables(file?.querySelector(`[data-panel="${parsed.panel}"]`), theme);
  if (file?.querySelector(`[data-target="${parsed.panel}"]`)?.classList.contains('is-active')) applyActiveZoneTheme(file, parsed.panel);
  if (shouldSave) localStorage.setItem('malArchiveRegionThemes', JSON.stringify(regionThemes));
}
function loadRegionControls(target) {
  const theme = regionThemes[target] || currentRegionDefaults(); Object.entries(theme).forEach(([key,value]) => { if (regionControls[key]) regionControls[key].value = value; });
  document.getElementById('region-opacity-output').value = `${theme.opacity}%`; document.getElementById('region-frost-output').value = `${theme.frost}px`; document.getElementById('region-glow-output').value = `${theme.glowStrength}%`; document.getElementById('region-engrave-output').value = `${theme.engraveStrength}%`; document.getElementById('region-reflection-output').value = `${theme.metalReflection}%`;
}
function restoreRegionThemes() {
  try { regionThemes = JSON.parse(localStorage.getItem('malArchiveRegionThemes') || '{}'); } catch { regionThemes = {}; }
  if (regionThemes.visuals) regionThemes['file01-visuals'] ||= regionThemes.visuals; if (regionThemes.story) regionThemes['file01-story'] ||= regionThemes.story;
  for (let number = 1; number <= FILE_COUNT; number += 1) ['visuals','story'].forEach(panel => { const key = `file${pad(number)}-${panel}`; regionThemes[key] = { ...currentRegionDefaults(), ...(regionThemes[key] || {}) }; applyRegionTheme(key, false); }); loadRegionControls(regionControls.target.value);
}
function resetRegionThemes() { regionThemes = {}; localStorage.removeItem('malArchiveRegionThemes'); for (let number = 1; number <= FILE_COUNT; number += 1) ['visuals','story'].forEach(panel => { const key = `file${pad(number)}-${panel}`; regionThemes[key] = currentRegionDefaults(); applyRegionTheme(key, false); }); loadRegionControls(regionControls.target.value); }

function getSettings() { return Object.fromEntries(Object.entries(controls).map(([key,control]) => [key,control.value])); }
function applySettings() {
  root.style.setProperty('--page-bg', controls.pageColor.value); root.style.setProperty('--sheet-rgb', hexToRgb(controls.sheetColor.value)); root.style.setProperty('--ink', controls.inkColor.value); root.style.setProperty('--glow-rgb', hexToRgb(controls.glowColor.value)); root.style.setProperty('--sheet-opacity', String(Number(controls.opacity.value)/100)); root.style.setProperty('--sheet-frost', `${controls.frost.value}px`); root.style.setProperty('--glow-strength', String(Number(controls.glowStrength.value)/100)); root.style.setProperty('--engrave-strength', String(Number(controls.engraveStrength.value)/100)); root.style.setProperty('--metal-reflection', String(Number(controls.metalReflection.value)/100));
  root.style.setProperty('--formula-size', `${controls.formulaSize.value}px`); root.style.setProperty('--title-size', `${controls.titleSize.value}px`); root.style.setProperty('--masthead-width', `${controls.mastheadWidth.value}%`); root.style.setProperty('--masthead-ratio', controls.mastheadRatio.value); root.style.setProperty('--masthead-title-size', `${controls.mastheadTitleSize.value}px`); root.style.setProperty('--masthead-mobile-width', `${controls.mastheadMobileWidth.value}%`); root.style.setProperty('--masthead-mobile-title-size', `${controls.mastheadMobileTitleSize.value}px`); root.style.setProperty('--masthead-gap', `${controls.mastheadGap.value}px`); root.style.setProperty('--story-size', `${controls.storySize.value}px`); root.style.setProperty('--story-cn-size', `${controls.storyCnSize.value}px`); root.style.setProperty('--data-size', `${controls.dataSize.value}px`); root.style.setProperty('--ui-size', `${controls.uiSize.value}px`);
  masthead.dataset.material = controls.material.value; masthead.dataset.shape = controls.shape.value;
  const outputs = { 'opacity-output':`${controls.opacity.value}%`, 'frost-output':`${controls.frost.value}px`, 'glow-output':`${controls.glowStrength.value}%`, 'engrave-output':`${controls.engraveStrength.value}%`, 'reflection-output':`${controls.metalReflection.value}%`, 'formula-size-output':`${controls.formulaSize.value}px`, 'title-size-output':`${controls.titleSize.value}px`, 'masthead-width-output':`${controls.mastheadWidth.value}%`, 'masthead-title-size-output':`${controls.mastheadTitleSize.value}px`, 'masthead-mobile-width-output':`${controls.mastheadMobileWidth.value}%`, 'masthead-mobile-title-size-output':`${controls.mastheadMobileTitleSize.value}px`, 'masthead-gap-output':`${controls.mastheadGap.value}px`, 'story-size-output':`${controls.storySize.value}px`, 'story-cn-size-output':`${controls.storyCnSize.value}px`, 'data-size-output':`${controls.dataSize.value}px`, 'ui-size-output':`${controls.uiSize.value}px` };
  Object.entries(outputs).forEach(([id,value]) => { document.getElementById(id).value = value; }); localStorage.setItem('malArchiveSettings', JSON.stringify(getSettings()));
}
function setSettings(settings) { const migrated = { ...settings }; if (['columns','free'].includes(migrated.layout)) migrated.layout = 'grid'; Object.entries({ ...defaults, ...migrated }).forEach(([key,value]) => { if (controls[key]) controls[key].value = value; }); applySettings(); }

function showPanel(file, name) {
  activeFileId = file.dataset.fileId; file.querySelectorAll('.document-sheet').forEach(panel => { const active = panel.dataset.panel === name; panel.hidden = !active; panel.classList.toggle('is-active', active); }); file.querySelectorAll('.folder-tab').forEach(tab => { const active = tab.dataset.target === name; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); }); applyActiveZoneTheme(file, name);
}

function visualMarkup(index, fileId) { return `<img alt="Uploaded visual ${index + 1}" loading="lazy" decoding="async"><figcaption contenteditable="${authorMode}" spellcheck="false">FIG. ${fileLetter(fileId)}—${pad(index + 1)}</figcaption><button class="data-branch" type="button" data-action="data">DATA <small>${pad(index + 1)}</small></button>${controlsMarkup()}`; }
function createVisual(file, index, fileId, recordId = `record-${fileId}-${Date.now()}-${index}`) { const figure = document.createElement('figure'); figure.className = 'visual-item'; figure.dataset.recordId = recordId; figure.dataset.fileName = file.name; figure.dataset.blobKey = recordId; figure.style.setProperty('--visual-span','6'); figure.innerHTML = visualMarkup(index,fileId); figure.querySelector('img').src = URL.createObjectURL(file); return figure; }

let mediaDbPromise;
function openMediaDb() { if (mediaDbPromise) return mediaDbPromise; mediaDbPromise = new Promise((resolve,reject) => { const request = indexedDB.open('malArchiveMedia',1); request.onupgradeneeded = () => request.result.createObjectStore('files'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); return mediaDbPromise; }
async function storeBlob(key, blob) { try { const db = await openMediaDb(); db.transaction('files','readwrite').objectStore('files').put(blob,key); } catch { /* export still records filename */ } }
async function readBlob(key) { try { const db = await openMediaDb(); return await new Promise((resolve,reject) => { const request = db.transaction('files').objectStore('files').get(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); } catch { return null; } }
async function removeBlob(key) { try { const db = await openMediaDb(); db.transaction('files','readwrite').objectStore('files').delete(key); } catch { /* no-op */ } }

async function addUploadedVisuals(files, field) { if (!field) return; const file = field.closest('.archive-file'); const start = field.querySelectorAll('.visual-item').length; [...files].forEach((image,index) => { const figure = createVisual(image,start + index,file.dataset.fileId); field.append(figure); storeBlob(figure.dataset.blobKey,image); }); field.classList.add('is-editing'); showPanel(file,'visuals'); updateVisualCount(field); saveSections(); }
function fieldLayout(field) {
  return {
    rowHeight:Number(field.dataset.rowHeight || 28),
    gutter:Number(field.dataset.gutter || 4)
  };
}
function applyFieldLayout(field, layout = {}) {
  const rowHeight = Math.max(4, Number(layout.rowHeight ?? field.dataset.rowHeight ?? 28));
  const gutter = Math.max(0, Number(layout.gutter ?? field.dataset.gutter ?? 4));
  field.dataset.rowHeight = String(rowHeight); field.dataset.gutter = String(gutter);
  field.style.setProperty('--grid-row-height',`${Math.max(1,rowHeight / 14)}px`); field.style.setProperty('--grid-gutter',`${gutter}px`);
  const bar = field.closest('[data-panel]')?.querySelector('.visual-editor-bar');
  if (bar) { const row = bar.querySelector('[data-layout-setting="rowHeight"]'); const gap = bar.querySelector('[data-layout-setting="gutter"]'); if (row) row.value = String(rowHeight); if (gap) gap.value = String(gutter); }
  scheduleGeometry(field);
}
function layoutItem(item) {
  const field = item.closest('.visual-field'); if (!field || !field.clientWidth) return;
  const { rowHeight,gutter } = fieldLayout(field); const gridUnit = Math.max(1,rowHeight / 14); const span = Math.max(1,Math.min(12,Number(item.style.getPropertyValue('--visual-span') || 12)));
  const fieldStyle = getComputedStyle(field); const contentWidth = field.clientWidth - parseFloat(fieldStyle.paddingLeft || 0) - parseFloat(fieldStyle.paddingRight || 0);
  const column = Math.max(1,(contentWidth - gutter * 11) / 12); const width = column * span + gutter * (span - 1);
  const image = item.querySelector('img'); const ratio = item.classList.contains('video-item') ? 16/9 : image?.naturalWidth && image?.naturalHeight ? image.naturalWidth/image.naturalHeight : 1.35;
  const height = Math.max(24,width / ratio); const rowSpan = Math.max(1,Math.ceil((height + gutter) / (gridUnit + gutter)));
  item.style.setProperty('--grid-row-span',String(rowSpan)); item.style.gridRowEnd = `span ${rowSpan}`;
}
let geometryFrame = 0;
function scheduleGeometry(scope = document) { cancelAnimationFrame(geometryFrame); geometryFrame = requestAnimationFrame(() => { (scope.matches?.('.visual-item') ? [scope] : scope.querySelectorAll('.visual-item')).forEach(layoutItem); refreshPhonePreview(); }); }
function updateVisualCount(field) { const items = [...field.querySelectorAll('.visual-item')]; const count = field.closest('[data-panel]').querySelector('.visual-count'); if (count) count.textContent = `${pad(items.length)} MEDIA ${items.length === 1 ? 'RECORD' : 'RECORDS'}`; items.forEach((item,index) => { item.style.setProperty('--item-index',String(index + 1)); item.draggable = field.classList.contains('is-editing'); const branch = item.querySelector('.data-branch small'); if (branch) branch.textContent = pad(index + 1); const span = item.style.getPropertyValue('--visual-span').trim() || '12'; item.querySelector('.span-readout')?.replaceChildren(`COL ${pad(span)}`); item.querySelectorAll('[data-action="size"]').forEach(button => button.classList.toggle('is-selected',button.dataset.span === span)); }); scheduleGeometry(field); }

function normalizeVideoUrl(value) {
  let source = value.trim(); if (!source) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(source)) return { source:`https://www.youtube.com/watch?v=${source}`, embed:`https://www.youtube.com/embed/${source}?playsinline=1&rel=0`, poster:`https://i.ytimg.com/vi/${source}/hqdefault.jpg`, provider:'youtube' };
  const copiedUrl = source.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  if (copiedUrl) source = copiedUrl;
  if (!/^https?:\/\//i.test(source) && /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|vimeo\.com)\//i.test(source)) source = `https://${source}`;
  try {
    const url = new URL(source); const host = url.hostname.toLowerCase().replace(/^www\./,''); let id = '';
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) id = url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] || '';
    id = id.replace(/[^a-zA-Z0-9_-].*$/,'');
    if (/^[a-zA-Z0-9_-]{6,}$/.test(id)) return { source:url.href, embed:`https://www.youtube.com/embed/${id}?playsinline=1&rel=0`, poster:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, provider:'youtube' };
    if (host.endsWith('vimeo.com')) { const match = url.pathname.match(/\/(?:video\/)?(\d+)/); if (match) return { source:url.href, embed:`https://player.vimeo.com/video/${match[1]}`, poster:'', provider:'vimeo' }; }
  } catch { return null; }
  return null;
}
function renderVideoItem(item) {
  const frame = item.querySelector('.video-frame'); const video = normalizeVideoUrl(item.dataset.videoUrl || ''); const poster = item.dataset.posterUrl || video?.poster || '';
  if (!video && !poster) { frame.innerHTML = '<button class="video-placeholder" type="button" data-action="video">ADD VIMEO / YOUTUBE LINK <small>PASTE A PUBLIC OR UNLISTED URL</small></button>'; return; }
  const image = poster ? `<img class="video-poster-image" src="${poster}" alt="Custom video cover">` : '<span class="video-poster-signal" aria-hidden="true"></span>';
  frame.innerHTML = `${image}<button class="video-play" type="button" data-action="${video ? 'play-video' : 'video'}"><span>${video ? 'PLAY RECORD' : 'ADD VIDEO LINK'}</span><small>${video?.provider?.toUpperCase() || 'CUSTOM COVER'}</small></button>${video ? `<button class="video-link-control" type="button" data-action="video">EDIT LINK</button><a class="video-source-link" href="${video.source}" target="_blank" rel="noreferrer">OPEN SOURCE ↗</a>` : ''}`;
}
function renderVideoPlayer(item) {
  const frame = item.querySelector('.video-frame'); const video = normalizeVideoUrl(item.dataset.videoUrl || ''); if (!video) return;
  frame.innerHTML = `<iframe src="${video.embed}" title="Embedded artwork video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe><button class="video-link-control" type="button" data-action="video">EDIT LINK</button><button class="video-poster-return" type="button" data-action="show-poster">COVER</button><a class="video-source-link" href="${video.source}" target="_blank" rel="noreferrer">OPEN SOURCE ↗</a>`;
}

function defaultRecord(figure) { const isFirst = figure.dataset.recordId === 'record-01'; return { title:isFirst ? 'v = fλ' : 'WORK TITLE / FORMULA TRACE', year:'NOT YET CATALOGUED', medium:'DIGITAL IMAGE', material:'NOT YET CATALOGUED', software:'NOT YET CATALOGUED', notes:'' }; }
function renderRecordMedia(id) { recordMedia.innerHTML = ''; (recordMediaStore[id] || []).forEach(item => { const image = document.createElement('img'); image.src = item.url; image.alt = item.name; recordMedia.append(image); }); }
function openRecord(figure) { activeRecordFigure = figure; const field = figure.closest('.visual-field'); const index = [...field.querySelectorAll('.visual-item:not(.video-item)')].indexOf(figure) + 1; const id = figure.dataset.recordId; const record = { ...defaultRecord(figure), ...(recordStore[id] || {}) }; document.getElementById('record-number').textContent = `DATA / ${pad(index)}`; document.getElementById('record-preview').src = figure.querySelector('img').src; Object.entries(recordInputs).forEach(([key,input]) => { input.value = record[key] || ''; }); renderRecordMedia(id); recordDialog.showModal(); }
function saveRecord() { if (!activeRecordFigure) return; const id = activeRecordFigure.dataset.recordId; recordStore[id] = Object.fromEntries(Object.entries(recordInputs).map(([key,input]) => [key,input.value])); localStorage.setItem('malArchiveRecords',JSON.stringify(recordStore)); }

function getMastheadInfo() { return { titleEnglish:document.getElementById('masthead-title-en').innerHTML, titleChinese:document.getElementById('masthead-title-cn').innerHTML, intro:document.getElementById('masthead-intro').innerHTML, email:document.getElementById('contact-email').textContent.trim(), instagram:document.getElementById('contact-instagram').textContent.trim(), website:document.getElementById('contact-website').textContent.trim() }; }
function contactHref(type,value) { const text = value.trim(); if (!text || text.startsWith('ADD ')) return '#'; if (type === 'email') return text.includes('@') ? `mailto:${text}` : '#'; return /^(https?:\/\/)/i.test(text) ? text : `https://${text.replace(/^@/,type === 'instagram' ? 'instagram.com/' : '')}`; }
function updateContactLinks() { ['email','instagram','website'].forEach(type => { const link = document.getElementById(`contact-${type}`); link.href = contactHref(type,link.textContent); if (type !== 'email' && link.getAttribute('href') !== '#') { link.target = '_blank'; link.rel = 'noreferrer'; } }); }
function saveMastheadInfo() { localStorage.setItem('malArchiveMasthead',JSON.stringify(getMastheadInfo())); updateContactLinks(); }
function restoreMastheadInfo() { try { const saved = JSON.parse(localStorage.getItem('malArchiveMasthead') || '{}'); if (saved.titleEnglish !== undefined) document.getElementById('masthead-title-en').innerHTML = saved.titleEnglish; if (saved.titleChinese !== undefined) document.getElementById('masthead-title-cn').innerHTML = saved.titleChinese; if (saved.intro !== undefined) document.getElementById('masthead-intro').innerHTML = saved.intro; ['email','instagram','website'].forEach(type => { if (saved[type] !== undefined) document.getElementById(`contact-${type}`).textContent = saved[type]; }); } catch { /* keep published content */ } updateContactLinks(); }
function showMastheadPanel(name) { const same = masthead.classList.contains('is-open') && masthead.dataset.openPanel === name; masthead.classList.toggle('is-open',!same); masthead.dataset.openPanel = same ? '' : name; mastheadExtension.setAttribute('aria-hidden',String(same)); document.querySelectorAll('[data-info-panel]').forEach(panel => { panel.hidden = panel.dataset.infoPanel !== name; }); mastheadTabs.forEach((tab,index) => { const active = !same && tab.dataset.mastheadPanel === name; tab.classList.toggle('is-active',active); tab.setAttribute('aria-expanded',String(active)); if (active) document.getElementById('masthead-panel-code').textContent = `${name.toUpperCase()} / 0${index + 1}`; }); }
function closeMastheadPanel() { masthead.classList.remove('is-open'); masthead.dataset.openPanel = ''; mastheadExtension.setAttribute('aria-hidden','true'); mastheadTabs.forEach(tab => { tab.classList.remove('is-active'); tab.setAttribute('aria-expanded','false'); }); }

const springTraces = [
  ['RESIDUAL BLOOM RETAINED', '残余花期仍在信号中'],
  ['CONTAINMENT OPEN / PRESSURE RELEASED', '封闭解除，休眠信号开始外溢'],
  ['LIQUID THRESHOLD EXCEEDED', '液态阈值已越界'],
  ['REPEATED CONTACT DETECTED', '检测到反复接触留下的磨损'],
  ['FRACTURE REBINDING IN PROGRESS', '裂隙正在重新连接']
];
function selectSpring(button) {
  const module = button.closest('.spring-selector'); const index = Number(button.dataset.springIndex) || 0;
  module.querySelectorAll('.spring-option').forEach(option => { const active = option === button; option.classList.toggle('is-selected',active); option.setAttribute('aria-checked',String(active)); });
  const result = module.querySelector('.spring-result'); result.classList.remove('is-active'); void result.offsetWidth;
  result.querySelector('span').textContent = button.querySelector('span').textContent;
  result.querySelector('strong').textContent = button.querySelector('small').textContent;
  result.querySelector('.spring-response').innerHTML = `${springTraces[index][0]}<br><em>${springTraces[index][1]}</em>`;
  result.querySelector('small').textContent = `SPRING SPECIMEN / ${pad(index + 1)} / TRACE LOCKED`;
  result.style.setProperty('--spring-level',`${20 + index * 18}%`); result.dataset.springIndex = String(index); result.classList.add('is-active');
  if (!isRestoringSections) saveSections();
}

function collectSections() {
  return [...document.querySelectorAll('body > main .archive-file')].map(file => { const field = file.querySelector('.visual-field'); return { id:file.dataset.fileId, formula:file.querySelector('h1').innerHTML, title:file.querySelector('.work-title').innerHTML, storyEnglish:file.querySelector('[data-story="english"]').innerHTML, storyChinese:file.querySelector('[data-story="chinese"]').innerHTML, layout:[...field.classList].find(name => name.startsWith('layout-'))?.replace('layout-','') || 'grid', rowHeight:fieldLayout(field).rowHeight, gutter:fieldLayout(field).gutter, springTitle:file.querySelector('.spring-selector h2')?.innerHTML || null, springChinese:file.querySelector('.spring-selector > header > p:last-child')?.innerHTML || null, springSelection:file.querySelector('.spring-option.is-selected')?.dataset.springIndex ?? null, media:[...field.querySelectorAll('.visual-item')].map((item,index) => ({ type:item.classList.contains('video-item') ? 'video' : 'image', order:index + 1, recordId:item.dataset.recordId, file:item.dataset.fileName || item.querySelector('img')?.getAttribute('src') || '', blobKey:item.dataset.blobKey || '', assetPath:item.dataset.assetPath || '', videoUrl:item.dataset.videoUrl || '', posterBlobKey:item.dataset.posterKey || '', posterFileName:item.dataset.posterName || '', posterAssetPath:item.dataset.posterAssetPath || '', rowWidth:Number(item.style.getPropertyValue('--visual-span') || 12), caption:item.querySelector('figcaption')?.innerHTML || '', data:item.classList.contains('video-item') ? null : (recordStore[item.dataset.recordId] || defaultRecord(item)), referenceImages:(recordMediaStore[item.dataset.recordId] || []).map(media => media.name) })) }; });
}
function saveSections() { localStorage.setItem('malArchiveSections',JSON.stringify(collectSections())); }

async function restoreSections() {
  isRestoringSections = true;
  let saved = null; try { saved = JSON.parse(localStorage.getItem('malArchiveSections') || 'null'); } catch { saved = null; }
  if (!Array.isArray(saved)) { try { const legacy = JSON.parse(localStorage.getItem('malArchiveText') || '{}'); const first = fileElement('01'); if (legacy.formula !== undefined) first.querySelector('h1').innerHTML = legacy.formula; if (legacy.title !== undefined) first.querySelector('.work-title').innerHTML = legacy.title; if (legacy.english !== undefined) first.querySelector('[data-story="english"]').innerHTML = legacy.english; if (legacy.chinese !== undefined) first.querySelector('[data-story="chinese"]').innerHTML = legacy.chinese; } catch { /* keep current content */ } document.querySelectorAll('.visual-field').forEach(updateVisualCount); isRestoringSections = false; return; }
  for (const state of saved) {
    const file = fileElement(state.id); if (!file) continue; file.querySelector('h1').innerHTML = state.formula; file.querySelector('.work-title').innerHTML = state.title; file.querySelector('[data-story="english"]').innerHTML = state.storyEnglish; file.querySelector('[data-story="chinese"]').innerHTML = state.storyChinese;
    const field = file.querySelector('.visual-field'); field.innerHTML = ''; [...field.classList].filter(name => name.startsWith('layout-')).forEach(name => field.classList.remove(name)); field.classList.add(`layout-${state.layout || 'grid'}`); applyFieldLayout(field,{ rowHeight:state.rowHeight ?? 28,gutter:state.gutter ?? 4 });
    for (const media of state.media || []) {
      if (media.type === 'video') { const holder = document.createElement('div'); holder.innerHTML = videoMarkup(state.id,media.order); const item = holder.firstElementChild; item.dataset.recordId = media.recordId; item.dataset.videoUrl = media.videoUrl || ''; item.dataset.posterKey = media.posterBlobKey || ''; item.dataset.posterName = media.posterFileName || ''; item.dataset.posterAssetPath = media.posterAssetPath || ''; if (item.dataset.posterKey) { const posterBlob = await readBlob(item.dataset.posterKey); if (posterBlob) item.dataset.posterUrl = URL.createObjectURL(posterBlob); else if (item.dataset.posterAssetPath) item.dataset.posterUrl = item.dataset.posterAssetPath; } else if (item.dataset.posterAssetPath) item.dataset.posterUrl = item.dataset.posterAssetPath; item.style.setProperty('--visual-span',String(media.rowWidth || 12)); item.querySelector('figcaption').innerHTML = media.caption; field.append(item); renderVideoItem(item); continue; }
      const figure = document.createElement('figure'); figure.className = 'visual-item'; figure.dataset.recordId = media.recordId; figure.dataset.fileName = media.file || ''; figure.dataset.blobKey = media.blobKey || ''; figure.dataset.assetPath = media.assetPath || ''; figure.style.setProperty('--visual-span',String(media.rowWidth || 12)); figure.innerHTML = visualMarkup(media.order - 1,state.id); figure.querySelector('figcaption').innerHTML = media.caption; const image = figure.querySelector('img');
      if (media.blobKey) { const blob = await readBlob(media.blobKey); if (blob) image.src = URL.createObjectURL(blob); else if (media.assetPath) image.src = media.assetPath; else { image.removeAttribute('src'); image.alt = `Re-select original image: ${media.file}`; figure.classList.add('is-missing-media'); } } else image.src = media.assetPath || media.file; field.append(figure);
    }
    const springTitle = file.querySelector('.spring-selector h2'); const springChinese = file.querySelector('.spring-selector > header > p:last-child'); if (springTitle && state.springTitle !== null) springTitle.innerHTML = state.springTitle; if (springChinese && state.springChinese !== null) springChinese.innerHTML = state.springChinese;
    if (state.springSelection !== null && state.springSelection !== undefined) { const option = file.querySelector(`.spring-option[data-spring-index="${state.springSelection}"]`); if (option) selectSpring(option); } updateVisualCount(field);
  }
  isRestoringSections = false;
}

function projectPayload() {
  saveMastheadInfo(); saveRecord(); saveSections(); const sections = collectSections();
  return { version:4, exportedAt:new Date().toISOString(), settings:getSettings(), regionThemes, masthead:getMastheadInfo(), sections, originalFilesRequired:[...new Set(sections.flatMap(section => section.media.flatMap(media => media.type === 'image' && media.blobKey ? [media.file] : media.type === 'video' && media.posterBlobKey ? [media.posterFileName] : [])))], note:'Complete ZIP exports include every image currently stored by the editor. JSON-only exports still require RELINK IMAGES.' };
}

function exportLayout() {
  const payload = projectPayload();
  const blob = new Blob([JSON.stringify(payload,null,2)],{ type:'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'mal-archive-project.json'; link.click(); URL.revokeObjectURL(link.href); document.getElementById('copy-status').textContent = 'PROJECT FILE EXPORTED — SEND WITH ORIGINAL IMAGES';
}

const crcTable = (() => { const table = new Uint32Array(256); for (let number = 0; number < 256; number += 1) { let crc = number; for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1; table[number] = crc >>> 0; } return table; })();
function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0; }
function zipDateTime(date = new Date()) { return { time:(date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2), date:((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate() }; }
function zipRecordView(size) { return new DataView(new ArrayBuffer(size)); }
function makeStoredZip(files) {
  const encoder = new TextEncoder(); const localParts = []; const centralParts = []; let offset = 0; const stamp = zipDateTime();
  for (const file of files) {
    const name = encoder.encode(file.name); const bytes = file.bytes; const crc = crc32(bytes); const local = zipRecordView(30);
    local.setUint32(0,0x04034b50,true); local.setUint16(4,20,true); local.setUint16(6,0x0800,true); local.setUint16(8,0,true); local.setUint16(10,stamp.time,true); local.setUint16(12,stamp.date,true); local.setUint32(14,crc,true); local.setUint32(18,bytes.length,true); local.setUint32(22,bytes.length,true); local.setUint16(26,name.length,true); local.setUint16(28,0,true);
    localParts.push(local.buffer,name,bytes); const central = zipRecordView(46);
    central.setUint32(0,0x02014b50,true); central.setUint16(4,20,true); central.setUint16(6,20,true); central.setUint16(8,0x0800,true); central.setUint16(10,0,true); central.setUint16(12,stamp.time,true); central.setUint16(14,stamp.date,true); central.setUint32(16,crc,true); central.setUint32(20,bytes.length,true); central.setUint32(24,bytes.length,true); central.setUint16(28,name.length,true); central.setUint16(30,0,true); central.setUint16(32,0,true); central.setUint16(34,0,true); central.setUint16(36,0,true); central.setUint32(38,0,true); central.setUint32(42,offset,true); centralParts.push(central.buffer,name); offset += 30 + name.length + bytes.length;
  }
  const centralSize = centralParts.reduce((sum,part) => sum + part.byteLength,0); const end = zipRecordView(22); end.setUint32(0,0x06054b50,true); end.setUint16(4,0,true); end.setUint16(6,0,true); end.setUint16(8,files.length,true); end.setUint16(10,files.length,true); end.setUint32(12,centralSize,true); end.setUint32(16,offset,true); end.setUint16(20,0,true); return new Blob([...localParts,...centralParts,end.buffer],{ type:'application/zip' });
}
function safeBundleName(name,fallback) { const cleaned = String(name || '').split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,''); return cleaned || fallback; }
async function exportCompleteProject() {
  const status = document.getElementById('copy-status'); const button = document.getElementById('export-complete-project'); button.disabled = true; status.textContent = 'PACKING PROJECT AND IMAGES…';
  try {
    const payload = projectPayload(); const files = []; const manifest = [];
    for (const section of payload.sections) for (const media of section.media || []) {
      const key = media.type === 'video' ? media.posterBlobKey : media.blobKey; const assetPath = media.type === 'video' ? media.posterAssetPath : media.assetPath; let blob = key ? await readBlob(key) : null; if (!blob && assetPath) { try { const response = await fetch(assetPath); if (response.ok) blob = await response.blob(); } catch { /* keep counting only available media */ } } if (!blob) continue;
      const original = media.type === 'video' ? media.posterFileName : media.file; const prefix = media.type === 'video' ? `${section.id}-video-${pad(media.order)}-cover` : `${section.id}-${pad(media.order)}`; const name = `media/${prefix}-${safeBundleName(original,'image')}`;
      files.push({ name, bytes:new Uint8Array(await blob.arrayBuffer()) }); manifest.push({ section:section.id, order:media.order, type:media.type === 'video' ? 'video-cover' : 'image', originalName:original, blobKey:key, bundledPath:name });
    }
    payload.bundledMedia = manifest; const encoder = new TextEncoder(); files.unshift({ name:'mal-archive-project.json', bytes:encoder.encode(JSON.stringify(payload,null,2)) },{ name:'READ-ME.txt', bytes:encoder.encode('This bundle contains the current Glass Archive project data and every image available in the browser editor. Send this single ZIP to continue the website or prepare GitHub publishing.') });
    const blob = makeStoredZip(files); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'mal-archive-complete-project.zip'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href),1000); status.textContent = `COMPLETE PACKAGE EXPORTED — ${manifest.length} MEDIA FILES INCLUDED`;
  } catch (error) { console.error(error); status.textContent = 'COMPLETE EXPORT FAILED — TRY AGAIN AFTER REOPENING THIS PAGE'; }
  finally { button.disabled = false; }
}

async function importProject(file) {
  const status = document.getElementById('copy-status');
  try {
    const payload = JSON.parse(await file.text()); if (!Array.isArray(payload.sections)) throw new Error('Missing sections');
    setSettings(payload.settings || defaults); regionThemes = payload.regionThemes || {}; localStorage.setItem('malArchiveRegionThemes',JSON.stringify(regionThemes)); restoreRegionThemes();
    localStorage.setItem('malArchiveMasthead',JSON.stringify(payload.masthead || {})); restoreMastheadInfo();
    recordStore = {}; payload.sections.forEach(section => (section.media || []).forEach(media => { if (media.recordId && media.data) recordStore[media.recordId] = media.data; })); localStorage.setItem('malArchiveRecords',JSON.stringify(recordStore));
    localStorage.setItem('malArchiveSections',JSON.stringify(payload.sections)); await restoreSections(); document.querySelectorAll('body > main .archive-file').forEach(fileElementNode => showPanel(fileElementNode,'visuals'));
    status.textContent = 'PROJECT IMPORTED — USE RELINK IMAGES TO RESTORE ORIGINALS'; refreshPhonePreview();
  } catch { status.textContent = 'PROJECT FILE COULD NOT BE READ'; }
}

function installBundledProject() {
  const payload = window.MAL_ARCHIVE_PROJECT;
  if (!payload || !Array.isArray(payload.sections)) return;
  try {
    const bundleKey = `complete:${payload.exportedAt || 'current'}`;
    if (localStorage.getItem('malArchiveBundleInstalled') === bundleKey) return;
    localStorage.setItem('malArchiveSettings',JSON.stringify(payload.settings || defaults));
    localStorage.setItem('malArchiveRegionThemes',JSON.stringify(payload.regionThemes || {}));
    localStorage.setItem('malArchiveMasthead',JSON.stringify(payload.masthead || {}));
    const records = {};
    payload.sections.forEach(section => (section.media || []).forEach(media => { if (media.recordId && media.data) records[media.recordId] = media.data; }));
    localStorage.setItem('malArchiveRecords',JSON.stringify(records));
    localStorage.setItem('malArchiveSections',JSON.stringify(payload.sections));
    localStorage.setItem('malArchiveBundleInstalled',bundleKey);
  } catch { /* keep the authored page available when browser storage is restricted */ }
}

async function relinkImages(files) {
  const byName = new Map([...files].map(file => [file.name,file])); let linked = 0;
  for (const figure of document.querySelectorAll('body > main .visual-item:not(.video-item)')) {
    const name = (figure.dataset.fileName || '').split('/').pop(); const file = byName.get(name); if (!file) continue;
    const key = figure.dataset.blobKey || figure.dataset.recordId; figure.dataset.blobKey = key; await storeBlob(key,file); const image = figure.querySelector('img'); image.src = URL.createObjectURL(file); image.alt = name; figure.classList.remove('is-missing-media'); linked += 1;
  }
  for (const item of document.querySelectorAll('body > main .video-item')) {
    const file = byName.get(item.dataset.posterName || ''); if (!file) continue;
    const key = item.dataset.posterKey || `${item.dataset.recordId}-poster`; item.dataset.posterKey = key; await storeBlob(key,file); item.dataset.posterUrl = URL.createObjectURL(file); renderVideoItem(item); linked += 1;
  }
  saveSections(); scheduleGeometry(); document.getElementById('copy-status').textContent = `${linked} IMAGE${linked === 1 ? '' : 'S'} RELINKED BY FILE NAME`;
}

function autoArrange(field) { const items = [...field.querySelectorAll('.visual-item')]; const patterns = { 1:[12], 2:[6,6], 3:[6,6,12], 4:[6,6,6,6], 5:[6,6,4,8,12], 6:[6,6,4,8,7,5], 7:[6,6,4,8,7,5,12], 8:[6,6,4,8,7,5,6,6], 9:[6,6,4,8,7,5,4,4,4], 10:[6,6,4,8,7,5,6,6,6,6], 11:[6,6,4,8,7,5,4,4,4,6,6], 12:[6,6,4,8,7,5,4,4,4,6,6,12], 13:[6,6,4,8,7,5,4,4,4,6,6,6,6] }; const pattern = patterns[items.length] || items.map((_,index) => [6,6,4,8,7,5][index % 6]); items.forEach((item,index) => item.style.setProperty('--visual-span',String(pattern[index]))); [...field.classList].filter(name => name.startsWith('layout-')).forEach(name => field.classList.remove(name)); field.classList.add('layout-grid'); updateVisualCount(field); saveSections(); }

let phoneRefreshTimer = 0;
function cleanPhoneClone(clone) {
  clone.classList.add('phone-canvas'); clone.removeAttribute('id'); clone.removeAttribute('aria-hidden'); clone.inert = false;
  clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id')); clone.querySelectorAll('[contenteditable]').forEach(node => node.removeAttribute('contenteditable'));
  clone.querySelectorAll('.visual-editor-bar,.story-editor-bar,.item-controls,.resize-slot,.video-cover-control').forEach(node => node.remove()); return clone;
}
function refreshPhonePreview() {
  if (!phonePreviewDock || phonePreviewDock.hidden) return; clearTimeout(phoneRefreshTimer); phoneRefreshTimer = setTimeout(() => {
    const main = document.querySelector('body > main'); if (!main) return; const clone = cleanPhoneClone(main.cloneNode(true)); phonePreviewViewport.replaceChildren(clone);
    const relayout = () => clone.querySelectorAll('.visual-item').forEach(layoutItem);
    requestAnimationFrame(() => requestAnimationFrame(relayout));
    clone.querySelectorAll('.visual-item img').forEach(image => { if (!image.complete) image.addEventListener('load',relayout,{ once:true }); });
  },80);
}
function setPreviewMode(mode) {
  document.body.dataset.previewMode = mode; document.querySelectorAll('[data-preview-mode]').forEach(button => button.classList.toggle('is-active',button.dataset.previewMode === mode));
  phonePreviewDock.hidden = mode === 'desktop'; phonePreviewDock.classList.toggle('is-split',mode === 'split'); phonePreviewDock.classList.toggle('is-phone-only',mode === 'phone'); refreshPhonePreview();
}

function beginResize(event,item) {
  const field = item.closest('.visual-field'); if (!field.classList.contains('is-editing')) return; event.preventDefault();
  const startX = event.clientX; const startSpan = Number(item.style.getPropertyValue('--visual-span') || 12); const unit = (field.clientWidth + fieldLayout(field).gutter) / 12;
  const move = moveEvent => { const span = Math.max(1,Math.min(12,Math.round(startSpan + (moveEvent.clientX-startX)/unit))); item.style.setProperty('--visual-span',String(span)); updateVisualCount(field); };
  const end = () => { window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',end); saveSections(); };
  window.addEventListener('pointermove',move); window.addEventListener('pointerup',end,{ once:true });
}

mastheadTabs.forEach(tab => tab.addEventListener('click',() => showMastheadPanel(tab.dataset.mastheadPanel)));
const completeExportButton = document.createElement('button'); completeExportButton.type = 'button'; completeExportButton.className = 'secondary-control'; completeExportButton.id = 'export-complete-project'; completeExportButton.textContent = 'EXPORT COMPLETE PACKAGE'; document.getElementById('copy-settings').insertAdjacentElement('afterend',completeExportButton);
document.getElementById('close-masthead-info').addEventListener('click',closeMastheadPanel);
document.getElementById('edit-masthead-info').addEventListener('click',event => { const editing = mastheadExtension.classList.toggle('is-editing'); event.currentTarget.textContent = editing ? 'FINISH INFO' : 'EDIT INFO'; document.getElementById('masthead-intro').contentEditable = String(editing); document.querySelectorAll('.contact-panel a').forEach(link => { link.contentEditable = String(editing); }); if (!editing) saveMastheadInfo(); });
document.querySelectorAll('.contact-panel a').forEach(link => link.addEventListener('click',event => { if (link.contentEditable === 'true' || link.getAttribute('href') === '#') event.preventDefault(); }));
Object.values(controls).forEach(control => control.addEventListener('input',applySettings));
controls.layout.addEventListener('change',() => { const field = fileElement(activeFileId)?.querySelector('.visual-field'); if (!field) return; [...field.classList].filter(name => name.startsWith('layout-')).forEach(name => field.classList.remove(name)); field.classList.add(`layout-${controls.layout.value}`); updateVisualCount(field); saveSections(); });
regionControls.target.addEventListener('change',() => loadRegionControls(regionControls.target.value));
Object.entries(regionControls).filter(([key]) => key !== 'target').forEach(([,control]) => control.addEventListener('input',() => { const target = regionControls.target.value; regionThemes[target] = regionThemeFromControls(); applyRegionTheme(target); loadRegionControls(target); }));
document.getElementById('open-customizer').addEventListener('click',() => customizer.showModal());
document.getElementById('visual-upload').addEventListener('change',event => addUploadedVisuals(event.target.files,fileElement(activeFileId)?.querySelector('.visual-field')));
document.getElementById('reset-settings').addEventListener('click',() => { setSettings(defaults); resetRegionThemes(); });
document.getElementById('copy-settings').addEventListener('click',exportLayout);
completeExportButton.addEventListener('click',exportCompleteProject);
document.getElementById('import-project').addEventListener('change',event => { const file = event.target.files[0]; if (file) importProject(file); event.target.value = ''; });
document.getElementById('relink-images').addEventListener('change',event => { if (event.target.files.length) relinkImages(event.target.files); event.target.value = ''; });
document.getElementById('record-upload').addEventListener('change',event => { if (!activeRecordFigure) return; const id = activeRecordFigure.dataset.recordId; recordMediaStore[id] ||= []; [...event.target.files].forEach(file => recordMediaStore[id].push({ name:file.name,url:URL.createObjectURL(file) })); renderRecordMedia(id); });
document.getElementById('save-record').addEventListener('click',saveRecord);
document.querySelectorAll('[data-preview-mode]').forEach(button => button.addEventListener('click',() => setPreviewMode(button.dataset.previewMode)));
document.getElementById('close-phone-preview').addEventListener('click',() => setPreviewMode('desktop'));

document.addEventListener('change',event => { if (event.target.matches('.visual-upload-inline')) addUploadedVisuals(event.target.files,event.target.closest('[data-panel]').querySelector('.visual-field')); if (event.target.matches('.video-cover-upload')) { const image = event.target.files[0]; const item = event.target.closest('.video-item'); if (image && item) { const key = item.dataset.posterKey || `${item.dataset.recordId}-poster`; item.dataset.posterKey = key; item.dataset.posterName = image.name; item.dataset.posterUrl = URL.createObjectURL(image); storeBlob(key,image); renderVideoItem(item); saveSections(); scheduleGeometry(item); } event.target.value = ''; } if (event.target.matches('[data-layout-setting]')) { const field = event.target.closest('[data-panel]').querySelector('.visual-field'); applyFieldLayout(field,{ [event.target.dataset.layoutSetting]:event.target.value }); saveSections(); } });
document.addEventListener('load',event => { if (event.target.matches('body > main .visual-item img')) scheduleGeometry(event.target.closest('.visual-item')); },true);
document.addEventListener('pointerdown',event => { const handle = event.target.closest('body > main .resize-slot'); if (handle) beginResize(event,handle.closest('.visual-item')); });
document.addEventListener('dragstart',event => { const item = event.target.closest('body > main .visual-item'); if (!item || !item.closest('.visual-field').classList.contains('is-editing')) { event.preventDefault(); return; } draggedItem = item; item.classList.add('is-dragging'); event.dataTransfer.effectAllowed = 'move'; });
document.addEventListener('dragover',event => { const item = event.target.closest('body > main .visual-item'); if (!draggedItem || !item || item === draggedItem || item.closest('.visual-field') !== draggedItem.closest('.visual-field')) return; event.preventDefault(); const box = item.getBoundingClientRect(); const after = event.clientY > box.top + box.height/2 || (Math.abs(event.clientY-(box.top+box.height/2)) < box.height*.25 && event.clientX > box.left+box.width/2); item.parentElement.insertBefore(draggedItem,after ? item.nextSibling : item); });
document.addEventListener('dragend',() => { if (!draggedItem) return; const field = draggedItem.closest('.visual-field'); draggedItem.classList.remove('is-dragging'); draggedItem = null; updateVisualCount(field); saveSections(); });
document.addEventListener('click',event => {
  const tab = event.target.closest('.folder-tab'); if (tab) { showPanel(tab.closest('.archive-file'),tab.dataset.target); return; }
  const spring = event.target.closest('.spring-option'); if (spring) { const previewFile = spring.closest('.phone-canvas .archive-file'); if (previewFile) { const original = fileElement(previewFile.dataset.fileId)?.querySelector(`.spring-option[data-spring-index="${spring.dataset.springIndex}"]`); if (original) { selectSpring(original); refreshPhonePreview(); } } else selectSpring(spring); return; }
  const actionElement = event.target.closest('[data-action]'); if (!actionElement) return; const action = actionElement.dataset.action; const file = actionElement.closest('.archive-file'); if (file) activeFileId = file.dataset.fileId;
  if (action === 'edit-layout') { const field = file.querySelector('.visual-field'); const editing = field.classList.toggle('is-editing'); actionElement.textContent = editing ? 'FINISH LAYOUT' : 'EDIT LAYOUT'; updateVisualCount(field); return; }
  if (action === 'auto-arrange') { autoArrange(file.querySelector('.visual-field')); return; }
  if (action === 'edit-story') { const editing = actionElement.dataset.editing !== 'true'; actionElement.dataset.editing = String(editing); actionElement.textContent = editing ? 'FINISH STORY TEXT' : 'EDIT STORY TEXT'; file.querySelectorAll('.story-record').forEach(record => { record.contentEditable = String(editing); }); if (!editing) saveSections(); return; }
  const item = actionElement.closest('.visual-item'); if (!item) return; const field = item.closest('.visual-field');
  if (action === 'data' && !item.classList.contains('video-item')) openRecord(item);
  if (action === 'video') { const next = prompt('Paste a public or unlisted Vimeo / YouTube URL:',item.dataset.videoUrl || ''); if (next === null) return; if (next && !normalizeVideoUrl(next)) { alert('This link is not recognized. Please use a full Vimeo or YouTube URL.'); return; } item.dataset.videoUrl = next.trim(); renderVideoItem(item); saveSections(); }
  if (action === 'play-video') { const video = normalizeVideoUrl(item.dataset.videoUrl || ''); if (!video) return; if (location.protocol === 'file:') { window.open(video.source,'_blank','noopener'); } else renderVideoPlayer(item); }
  if (action === 'show-poster') renderVideoItem(item);
  if (action === 'up' && item.previousElementSibling) field.insertBefore(item,item.previousElementSibling);
  if (action === 'down' && item.nextElementSibling) field.insertBefore(item.nextElementSibling,item);
  if (action === 'size') { item.style.setProperty('--visual-span',actionElement.dataset.span); [...field.classList].filter(name => name.startsWith('layout-')).forEach(name => field.classList.remove(name)); field.classList.add('layout-grid'); }
  if (action === 'resize') return;
  if (action === 'remove') { if (item.dataset.blobKey) removeBlob(item.dataset.blobKey); if (item.dataset.posterKey) removeBlob(item.dataset.posterKey); item.remove(); }
  updateVisualCount(field); saveSections();
});

document.addEventListener('input',event => { if (!event.target.matches('[contenteditable="true"]')) return; if (event.target.closest('.archive-masthead')) saveMastheadInfo(); else saveSections(); });

function tickClock() { document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-GB',{ hour12:false }); }
installBundledProject();
try { recordStore = JSON.parse(localStorage.getItem('malArchiveRecords') || '{}'); } catch { recordStore = {}; }
try { setSettings(JSON.parse(localStorage.getItem('malArchiveSettings') || 'null') || defaults); } catch { setSettings(defaults); }
restoreRegionThemes(); restoreMastheadInfo(); restoreSections().then(() => { document.querySelectorAll('body > main .archive-file').forEach(file => showPanel(file,'visuals')); document.querySelectorAll('body > main .visual-field').forEach(field => applyFieldLayout(field)); scheduleGeometry(); }); tickClock(); setInterval(tickClock,1000); window.addEventListener('resize',() => scheduleGeometry());
