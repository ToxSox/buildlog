import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { allSlots } from '../data/sections.js'
import { evaluateRules } from '../data/emmaRules.js'

const LEVELS = [
  { min: 0, label: 'Rohbau – hier fehlt dem Richter noch alles' },
  { min: 25, label: 'Grundgerüst steht' },
  { min: 50, label: 'Solide Mappe – weiter so' },
  { min: 75, label: 'Richtertauglich' },
  { min: 95, label: 'Vorzeigemappe 💪' },
]

/**
 * Gamification: Der Balken füllt sich mit jedem Pflichtfoto und jeder
 * bestandenen Sicherheitsprüfung. Ergebnis ist immer auf 100 normiert.
 */
export function useScore() {
  const store = useProjectStore()

  const slots = computed(() => allSlots(store.mode))

  const mediaPoints = computed(() => {
    let earned = 0
    let possible = 0
    for (const slot of slots.value) {
      const isRequired = slot.required.includes(store.mode)
      const weight = isRequired ? slot.points : Math.max(1, Math.round(slot.points / 2))
      possible += weight
      const count = store.mediaFor(slot.key).length
      if (count > 0) {
        // Erstes Bild gibt volle Punkte, jedes weitere Detailfoto einen Bonus.
        earned += weight + Math.min(count - 1, 2) * 0.5
      }
    }
    return { earned, possible }
  })

  const rulePoints = computed(() => {
    const findings = evaluateRules(store.project)
    const errors = findings.filter((f) => f.severity === 'error').length
    const warnings = findings.filter((f) => f.severity === 'warn').length
    const possible = 25
    const penalty = errors * 8 + warnings * 3
    return { earned: Math.max(0, possible - penalty), possible, errors, warnings }
  })

  const metaPoints = computed(() => {
    const m = store.project.meta
    const fields = [m.participantName, m.vehicleMake, m.vehicleModel, m.emmaClass]
    const earned = fields.filter(Boolean).length * 2
    return { earned, possible: fields.length * 2 }
  })

  const diagramPoints = computed(() => {
    const sys = store.project.system
    const hasComponents = sys.components.length >= 2
    const hasLinks = sys.signalLinks.length >= 1
    return { earned: (hasComponents ? 5 : 0) + (hasLinks ? 5 : 0), possible: 10 }
  })

  const raw = computed(() => {
    const parts = [mediaPoints.value, rulePoints.value, metaPoints.value, diagramPoints.value]
    return parts.reduce(
      (acc, p) => ({ earned: acc.earned + p.earned, possible: acc.possible + p.possible }),
      { earned: 0, possible: 0 },
    )
  })

  const percent = computed(() => {
    if (!raw.value.possible) return 0
    return Math.min(100, Math.round((raw.value.earned / raw.value.possible) * 100))
  })

  const maxScore = computed(() => 100)
  const score = computed(() => percent.value)

  const level = computed(() => {
    const match = [...LEVELS].reverse().find((l) => percent.value >= l.min)
    return match ? match.label : ''
  })

  /** Pflicht-Slots ohne Bild (für "Fehlt noch"-Listen). */
  const missingRequired = computed(() =>
    slots.value.filter((s) => s.required.includes(store.mode) && store.mediaFor(s.key).length === 0),
  )

  function missingForStep(step) {
    return missingRequired.value.filter((s) => s.section.step === step)
  }

  return {
    score,
    maxScore,
    percent,
    level,
    mediaPoints,
    rulePoints,
    metaPoints,
    diagramPoints,
    missingRequired,
    missingForStep,
  }
}
