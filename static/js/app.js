// Label Creator client script (clean implementation)
const labelsList = document.getElementById('labels')
const addLabelBtn = document.getElementById('addLabelBtn')
const labelText = document.getElementById('labelText')
const labelImage = document.getElementById('labelImage')
const layoutSelect = document.getElementById('layoutSelect')
const colsInput = document.getElementById('colsInput')
const rowsInput = document.getElementById('rowsInput')
const generateBtn = document.getElementById('generateBtn')
const printBtn = document.getElementById('printBtn')
const clearAllBtn = document.getElementById('clearAllBtn')
const sheet = document.getElementById('sheet')
const pageSize = document.getElementById('pageSize')
const marginPreset = document.getElementById('marginPreset')
const customMargins = document.getElementById('customMargins')
const marginTop = document.getElementById('marginTop')
const marginRight = document.getElementById('marginRight')
const marginBottom = document.getElementById('marginBottom')
const marginLeft = document.getElementById('marginLeft')
const dynamicStyle = document.getElementById('dynamicStyle')
const borderStyle = document.getElementById('borderStyle')
const imagePosition = document.getElementById('imagePosition')
const labelHeightMode = document.getElementById('labelHeightMode')
const labelHeightCustom = document.getElementById('labelHeightCustom')
const fontSizeRange = document.getElementById('fontSizeRange')
const fontSizeLabel = document.getElementById('fontSizeLabel')
const fontSelect = document.getElementById('fontSelect')

const FONT_KEY = 'labelcreator.fontFamily'

function applyFontFamily(v){
  if (!v) return
  document.documentElement.style.setProperty('--label-font-family', v)
}

// restore font selection from storage (synchronous)
try{
  const savedFont = localStorage.getItem(FONT_KEY)
  if (savedFont){
    applyFontFamily(savedFont)
    if (fontSelect) fontSelect.value = savedFont
  }
}catch(e){ console.warn('restore font failed', e) }

if (fontSelect){
  fontSelect.addEventListener('change', ()=>{
    const v = fontSelect.value
    applyFontFamily(v)
    try{ localStorage.setItem(FONT_KEY, v) }catch(e){ console.warn('save font failed', e) }
  })
}

// layout visibility toggles: hide preset when custom values are used, and vice-versa
const layoutLabel = layoutSelect ? layoutSelect.closest('label') : null
const colsLabel = colsInput ? colsInput.closest('label') : null
const rowsLabel = rowsInput ? rowsInput.closest('label') : null

function isUsingPreset(){
  if (!layoutSelect || !colsInput || !rowsInput) return true
  // if user explicitly selected the 'custom' option, treat as custom
  if (layoutSelect.value === 'custom') return false
  const opt = layoutSelect.selectedOptions[0]
  const presetCols = opt && opt.dataset && opt.dataset.cols ? String(opt.dataset.cols).trim() : null
  const presetRows = opt && opt.dataset && opt.dataset.rows ? String(opt.dataset.rows).trim() : null
  const valCols = String(colsInput.value || '').trim()
  const valRows = String(rowsInput.value || '').trim()
  // if both sides are numeric, compare numerically, otherwise compare trimmed strings
  const colsMatch = (presetCols !== null && valCols !== '') ? (Number(presetCols) === Number(valCols)) : (valCols === (presetCols || ''))
  const rowsMatch = (presetRows !== null && valRows !== '') ? (Number(presetRows) === Number(valRows)) : (valRows === (presetRows || ''))
  return colsMatch && rowsMatch
}

function updateLayoutVisibility(){
  // if 'custom' is actively selected, keep the preset select visible but also show custom inputs
  if (layoutSelect && layoutSelect.value === 'custom'){
    if (layoutLabel) layoutLabel.style.display = ''
    if (colsLabel) colsLabel.style.display = ''
    if (rowsLabel) rowsLabel.style.display = ''
    return
  }

  const preset = isUsingPreset()
  if (layoutLabel) layoutLabel.style.display = preset ? '' : 'none'
  if (colsLabel) colsLabel.style.display = preset ? 'none' : ''
  if (rowsLabel) rowsLabel.style.display = preset ? 'none' : ''
}

if (layoutSelect){
  layoutSelect.addEventListener('change', ()=>{
    // when a preset is chosen, reset custom inputs to match preset and hide them
    const opt = layoutSelect.selectedOptions[0]
    if (opt && opt.dataset && layoutSelect.value !== 'custom'){
      if (colsInput) colsInput.value = opt.dataset.cols || ''
      if (rowsInput) rowsInput.value = opt.dataset.rows || ''
    }
    updateLayoutVisibility()
  })
}

if (colsInput) colsInput.addEventListener('input', ()=> updateLayoutVisibility())
if (rowsInput) rowsInput.addEventListener('input', ()=> updateLayoutVisibility())

// --- Optimize layout UI elements ---
const optimizeImageInput = document.getElementById('optimizeImageInput')
const optimizePreview = document.getElementById('optimizePreview')
const optimizeScale = document.getElementById('optimizeScale')
const optimizeScaleLabel = document.getElementById('optimizeScaleLabel')
const optimizeGap = document.getElementById('optimizeGap')
const optimizeAnalyzeBtn = document.getElementById('optimizeAnalyzeBtn')
const optimizeAutoBtn = document.getElementById('optimizeAutoBtn')
const optimizeGenerateBtn = document.getElementById('optimizeGenerateBtn')
const optimizeInfo = document.getElementById('optimizeInfo')
const optimizePrintBtn = document.getElementById('optimizePrintBtn')

let optimizeImageData = null
let optimizeAspect = 1

// optimizeScale now represents target tile width in millimetres
if (optimizeScale){
  optimizeScale.addEventListener('input', ()=>{
    const v = Number(optimizeScale.value)
    if (optimizeScaleLabel) optimizeScaleLabel.textContent = v.toFixed(0) + ' mm'
  })
  // initialize label
  if (optimizeScaleLabel) optimizeScaleLabel.textContent = (Number(optimizeScale.value)||50) + ' mm'
}

if (optimizeImageInput){
  optimizeImageInput.addEventListener('change', (e)=>{
    const f = (e.target.files && e.target.files[0]) || null
    if (!f) return
    const r = new FileReader()
    r.onload = ()=>{
      optimizeImageData = r.result
      if (optimizePreview) optimizePreview.src = optimizeImageData
      // determine aspect ratio
      const img = new Image()
      img.onload = ()=>{ optimizeAspect = img.height / img.width }
      img.src = optimizeImageData
      // persist the selected image and settings
      saveOptimize().catch(e=>console.warn('saveOptimize failed', e))
    }
    r.readAsDataURL(f)
  })
}
 
// Mode switching: show/hide controls depending on selected generation mode

let optimizeImageKey = null
const OPT_KEY = 'labelcreator.optimize'

async function saveOptimize(){
  try{
    const meta = { targetWidth: Number(optimizeScale ? optimizeScale.value : 50) || 50, gap: Number(optimizeGap ? optimizeGap.value : 6) || 6, imageKey: null }
    // store image data in IndexedDB and keep key
    if (optimizeImageData){
      try{
        const key = await storeImage(optimizeImageData)
        // delete previous key if different
        if (optimizeImageKey && optimizeImageKey !== key){
          try{ await deleteImage(optimizeImageKey) }catch(e){/* ignore */}
        }
        optimizeImageKey = key
        meta.imageKey = key
      }catch(e){ console.warn('saveOptimize: storeImage failed', e) }
    } else if (optimizeImageKey){
      meta.imageKey = optimizeImageKey
    }
    try{ localStorage.setItem(OPT_KEY, JSON.stringify(meta)) }catch(e){ console.warn('saveOptimize: localStorage failed', e) }
  }catch(e){ console.warn('saveOptimize failed', e) }
}

async function loadOptimize(){
  try{
    const s = localStorage.getItem(OPT_KEY)
    if (!s) return
    const meta = JSON.parse(s)
    if (!meta) return
    if (typeof meta.targetWidth !== 'undefined' && optimizeScale) optimizeScale.value = meta.targetWidth
    if (optimizeScaleLabel) optimizeScaleLabel.textContent = (Number(optimizeScale.value)||50) + ' mm'
    if (typeof meta.gap !== 'undefined' && optimizeGap) optimizeGap.value = meta.gap
    if (meta.imageKey){
      try{
        const data = await getImage(meta.imageKey)
        if (data){
          optimizeImageData = data
          optimizeImageKey = meta.imageKey
          if (optimizePreview) optimizePreview.src = optimizeImageData
          const img = new Image()
          img.onload = ()=>{ optimizeAspect = img.height / img.width }
          img.src = optimizeImageData
        }
      }catch(e){ console.warn('loadOptimize: getImage failed', e) }
    }
  }catch(e){ console.warn('loadOptimize failed', e) }
}
function updateModeVisibility(){
  const useOptimize = (document.getElementById('modeOptimize') && document.getElementById('modeOptimize').checked)
  const labelModeEls = document.querySelectorAll('.label-mode')
  if (useOptimize){
    // hide all label-mode controls when using Optimize
    labelModeEls.forEach(e=>{ e.style.display = 'none' })
  } else {
    // restore per-control visibility by re-applying page/layout settings
    // this avoids overwriting visibility set by applyPageSettings() or updateLayoutVisibility()
    applyPageSettings()
    updateLayoutVisibility()
  }
  const optSec = document.getElementById('optimizeSection')
  if (optSec) optSec.style.display = useOptimize ? '' : 'none'
}

const modeLabels = document.getElementById('modeLabels')
const modeOptimize = document.getElementById('modeOptimize')
if (modeLabels) modeLabels.addEventListener('change', updateModeVisibility)
if (modeOptimize) modeOptimize.addEventListener('change', updateModeVisibility)

// Theme toggle
const themeToggle = document.getElementById('themeToggle')
const THEME_KEY = 'labelcreator.theme'
function applyTheme(t){
  if (t === 'dark') document.documentElement.setAttribute('data-theme','dark')
  else document.documentElement.removeAttribute('data-theme')
}
try{
  const saved = localStorage.getItem(THEME_KEY)
  if (saved) applyTheme(saved)
}catch(e){}
if (themeToggle){
  themeToggle.addEventListener('click', ()=>{
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    const next = current === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    try{ localStorage.setItem(THEME_KEY, next) }catch(e){}
  })
}

function analyzeLayout(targetWidthMm){
  // returns {cols, rows, tileW, tileH, count}
  const root = getComputedStyle(document.documentElement)
  const pageW = mm(root.getPropertyValue('--page-width') || '210mm')
  const pageH = mm(root.getPropertyValue('--page-height') || '297mm')
  const mTop = mm(root.getPropertyValue('--margin-top') || '10mm')
  const mRight = mm(root.getPropertyValue('--margin-right') || '10mm')
  const mBottom = mm(root.getPropertyValue('--margin-bottom') || '10mm')
  const mLeft = mm(root.getPropertyValue('--margin-left') || '10mm')
  const contentW = pageW - mLeft - mRight
  const contentH = pageH - mTop - mBottom
  const gap = Number(optimizeGap ? optimizeGap.value : 6) || 6

  const tileW = Number(targetWidthMm) || 0
  if (tileW <= 0) return { cols:0, rows:0, tileW:0, tileH:0, count:0 }
  const tileH = tileW * optimizeAspect
  const cols = Math.max(0, Math.floor((contentW + gap) / (tileW + gap)))
  const rows = Math.max(0, Math.floor((contentH + gap) / (tileH + gap)))
  const count = cols * rows
  return { cols, rows, tileW, tileH, count }
}

function showAnalyzeResult(res){
  if (!optimizeInfo) return
  if (!res || res.count===0){
    optimizeInfo.textContent = 'No layout fits the page with the current settings.'
    return
  }
  optimizeInfo.innerHTML = `Columns: ${res.cols}, Rows: ${res.rows}, Per page: ${res.count} — Tile: ${res.tileW.toFixed(1)}mm × ${res.tileH.toFixed(1)}mm` 
}

if (optimizeAnalyzeBtn){
  optimizeAnalyzeBtn.addEventListener('click', ()=>{
    const s = Number(optimizeScale ? optimizeScale.value : 1) || 1
    const res = analyzeLayout(s)
    showAnalyzeResult(res)
  })
}

if (optimizeAutoBtn){
  optimizeAutoBtn.addEventListener('click', ()=>{
    // search target widths between 10mm and content width to maximize count
    const root = getComputedStyle(document.documentElement)
    const pageW = mm(root.getPropertyValue('--page-width') || '210mm')
    const pageH = mm(root.getPropertyValue('--page-height') || '297mm')
    const mTop = mm(root.getPropertyValue('--margin-top') || '10mm')
    const mRight = mm(root.getPropertyValue('--margin-right') || '10mm')
    const mBottom = mm(root.getPropertyValue('--margin-bottom') || '10mm')
    const mLeft = mm(root.getPropertyValue('--margin-left') || '10mm')
    const contentW = pageW - mLeft - mRight
    let bestAll = { count:0, width:10, result:null }
    const maxWidth = Math.min( Math.floor(contentW), 200 )
    for (let w=10; w<=maxWidth; w+=1){
      const res = analyzeLayout(w)
      if (res.count > bestAll.count){ bestAll = { count: res.count, width: w, result: res } }
    }
    if (optimizeScale) optimizeScale.value = bestAll.width
    if (optimizeScaleLabel) optimizeScaleLabel.textContent = bestAll.width + ' mm'
    showAnalyzeResult(bestAll.result)
  })
}

async function generateOptimizedSheet(){
  if (!optimizeImageData) return alert('Select an image first')
  const targetW = Number(optimizeScale ? optimizeScale.value : 50) || 50
  const res = analyzeLayout(targetW)
  if (!res || res.count===0) return alert('No layout fits the page with current settings')
  const cols = res.cols, rows = res.rows
  sheet.innerHTML = ''
  sheet.style.gridTemplateColumns = `repeat(${cols}, ${res.tileW}mm)`
  sheet.style.gridTemplateRows = `repeat(${rows}, ${res.tileH}mm)`
  const count = cols * rows
  for (let i=0;i<count;i++){
    const item = document.createElement('div')
    item.className = 'label'
    item.style.width = `${res.tileW}mm`
    item.style.height = `${res.tileH}mm`
    const img = document.createElement('img')
    img.src = optimizeImageData
    img.className = 'label-img'
    // scale the image to fit the tile while preserving aspect
    img.style.maxHeight = '100%'
    img.style.maxWidth = '100%'
    item.appendChild(img)
    sheet.appendChild(item)
  }
}

if (optimizeGenerateBtn){ optimizeGenerateBtn.addEventListener('click', generateOptimizedSheet) }
if (optimizePrintBtn){
  optimizePrintBtn.addEventListener('click', ()=>{
    // ensure sheet is generated, then print after layout settles
    if (!sheet.children.length) generateOptimizedSheet()
    requestAnimationFrame(()=> requestAnimationFrame(()=> window.print()))
  })
}

// modal elements
const editModal = document.getElementById('editModal')
const modalLabelText = document.getElementById('modalLabelText')
const modalFontSize = document.getElementById('modalFontSize')
const modalFontSelect = document.getElementById('modalFontSelect')
const modalImagePosition = document.getElementById('modalImagePosition')
const modalImageInput = document.getElementById('modalImageInput')
const modalImages = document.getElementById('modalImages')
const modalSave = document.getElementById('modalSave')
const modalCancel = document.getElementById('modalCancel')
const modalManualPosition = document.getElementById('modalManualPosition')
const modalPreview = document.getElementById('modalPreview')
let currentEditIndex = null
let modalImgs = []
let modalPositions = { text: null, imgs: [] }

let labels = [] // each entry: { text, imgs:[], fontSize, imagePosition }
const STORAGE_KEY = 'labelcreator.labels'

// --- simple IndexedDB helper for storing image dataURLs ---
function openDB(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open('labelcreator', 1)
    req.onupgradeneeded = (e)=>{
      const db = e.target.result
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images')
    }
    req.onsuccess = (e)=> resolve(e.target.result)
    req.onerror = (e)=> reject(e.target.error)
  })
}

function uuid(){
  return 'img-' + ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c=>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

async function storeImage(dataUrl){
  const db = await openDB()
  return await new Promise((res,rej)=>{
    const tx = db.transaction('images','readwrite')
    const store = tx.objectStore('images')
    const key = uuid()
    const req = store.put(dataUrl, key)
    req.onsuccess = ()=> res(key)
    req.onerror = ()=> rej(req.error)
  })
}

async function getImage(key){
  const db = await openDB()
  return await new Promise((res,rej)=>{
    const tx = db.transaction('images','readonly')
    const store = tx.objectStore('images')
    const req = store.get(key)
    req.onsuccess = ()=> res(req.result)
    req.onerror = ()=> rej(req.error)
  })
}

async function deleteImage(key){
  const db = await openDB()
  return await new Promise((res,rej)=>{
    const tx = db.transaction('images','readwrite')
    const store = tx.objectStore('images')
    const req = store.delete(key)
    req.onsuccess = ()=> res()
    req.onerror = ()=> rej(req.error)
  })
}

// saveLabels now stores image dataURLs in IndexedDB and keeps metadata in localStorage
async function saveLabels(){
  try{
    const meta = []
    for (const l of labels){
      const entry = { text: l.text, fontSize: l.fontSize, imagePosition: l.imagePosition, positions: l.positions || null, imgs: [], fontFamily: l.fontFamily || null }
      if (l.imgs && l.imgs.length){
        for (const im of l.imgs){
          if (typeof im === 'string' && im.startsWith('data:')){
            try{
              const key = await storeImage(im)
              entry.imgs.push(key)
            }catch(e){ console.warn('storeImage failed', e) }
          } else if (typeof im === 'string'){
            entry.imgs.push(im)
          }
        }
      }
      meta.push(entry)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta))
  }catch(e){
    console.warn('saveLabels failed', e)
  }
}

// loadLabels now restores metadata from localStorage and fetches images from IndexedDB
async function loadLabels(){
  try{
    const s = localStorage.getItem(STORAGE_KEY)
    if (s){
      const meta = JSON.parse(s)
      labels = []
      for (const m of meta){
        const entry = { text: m.text, fontSize: m.fontSize, imagePosition: m.imagePosition, positions: m.positions || null, imgs: [] }
        if (m.imgs && m.imgs.length){
          for (const key of m.imgs){
            try{
              const data = await getImage(key)
              if (data) entry.imgs.push(data)
            }catch(e){ console.warn('getImage failed', e) }
          }
        }
          entry.fontFamily = m.fontFamily || null
          labels.push(entry)
      }
    }
  }catch(e){ console.warn('loadLabels failed', e) }
  console.debug('loadLabels: restored', labels.length, 'labels')
  renderLabels()
}

function renderLabels(){
  labelsList.innerHTML = ''
  labels.forEach((l,i)=>{
    const li = document.createElement('li')
    li.className = 'label-item'
    // thumbnail
    if (l.imgs && l.imgs.length){
      const t = document.createElement('img')
      t.src = l.imgs[0]
      t.className = 'thumb'
      li.appendChild(t)
    }
    const text = document.createElement('span')
    text.textContent = l.text || '(no text)'
    if (l.fontFamily) text.style.fontFamily = l.fontFamily
    li.appendChild(text)
    const edit = document.createElement('button')
    edit.textContent = 'Edit'
    edit.className = 'edit'
    edit.dataset.i = i
    li.appendChild(edit)
    const remove = document.createElement('button')
    remove.textContent = 'Remove'
    remove.className = 'remove'
    remove.dataset.i = i
    li.appendChild(remove)
    labelsList.appendChild(li)
  })
}

labelsList.addEventListener('click',(e)=>{
  if (e.target.classList.contains('remove')){
    const i = Number(e.target.dataset.i)
    labels.splice(i,1)
    renderLabels()
    saveLabels()
  }
  if (e.target.classList.contains('edit')){
    const i = Number(e.target.dataset.i)
    openEditModal(i)
  }
})

addLabelBtn.addEventListener('click', ()=>{
  const text = labelText.value.trim()
  const file = labelImage.files[0]
  if (!text && !file) return alert('Add text or select an image')
  const defaultFont = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--label-font-size')) || 12
  const pos = imagePosition ? imagePosition.value : 'center'
  const defaultFamily = (fontSelect && fontSelect.value) || getComputedStyle(document.documentElement).getPropertyValue('--label-font-family') || 'system-ui,Segoe UI,Arial,sans-serif'
  if (file){
    const r = new FileReader()
    r.onload = ()=>{
      labels.push({ text, imgs:[r.result], fontSize: defaultFont, imagePosition: pos, fontFamily: defaultFamily })
      renderLabels()
      saveLabels()
      labelText.value = ''
      labelImage.value = ''
    }
    r.readAsDataURL(file)
  } else {
    labels.push({ text, imgs:[], fontSize: defaultFont, imagePosition: pos, fontFamily: defaultFamily })
    renderLabels()
    saveLabels()
    labelText.value = ''
  }
})

function mm(v){ return Number(String(v).trim().replace('mm','')) }

function generateSheet(){
  const cols = Math.max(1, Number(colsInput.value) || Number(layoutSelect.selectedOptions[0].dataset.cols) || 3)
  let rows = Math.max(1, Number(rowsInput.value) || Number(layoutSelect.selectedOptions[0].dataset.rows) || 8)
  const countEstimate = cols * rows
  const root = getComputedStyle(document.documentElement)
  const pageW = mm(root.getPropertyValue('--page-width') || '210mm')
  const pageH = mm(root.getPropertyValue('--page-height') || '297mm')
  const mTop = mm(root.getPropertyValue('--margin-top') || '10mm')
  const mRight = mm(root.getPropertyValue('--margin-right') || '10mm')
  const mBottom = mm(root.getPropertyValue('--margin-bottom') || '10mm')
  const mLeft = mm(root.getPropertyValue('--margin-left') || '10mm')
  const contentW = pageW - mLeft - mRight
  const contentH = pageH - mTop - mBottom

  // determine label sizes
  let labelW = contentW / cols
  let labelH
  const lhMode = labelHeightMode ? labelHeightMode.value : 'standard'
  if (lhMode === 'thin'){
    const thinH = 12
    rows = Math.max(1, Math.floor(contentH / thinH))
    labelH = thinH
    rowsInput.value = rows
  } else if (lhMode === 'custom' && labelHeightCustom && labelHeightCustom.value){
    labelH = Number(labelHeightCustom.value) || (contentH / rows)
  } else {
    labelH = contentH / rows
  }

  const count = cols * rows
  sheet.innerHTML = ''
  sheet.style.gridTemplateColumns = `repeat(${cols}, ${labelW}mm)`
  sheet.style.gridTemplateRows = `repeat(${rows}, ${labelH}mm)`

  for (let i=0;i<count;i++){
    const item = document.createElement('div')
    item.className = 'label'
    item.style.width = `${labelW}mm`
    item.style.height = `${labelH}mm`
    // get label data
    const data = labels.length ? labels[i % labels.length] : { text:'', imgs:[], fontSize: null, imagePosition: null }

    // layout based on per-label imagePosition (fallback to global)
    const imgPos = (data.imagePosition) ? data.imagePosition : (imagePosition ? imagePosition.value : 'center')
    // reset row class
    item.classList.remove('row')
    if (['left','right','top-left','top-right','bottom-left','bottom-right'].includes(imgPos)) item.classList.add('row')
    if (imgPos === 'top'){
      item.style.flexDirection = 'column'
      item.style.justifyContent = 'flex-start'
      item.style.alignItems = 'center'
    } else if (imgPos === 'bottom'){
      item.style.flexDirection = 'column'
      item.style.justifyContent = 'flex-end'
      item.style.alignItems = 'center'
    } else if (imgPos === 'left'){
      item.style.flexDirection = 'row'
      item.style.justifyContent = 'flex-start'
      item.style.alignItems = 'center'
    } else if (imgPos === 'right'){
      item.style.flexDirection = 'row'
      item.style.justifyContent = 'flex-end'
      item.style.alignItems = 'center'
    } else if (imgPos === 'top-left'){
      item.style.flexDirection = 'row'
      item.style.justifyContent = 'flex-start'
      item.style.alignItems = 'flex-start'
    } else if (imgPos === 'top-right'){
      item.style.flexDirection = 'row'
      item.style.justifyContent = 'flex-end'
      item.style.alignItems = 'flex-start'
    } else if (imgPos === 'bottom-left'){
      item.style.flexDirection = 'row'
      item.style.justifyContent = 'flex-start'
      item.style.alignItems = 'flex-end'
    } else if (imgPos === 'bottom-right'){
      item.style.flexDirection = 'row'
      item.style.justifyContent = 'flex-end'
      item.style.alignItems = 'flex-end'
    } else {
      item.style.flexDirection = 'column'
      item.style.justifyContent = 'center'
      item.style.alignItems = 'center'
    }

    // create text element
    const span = document.createElement('div')
    span.className = 'label-text'
    span.textContent = data.text || ''
    // apply per-label font size if defined, otherwise use root var
    if (data.fontSize) span.style.fontSize = `${data.fontSize}pt`
    if (data.fontFamily) span.style.fontFamily = data.fontFamily

    // append images and text in an order that reflects the image position
    const isRow = item.style.flexDirection === 'row'
    const appendImages = ()=>{
      if (data.imgs && data.imgs.length){
        data.imgs.forEach(src=>{
          const img = document.createElement('img')
          img.src = src
          img.className = 'label-img'
          item.appendChild(img)
        })
      }
    }

    // determine ordering
    if (isRow){
      // in a row, if image is on the right side, put text first
      if (['right','top-right','bottom-right'].includes(imgPos)){
        item.appendChild(span)
        appendImages()
      } else {
        appendImages()
        item.appendChild(span)
      }
    } else {
      // column layout: if image is bottom, put text first
      if (imgPos === 'bottom'){
        item.appendChild(span)
        appendImages()
      } else {
        appendImages()
        item.appendChild(span)
      }
    }

    // adjust text alignment according to position
    if (imgPos.includes('left')) span.style.textAlign = 'left'
    else if (imgPos.includes('right')) span.style.textAlign = 'right'
    else span.style.textAlign = 'center'

    // apply saved manual positions if present
    if (data.positions){
      item.style.position = 'relative'
      if (data.positions.text){
        span.style.position = 'absolute'
        span.style.left = (data.positions.text.left||50) + '%'
        span.style.top = (data.positions.text.top||75) + '%'
        span.style.transform = 'translate(-50%,-50%)'
      }
      // position images absolutely
      // but images are appended after this block by appendImages; we'll adjust after creation by querying
    }

    // if manual positions provided, convert images to absolutely positioned elements
    if (data.positions){
      const imgEls = item.querySelectorAll('.label-img')
      imgEls.forEach((imgEl, j)=>{
        const pos = (data.positions.imgs && data.positions.imgs[j]) ? data.positions.imgs[j] : { left:50, top:25 }
        imgEl.style.position = 'absolute'
        imgEl.style.left = (pos.left||50) + '%'
        imgEl.style.top = (pos.top||25) + '%'
        imgEl.style.transform = 'translate(-50%,-50%)'
      })
    }

    // crossmark borders
    const bsVal = borderStyle ? borderStyle.value : (document.documentElement.getAttribute('data-border-style') || 'none')
    if (bsVal === 'crossmarks'){
      item.style.position = 'relative'
      const addMark = (opts)=>{
        const m = document.createElement('div')
        m.className = 'crossmark'
        m.style.width = `6mm`
        m.style.height = `0.45mm`
        m.style.background = '#000'
        m.style.position = 'absolute'
        if (opts.top) m.style.top = opts.top
        if (opts.left) m.style.left = opts.left
        if (opts.right) m.style.right = opts.right
        if (opts.bottom) m.style.bottom = opts.bottom
        if (opts.rot) m.style.transform = 'rotate(90deg)'
        item.appendChild(m)
      }
      addMark({top:'0.6mm',left:'0.6mm',rot:false})
      addMark({top:'0.6mm',left:'0.6mm',rot:true})
      addMark({top:'0.6mm',right:'0.6mm',rot:false})
      addMark({top:'0.6mm',right:'0.6mm',rot:true})
      addMark({bottom:'0.6mm',left:'0.6mm',rot:false})
      addMark({bottom:'0.6mm',left:'0.6mm',rot:true})
      addMark({bottom:'0.6mm',right:'0.6mm',rot:false})
      addMark({bottom:'0.6mm',right:'0.6mm',rot:true})
    }

    sheet.appendChild(item)
    // After element is in DOM, set explicit pixel max-heights for absolutely-positioned images
    if (data.positions){
      const rect = item.getBoundingClientRect()
      const imgEls2 = item.querySelectorAll('.label-img')
      imgEls2.forEach((imgEl)=>{
        imgEl.style.maxHeight = `${rect.height * 0.6}px`
        imgEl.style.maxWidth = `${rect.width}px`
      })
    }
  }
  // reflect chosen border style onto root element so print CSS picks it up
  if (borderStyle) document.documentElement.setAttribute('data-border-style', borderStyle.value)
}

function applyPageSettings(){
  if (pageSize.value === 'A4'){
    document.documentElement.style.setProperty('--page-width','210mm')
    document.documentElement.style.setProperty('--page-height','297mm')
  } else {
    document.documentElement.style.setProperty('--page-width','216mm')
    document.documentElement.style.setProperty('--page-height','279mm')
  }
  if (marginPreset.value !== 'custom'){
    const m = marginPreset.selectedOptions[0].dataset.m || '10'
    const mval = `${m}mm`
    document.documentElement.style.setProperty('--margin-top', mval)
    document.documentElement.style.setProperty('--margin-right', mval)
    document.documentElement.style.setProperty('--margin-bottom', mval)
    document.documentElement.style.setProperty('--margin-left', mval)
    dynamicStyle.textContent = `@page { size: ${pageSize.value}; margin: ${mval}; }`
    customMargins.style.display = 'none'
  } else {
    const t = (marginTop.value||'0') + 'mm'
    const r = (marginRight.value||'0') + 'mm'
    const b = (marginBottom.value||'0') + 'mm'
    const l = (marginLeft.value||'0') + 'mm'
    document.documentElement.style.setProperty('--margin-top', t)
    document.documentElement.style.setProperty('--margin-right', r)
    document.documentElement.style.setProperty('--margin-bottom', b)
    document.documentElement.style.setProperty('--margin-left', l)
    dynamicStyle.textContent = `@page { size: ${pageSize.value}; margin: ${t} ${r} ${b} ${l}; }`
    customMargins.style.display = 'flex'
  }
}

// sync layout select -> cols/rows inputs
// (handled above in the primary change listener; duplicate handler removed)

// initialize layout inputs from the selected preset (called on startup)
function initLayoutInputs(){
  if (!layoutSelect || !colsInput || !rowsInput) return
  const opt = layoutSelect.selectedOptions[0]
  if (!opt) return
  if (layoutSelect.value !== 'custom'){
    // set cols/rows to match the selected preset so visibility logic can work reliably
    colsInput.value = opt.dataset.cols || colsInput.value
    rowsInput.value = opt.dataset.rows || rowsInput.value
  }
}

labelHeightMode.addEventListener('change', ()=>{
  if (labelHeightMode.value === 'custom') labelHeightCustom.style.display = 'inline-block'
  else labelHeightCustom.style.display = 'none'
})

fontSizeRange.addEventListener('input', ()=>{
  const v = fontSizeRange.value
  fontSizeLabel.textContent = `${v}pt`
  document.documentElement.style.setProperty('--label-font-size', `${v}pt`)
})
document.documentElement.style.setProperty('--label-font-size','12pt')

pageSize.addEventListener('change', applyPageSettings)
marginPreset.addEventListener('change', applyPageSettings)
marginTop.addEventListener('input', applyPageSettings)
marginRight.addEventListener('input', applyPageSettings)
marginBottom.addEventListener('input', applyPageSettings)
marginLeft.addEventListener('input', applyPageSettings)

if (borderStyle){
  document.documentElement.setAttribute('data-border-style', borderStyle.value)
  borderStyle.addEventListener('change', ()=>{
    document.documentElement.setAttribute('data-border-style', borderStyle.value)
  })
}

// Modal
function openEditModal(index){
  currentEditIndex = index
  const entry = labels[index] || { text:'', imgs:[], fontSize:12, imagePosition:'center' }
  modalLabelText.value = entry.text || ''
  modalFontSize.value = entry.fontSize || 12
  modalImagePosition.value = entry.imagePosition || 'center'
  if (modalFontSelect){
    modalFontSelect.value = entry.fontFamily || (fontSelect ? fontSelect.value : getComputedStyle(document.documentElement).getPropertyValue('--label-font-family'))
  }
  modalImgs = Array.isArray(entry.imgs) ? entry.imgs.slice() : []
  // load saved manual positions if present
  modalPositions = { text: null, imgs: [] }
  if (entry.positions && entry.positions.text) modalPositions.text = Object.assign({}, entry.positions.text)
  if (entry.positions && Array.isArray(entry.positions.imgs)) modalPositions.imgs = entry.positions.imgs.map(p=>Object.assign({}, p))
  // ensure modalPositions.imgs aligns with modalImgs
  while(modalPositions.imgs.length < modalImgs.length) modalPositions.imgs.push({ left:50, top:50 })
  while(modalPositions.imgs.length > modalImgs.length) modalPositions.imgs.pop()
  // if no saved text position, compute defaults that mirror the layout
  if (!modalPositions.text){
    const def = computeDefaultPositions(modalImagePosition.value || 'center', modalImgs.length)
    modalPositions.text = def.text
    modalPositions.imgs = def.imgs
  }
  renderModalImages()
  renderModalPreview()
  editModal.setAttribute('aria-hidden','false')
}

function closeEditModal(){
  editModal.setAttribute('aria-hidden','true')
  currentEditIndex = null
  modalImgs = []
}

function renderModalImages(){
  modalImages.innerHTML = ''
  modalImgs.forEach((src,idx)=>{
    const w = document.createElement('div')
    w.className = 'mimg'
    const img = document.createElement('img')
    img.src = src
    w.appendChild(img)
    const rem = document.createElement('button')
    rem.textContent = '×'
    rem.title = 'Remove'
    rem.dataset.i = idx
    rem.addEventListener('click', ()=>{ modalImgs.splice(idx,1); if (modalPositions.imgs) modalPositions.imgs.splice(idx,1); renderModalImages(); renderModalPreview() })
    w.appendChild(rem)
    modalImages.appendChild(w)
  })
}

modalImageInput.addEventListener('change', (e)=>{
  const files = Array.from(e.target.files||[])
  if (!files.length) return
  let loaded = 0
  files.forEach(f=>{
    const r = new FileReader()
    r.onload = ()=>{ modalImgs.push(r.result); // add default position for the new image
      if (!modalPositions.imgs) modalPositions.imgs = []
      modalPositions.imgs.push({ left:50, top:25 })
      loaded++; if (loaded===files.length) { renderModalImages(); renderModalPreview() } }
    r.readAsDataURL(f)
  })
  modalImageInput.value = ''
})

// Render a small preview inside the modal and enable dragging when manual positioning enabled
function renderModalPreview(){
  // clear preview
  modalPreview.innerHTML = ''

  // compute label mm dimensions and create a box that uses those exact mm sizes
  const box = document.createElement('div')
  box.className = 'label modal-preview-inner'
  box.style.position = 'relative'
  try{
    const root = getComputedStyle(document.documentElement)
    const pageW = mm(root.getPropertyValue('--page-width') || '210mm')
    const pageH = mm(root.getPropertyValue('--page-height') || '297mm')
    const mTop = mm(root.getPropertyValue('--margin-top') || '10mm')
    const mRight = mm(root.getPropertyValue('--margin-right') || '10mm')
    const mBottom = mm(root.getPropertyValue('--margin-bottom') || '10mm')
    const mLeft = mm(root.getPropertyValue('--margin-left') || '10mm')
    const contentW = pageW - mLeft - mRight
    const contentH = pageH - mTop - mBottom
    const cols = Math.max(1, Number(colsInput.value) || Number(layoutSelect.selectedOptions[0].dataset.cols) || 3)
    let rows = Math.max(1, Number(rowsInput.value) || Number(layoutSelect.selectedOptions[0].dataset.rows) || 8)
    const lhMode = labelHeightMode ? labelHeightMode.value : 'standard'
    let labelW = contentW / cols
    let labelH = contentH / rows
    if (lhMode === 'thin'){
      const thinH = 12
      rows = Math.max(1, Math.floor(contentH / thinH))
      labelH = thinH
    } else if (lhMode === 'custom' && labelHeightCustom && labelHeightCustom.value){
      labelH = Number(labelHeightCustom.value) || labelH
    }
    // size the box using mm units so it represents the target label exactly
    if (labelW > 0 && labelH > 0){
      box.style.width = `${labelW}mm`
      box.style.height = `${labelH}mm`
    }
  }catch(e){/* ignore if any DOM var missing */}

  // append the box directly; allow the surrounding .modal-preview to scroll if the box is large
  modalPreview.appendChild(box)

  // add the text element
  const txt = document.createElement('div')
  txt.className = 'label-text'
  txt.textContent = modalLabelText.value || ''
  txt.style.fontSize = (modalFontSize.value||12) + 'pt'
  if (modalFontSelect && modalFontSelect.value){
    txt.style.fontFamily = modalFontSelect.value
  } else {
    txt.style.fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--label-font-family')
  }
  // position text according to saved modalPositions or sensible defaults
  if (modalPositions.text && modalPositions.text.left!=null){
    txt.style.position = 'absolute'
    txt.style.left = modalPositions.text.left + '%'
    txt.style.top = modalPositions.text.top + '%'
    txt.style.transform = 'translate(-50%,-50%)'
  } else {
    txt.style.position = 'absolute'
    txt.style.left = '50%'
    txt.style.top = '75%'
    txt.style.transform = 'translate(-50%,-50%)'
  }
  box.appendChild(txt)
  // make text draggable when manual mode enabled
  makeDraggable(txt, 'text', 0)

  // add images (absolute positioned inside the box)
  modalImgs.forEach((src,idx)=>{
    const im = document.createElement('img')
    im.className = 'label-img'
    im.src = src
    im.style.position = 'absolute'
    const pos = (modalPositions.imgs && modalPositions.imgs[idx]) ? modalPositions.imgs[idx] : { left:50, top:25 }
    im.style.left = (pos.left||50) + '%'
    im.style.top = (pos.top||25) + '%'
    im.style.transform = 'translate(-50%,-50%)'
    im.dataset.i = idx
    box.appendChild(im)
    // make draggable if manual positioning enabled
    makeDraggable(im, 'img', idx)
  })
  // compute and apply explicit pixel max sizes so preview image sizing matches generated labels
  requestAnimationFrame(()=>{
    const br = box.getBoundingClientRect()
    const imgs = box.querySelectorAll('.label-img')
    imgs.forEach(imgEl=>{
      imgEl.style.maxHeight = `${br.height * 0.6}px`
      imgEl.style.maxWidth = `${br.width}px`
    })
  })
}

function makeDraggable(el, type, index){
  let dragging = false
  let startX=0, startY=0
  const onDown = (e)=>{
    if (!modalManualPosition || !modalManualPosition.checked) return
    dragging = true
    const p = e.touches ? e.touches[0] : e
    startX = p.clientX
    startY = p.clientY
    e.preventDefault()
  }
  const onMove = (e)=>{
    if (!dragging) return
    const p = e.touches ? e.touches[0] : e
    // relative to the modal preview inner box
    const container = el.closest('.modal-preview-inner') || modalPreview.querySelector('.modal-preview-inner')
    const rect = container ? container.getBoundingClientRect() : modalPreview.getBoundingClientRect()
    const x = p.clientX - rect.left
    const y = p.clientY - rect.top
    // convert to percent relative to box
    const leftPct = Math.round((x / rect.width) * 10000) / 100
    const topPct = Math.round((y / rect.height) * 10000) / 100
    el.style.left = leftPct + '%'
    el.style.top = topPct + '%'
    // store
    if (type === 'text'){
      modalPositions.text = { left: leftPct, top: topPct }
    } else if (type === 'img'){
      modalPositions.imgs[index] = { left: leftPct, top: topPct }
    }
    e.preventDefault()
  }
  const onUp = ()=>{ dragging = false }
  el.addEventListener('mousedown', onDown)
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  // touch
  el.addEventListener('touchstart', onDown)
  window.addEventListener('touchmove', onMove, { passive:false })
  window.addEventListener('touchend', onUp)
}

modalCancel.addEventListener('click', ()=> closeEditModal())
modalSave.addEventListener('click', ()=>{
  if (currentEditIndex === null) return closeEditModal()
  const entry = labels[currentEditIndex] || {}
  entry.text = modalLabelText.value
  entry.imgs = modalImgs.slice()
  entry.fontSize = Number(modalFontSize.value) || 12
  entry.fontFamily = modalFontSelect ? modalFontSelect.value : (fontSelect ? fontSelect.value : getComputedStyle(document.documentElement).getPropertyValue('--label-font-family'))
  entry.imagePosition = modalImagePosition.value || 'center'
  // store manual positions if enabled
  if (modalManualPosition && modalManualPosition.checked){
    entry.positions = Object.assign({}, modalPositions)
  } else {
    if (entry.positions) delete entry.positions
  }
  labels[currentEditIndex] = entry
  renderLabels()
  saveLabels()
  closeEditModal()
})

// update preview when modal inputs change
modalLabelText.addEventListener('input', renderModalPreview)
modalFontSize.addEventListener('input', renderModalPreview)
modalManualPosition.addEventListener('change', renderModalPreview)

// apply defaults and wire generate/print
applyPageSettings()
generateBtn.addEventListener('click', ()=>{ if (!labels.length) return alert('Add at least one label'); generateSheet() })

// Compute sensible default positions that mirror the current layout (so preview matches generated layout)
function computeDefaultPositions(imagePos, count){
  const txtPos = { left:50, top:75 }
  const imgs = []
  if (imagePos === 'center'){
    txtPos.top = 75
    for (let i=0;i<count;i++) imgs.push({ left: 50, top: 35 + i*5 })
  } else if (imagePos === 'top'){
    txtPos.top = 85
    for (let i=0;i<count;i++) imgs.push({ left: 50 - (count-1)*8/2 + i*8, top: 25 })
  } else if (imagePos === 'bottom'){
    txtPos.top = 25
    for (let i=0;i<count;i++) imgs.push({ left: 50 - (count-1)*8/2 + i*8, top: 75 })
  } else if (imagePos === 'left'){
    txtPos.left = 75; txtPos.top = 50
    for (let i=0;i<count;i++) imgs.push({ left: 25, top: 50 - (count-1)*8/2 + i*8 })
  } else if (imagePos === 'right'){
    txtPos.left = 25; txtPos.top = 50
    for (let i=0;i<count;i++) imgs.push({ left: 75, top: 50 - (count-1)*8/2 + i*8 })
  } else if (imagePos === 'top-left'){
    txtPos.left = 75; txtPos.top = 75
    for (let i=0;i<count;i++) imgs.push({ left: 25 + i*8, top: 25 })
  } else if (imagePos === 'top-right'){
    txtPos.left = 25; txtPos.top = 75
    for (let i=0;i<count;i++) imgs.push({ left: 75 - i*8, top: 25 })
  } else if (imagePos === 'bottom-left'){
    txtPos.left = 75; txtPos.top = 25
    for (let i=0;i<count;i++) imgs.push({ left: 25 + i*8, top: 75 })
  } else if (imagePos === 'bottom-right'){
    txtPos.left = 25; txtPos.top = 25
    for (let i=0;i<count;i++) imgs.push({ left: 75 - i*8, top: 75 })
  } else {
    for (let i=0;i<count;i++) imgs.push({ left: 50, top: 35 + i*5 })
  }
  return { text: txtPos, imgs }
}
printBtn.addEventListener('click', ()=>{ if (!sheet.children.length) generateSheet(); window.print() })
// diagnostics button removed

// Clear all labels handler
if (clearAllBtn){
  clearAllBtn.addEventListener('click', ()=>{
    if (!labels.length) return alert('No labels to remove')
    if (!confirm('Remove ALL labels? This cannot be undone.')) return
    labels = []
    saveLabels()
    renderLabels()
    sheet.innerHTML = ''
  })
}
// load labels from storage (falls back to empty and renders), then set layout visibility
Promise.all([loadLabels(), loadOptimize()]).then(()=> { initLayoutInputs(); updateLayoutVisibility(); updateModeVisibility() }).catch(()=> { initLayoutInputs(); updateLayoutVisibility(); updateModeVisibility() })
