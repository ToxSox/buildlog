/**
 * Nachbearbeitung der Kanten-Beschriftungen im fertig gerenderten Mermaid-SVG.
 *
 * Mermaid setzt eine Beschriftung auf die geometrische Mitte der *gezeichneten*
 * Linie und verwirft dabei den Platz, den das Layout dafür reserviert hatte.
 * Bei gebogenen Leitungen fallen beide Punkte auseinander, und weil die Knoten
 * nach den Beschriftungen gezeichnet werden, verschwindet der Text dann unter
 * einem Kasten: Im Stromlaufplan verdeckte so das Pac-Audio-Modul den
 * Querschnitt der Leitung zum Monoblock.
 *
 * Betroffene Beschriftungen wandern deshalb an eine freie Stelle *derselben*
 * Linie. Quer wegschieben wäre einfacher, würde den Querschnitt aber neben eine
 * fremde Leitung setzen – in einem Stromlaufplan wäre das eine falsche Angabe.
 */

/** Abstand, den eine Beschriftung zu einem Knotenrand halten soll. */
const GAP = 4
/** Stützstellen je Linie: fein genug für einen Sprung um Kastenbreiten. */
const SAMPLES = 48
/** Die äußeren Enden bleiben frei – dort sitzen Pfeilspitze und Knotenrand. */
const END_MARGIN = 0.08
/** Abstand der Stützstellen, mit denen fremde Linien abgetastet werden. */
const CROSS_STEP = 6
/** Verdeckung wiegt schwer, ein weiter Weg auf der eigenen Linie kaum. */
const NODE_WEIGHT = 100
const CLIP_WEIGHT = 100
const LABEL_WEIGHT = 20
const CROSS_WEIGHT = 3

/** Fläche, die sich zwei achsenparallele Kästen teilen. */
export function overlapArea(a, b) {
  const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return dx > 0 && dy > 0 ? dx * dy : 0
}

function boxAround(spot, size) {
  return { x: spot.x - size.w / 2, y: spot.y - size.h / 2, w: size.w, h: size.h }
}

function contains(box, point) {
  return point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h
}

/**
 * Wählt unter den Stützstellen einer Linie den besten Platz für eine
 * Beschriftung. Bewusst ohne DOM, damit die Auswahl testbar bleibt.
 *
 * @param {{x:number,y:number}[]} spots Punkte auf der eigenen Linie, in Laufrichtung.
 * @param {{w:number,h:number}} size Größe der Beschriftung.
 * @param {object} around Umfeld der Linie:
 *   `nodes` Knotenkästen, die sie nicht verdecken darf;
 *   `placed` bereits gesetzte Beschriftungen;
 *   `crossings` abgetastete Punkte *fremder* Linien – der weiße Kasten hinter
 *     dem Text soll keine andere Leitung unterbrechen und die Angabe nicht
 *     der falschen Linie zuordnen;
 *   `bounds` sichtbarer Bereich, außerhalb wird abgeschnitten;
 *   `from` Index der aktuellen Position – kurze Wege bevorzugt.
 */
export function chooseLabelSpot(spots, size, around = {}) {
  const { nodes = [], placed = [], crossings = [], bounds = null, from = 0 } = around
  const area = Math.max(size.w * size.h, 1)
  const last = Math.max(spots.length - 1, 1)
  let best = null
  spots.forEach((spot, index) => {
    const box = boxAround(spot, size)
    const onNode = nodes.reduce((sum, n) => sum + overlapArea(box, n), 0) / area
    const onLabel = placed.reduce((sum, l) => sum + overlapArea(box, l), 0) / area
    const clipped = bounds ? (area - overlapArea(box, bounds)) / area : 0
    const crossed = crossings.filter((line) => line.some((p) => contains(box, p))).length
    const walk = Math.abs(index - from) / last
    const cost =
      onNode * NODE_WEIGHT + clipped * CLIP_WEIGHT + onLabel * LABEL_WEIGHT + crossed * CROSS_WEIGHT + walk
    if (!best || cost < best.cost) best = { index, cost, box, spot }
  })
  return best
}

function num(value) {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

/** Mermaid schreibt ausschließlich `translate(x, y)` – mehr muss hier nicht können. */
function translateOf(el) {
  const match = /translate\(\s*([-\d.eE+]+)[\s,]+([-\d.eE+]+)/.exec(el.getAttribute('transform') || '')
  return match ? { x: num(match[1]), y: num(match[2]) } : { x: 0, y: 0 }
}

function nodeBox(node) {
  const at = translateOf(node)
  const shape =
    node.querySelector('rect.label-container') || node.querySelector('rect, polygon, circle, ellipse, path')
  if (!shape) return null
  let box
  if (shape.tagName.toLowerCase() === 'rect' && shape.hasAttribute('width')) {
    box = {
      x: num(shape.getAttribute('x')),
      y: num(shape.getAttribute('y')),
      w: num(shape.getAttribute('width')),
      h: num(shape.getAttribute('height')),
    }
  } else {
    // Rauten, Kreise und freie Formen liefern ihre Maße nur über getBBox().
    const b = typeof shape.getBBox === 'function' ? shape.getBBox() : null
    if (!b) return null
    box = { x: b.x, y: b.y, w: b.width, h: b.height }
  }
  if (!(box.w > 0) || !(box.h > 0)) return null
  return { x: at.x + box.x - GAP, y: at.y + box.y - GAP, w: box.w + 2 * GAP, h: box.h + 2 * GAP }
}

/** Der Kasten ohne den Sicherheitsabstand – nur er verdeckt wirklich etwas. */
function tighten(node) {
  return { x: node.x + GAP, y: node.y + GAP, w: node.w - 2 * GAP, h: node.h - 2 * GAP }
}

function lengthOf(path) {
  if (typeof path.getTotalLength !== 'function' || typeof path.getPointAtLength !== 'function') return 0
  try {
    const length = path.getTotalLength()
    return length > 0 ? length : 0
  } catch {
    return 0
  }
}

/** Mögliche Plätze auf der eigenen Linie – ohne die Enden mit Pfeil und Knotenrand. */
function sampleAlong(path) {
  const length = lengthOf(path)
  if (!length) return []
  const spots = []
  for (let i = 0; i <= SAMPLES; i += 1) {
    const at = (END_MARGIN + (i / SAMPLES) * (1 - 2 * END_MARGIN)) * length
    const point = path.getPointAtLength(at)
    spots.push({ x: point.x, y: point.y })
  }
  return spots
}

/** Verlauf einer Linie in festen Schritten – zum Erkennen von Kreuzungen. */
function traceLine(path) {
  const length = lengthOf(path)
  if (!length) return []
  const steps = Math.max(Math.ceil(length / CROSS_STEP), 1)
  const points = []
  for (let i = 0; i <= steps; i += 1) {
    const point = path.getPointAtLength((i / steps) * length)
    points.push({ x: point.x, y: point.y })
  }
  return points
}

function nearestIndex(spots, point) {
  let best = 0
  let bestDist = Infinity
  spots.forEach((spot, index) => {
    const dist = (spot.x - point.x) ** 2 + (spot.y - point.y) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = index
    }
  })
  return best
}

function viewBoxOf(svg) {
  const parts = (svg.getAttribute('viewBox') || '')
    .trim()
    .split(/[\s,]+/)
    .map(num)
  if (parts.length !== 4 || !(parts[2] > 0) || !(parts[3] > 0)) return null
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] }
}

/**
 * Rückt verdeckte Kanten-Beschriftungen im SVG zurecht.
 * @returns {number} Anzahl der verschobenen Beschriftungen.
 */
export function declutterEdgeLabels(svg) {
  if (!svg || typeof svg.querySelectorAll !== 'function') return 0
  const root = svg.querySelector('g.root') || svg
  const nodes = [...root.querySelectorAll('g.node')].map(nodeBox).filter(Boolean)
  if (!nodes.length) return 0

  const paths = new Map()
  root.querySelectorAll('g.edgePaths path[data-id]').forEach((p) => {
    paths.set(p.getAttribute('data-id'), p)
  })

  // Der Verlauf einer Linie wird höchstens einmal abgetastet.
  const traced = new Map()
  const trace = (id) => {
    if (!traced.has(id)) traced.set(id, traceLine(paths.get(id)))
    return traced.get(id)
  }

  const bounds = viewBoxOf(svg)
  const placed = []
  let moved = 0

  root.querySelectorAll('g.edgeLabels g.edgeLabel').forEach((group) => {
    const label = group.querySelector('g.label[data-id]')
    const frame = group.querySelector('foreignObject')
    if (!label || !frame) return
    const size = { w: num(frame.getAttribute('width')), h: num(frame.getAttribute('height')) }
    if (!(size.w > 0) || !(size.h > 0)) return

    const own = label.getAttribute('data-id')
    const at = translateOf(group)
    const box = boxAround(at, size)
    const path = paths.get(own)
    // Eingegriffen wird nur bei echter Verdeckung – der Sicherheitsabstand
    // zählt erst bei der Suche nach dem neuen Platz. Ein Diagramm ohne
    // Konflikt soll sich durch diesen Durchlauf nicht verändern.
    const blocked = nodes.some((n) => overlapArea(box, tighten(n)) > 0)
    if (!blocked || !path) {
      placed.push(box)
      return
    }

    const spots = sampleAlong(path)
    if (!spots.length) {
      placed.push(box)
      return
    }
    const from = nearestIndex(spots, at)
    const crossings = [...paths.keys()].filter((id) => id !== own).map(trace)
    const best = chooseLabelSpot(spots, size, { nodes, placed, crossings, bounds, from })
    if (best && best.index !== from) {
      group.setAttribute('transform', `translate(${best.spot.x.toFixed(3)}, ${best.spot.y.toFixed(3)})`)
      placed.push(best.box)
      moved += 1
    } else {
      placed.push(box)
    }
  })

  return moved
}
