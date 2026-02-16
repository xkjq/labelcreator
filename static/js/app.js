const labelsList = document.getElementById('labels')
const addLabelBtn = document.getElementById('addLabelBtn')
const labelText = document.getElementById('labelText')
const labelImage = document.getElementById('labelImage')
const layoutSelect = document.getElementById('layoutSelect')
const generateBtn = document.getElementById('generateBtn')
const printBtn = document.getElementById('printBtn')
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

let labels = []

function renderLabels() {
  labelsList.innerHTML = ''
  labels.forEach((l, i) => {
    const li = document.createElement('li')
    li.className = 'label-item'
    const textSpan = document.createElement('span')
    textSpan.textContent = l.text || '(no text)'
    li.appendChild(textSpan)
    if (l.img) {
      const img = document.createElement('img')
      img.src = l.img
      img.className = 'thumb'
      li.prepend(img)
    }
    const removeBtn = document.createElement('button')
    removeBtn.textContent = 'Remove'
    removeBtn.dataset.i = i
    removeBtn.className = 'remove'
    li.appendChild(removeBtn)
    labelsList.appendChild(li)
  })
}

labelsList.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove')) {
    const i = Number(e.target.dataset.i)
    labels.splice(i, 1)
    renderLabels()
  }
})

addLabelBtn.addEventListener('click', () => {
  const text = labelText.value.trim()
  const file = labelImage.files[0]
  if (!text && !file) return alert('Add text or select an image')
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      labels.push({ text, img: reader.result })
      renderLabels()
      labelText.value = ''
      labelImage.value = ''
    }
    reader.readAsDataURL(file)
  } else {
    labels.push({ text, img: null })
    renderLabels()
    labelText.value = ''
  }
})

function generateSheet() {
  const cols = Number(layoutSelect.selectedOptions[0].dataset.cols) || 3
  const rows = Number(layoutSelect.selectedOptions[0].dataset.rows) || 8
  const count = cols * rows
  // compute physical dimensions in mm and set grid to exact sizes so print matches
  const getMm = (v) => Number(String(v).trim().replace('mm',''))
  const root = getComputedStyle(document.documentElement)
  const pageW = getMm(root.getPropertyValue('--page-width') || '210mm')
  const pageH = getMm(root.getPropertyValue('--page-height') || '297mm')
  const mTop = getMm(root.getPropertyValue('--margin-top') || '10mm')
  const mRight = getMm(root.getPropertyValue('--margin-right') || '10mm')
  const mBottom = getMm(root.getPropertyValue('--margin-bottom') || '10mm')
  const mLeft = getMm(root.getPropertyValue('--margin-left') || '10mm')

  const contentW = pageW - mLeft - mRight
  const contentH = pageH - mTop - mBottom
  const labelW = contentW / cols
  const labelH = contentH / rows

  sheet.innerHTML = ''
  // set explicit grid sizes using mm units
  sheet.style.gridTemplateColumns = `repeat(${cols}, ${labelW}mm)`
  sheet.style.gridTemplateRows = `repeat(${rows}, ${labelH}mm)`

  for (let i = 0; i < count; i++) {
    const item = document.createElement('div')
    item.className = 'label'
    // Ensure each label box has exact physical size as a fallback
    item.style.width = `${labelW}mm`
    item.style.height = `${labelH}mm`
    const data = labels.length ? labels[i % labels.length] : { text: '' }
    if (data.img) {
      const img = document.createElement('img')
      img.src = data.img
      img.className = 'label-img'
      item.appendChild(img)
    }
    const span = document.createElement('div')
    span.className = 'label-text'
    span.textContent = data.text || ''
    item.appendChild(span)
    // add crossmark corner markers when selected
    const bsVal = borderStyle ? borderStyle.value : (document.documentElement.getAttribute('data-border-style') || 'none')
    if (bsVal === 'crossmarks'){
      item.style.position = 'relative'
      const size = 6
      const thickness = 0.45
      const addMark = (opts)=>{
        const m = document.createElement('div')
        m.className = 'crossmark'
        m.style.width = `${size}mm`
        m.style.height = `${thickness}mm`
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
  }
  // reflect chosen border style onto root element so print CSS picks it up
  if (borderStyle) document.documentElement.setAttribute('data-border-style', borderStyle.value)
}

function applyPageSettings(){
  // page size
  if (pageSize.value === 'A4'){
    document.documentElement.style.setProperty('--page-width','210mm')
    document.documentElement.style.setProperty('--page-height','297mm')
  } else {
    // Letter fallback in mm
    document.documentElement.style.setProperty('--page-width','216mm')
    document.documentElement.style.setProperty('--page-height','279mm')
  }

  // margins
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
    // read custom inputs (allow empty -> 0)
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

pageSize.addEventListener('change', applyPageSettings)
marginPreset.addEventListener('change', applyPageSettings)
marginTop.addEventListener('input', applyPageSettings)
marginRight.addEventListener('input', applyPageSettings)
marginBottom.addEventListener('input', applyPageSettings)
marginLeft.addEventListener('input', applyPageSettings)

// initialize and watch border style select (reflect on root element for print CSS)
if (borderStyle){
  document.documentElement.setAttribute('data-border-style', borderStyle.value)
  borderStyle.addEventListener('change', ()=>{
    document.documentElement.setAttribute('data-border-style', borderStyle.value)
  })
}

// apply defaults on load
applyPageSettings()

generateBtn.addEventListener('click', () => {
  if (labels.length === 0) return alert('Add at least one label')
  generateSheet()
})

printBtn.addEventListener('click', () => {
  if (sheet.children.length === 0) generateSheet()
  window.print()
})

// initial
renderLabels()
