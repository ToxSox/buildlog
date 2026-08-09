import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { allSlots, requiredSlots } from '../data/sections.js'
import { assessProject } from '../data/assessment.js'
import { COLUMN_LABELS } from '../data/matrix.js'
import { translate } from '../i18n/index.js'

/**
 * Fortschritt und Selbsteinschätzung.
 *
 * Statt einer erfundenen 100-Punkte-Skala rechnet die App jetzt gegen die
 * echte Installation Matrix der gewählten Kategorie (E 69 … X Unlimited 325).
 * Solange keine Kategorie gewählt ist, bleibt nur der Foto-Fortschritt übrig.
 */
export function useScore() {
  const store = useProjectStore()

  const column = computed(() => store.column)
  const columnLabel = computed(() => (column.value ? COLUMN_LABELS[column.value] : ''))

  const assessment = computed(() => assessProject(store.project, column.value))

  /** Reiner Foto-Fortschritt – funktioniert auch ohne gewählte Kategorie. */
  const photos = computed(() => {
    const required = requiredSlots(column.value)
    const done = required.filter((s) => store.mediaFor(s.key).length > 0 || store.isVisibleNoPhoto(s.key))
    return {
      done: done.length,
      total: required.length,
      percent: required.length ? Math.round((done.length / required.length) * 100) : 0,
    }
  })

  /** Balken im Header: Matrix-Prozent, solange eine Kategorie gewählt ist. */
  const percent = computed(() => (column.value ? assessment.value.percent : photos.value.percent))
  const score = computed(() => (column.value ? assessment.value.earned : photos.value.done))
  const maxScore = computed(() => (column.value ? assessment.value.max : photos.value.total))

  const level = computed(() => {
    if (!column.value) return translate('level.noCategory')
    if (assessment.value.unrated) return translate('level.unrated', { n: assessment.value.unrated })
    if (percent.value >= 90) return translate('level.showcase')
    if (percent.value >= 75) return translate('level.judgeReady')
    if (percent.value >= 50) return translate('level.solid')
    if (percent.value >= 25) return translate('level.foundation')
    return translate('level.shell')
  })

  const missingRequired = computed(() =>
    requiredSlots(column.value).filter(
      (s) => store.mediaFor(s.key).length === 0 && !store.isVisibleNoPhoto(s.key),
    ),
  )

  function missingForStep(step) {
    return missingRequired.value.filter((s) => s.section.step === step)
  }

  /**
   * Pflichtangaben, die kein Foto sind.
   *
   * Das „*“ hinter drei Feldern der Fahrzeugseite war bisher ein an den
   * Labeltext gehängtes Zeichen: für assistive Technik unsichtbar und durch
   * nichts hinterlegt. Der Teilnehmername konnte auf dem gedruckten Deckblatt
   * fehlen, ohne dass die App je gewarnt hätte.
   *
   * Die Einträge sind bewusst wie Foto-Slots geformt (`key`, `label`, `tip`),
   * damit sie ohne Sonderbehandlung im SkipDialog neben den fehlenden Fotos
   * stehen können. `meta: true` unterscheidet sie dort, wo es darauf ankommt:
   * Ein übersprungenes Textfeld darf keinen Skip-Eintrag ins Projekt schreiben.
   */
  const REQUIRED_META = [
    { field: 'participantName', labelKey: 'vehicle.participantName', tipKey: 'vehicle.whyParticipant' },
    { field: 'vehicleMake', labelKey: 'vehicle.make', tipKey: 'vehicle.whyVehicle' },
    { field: 'vehicleModel', labelKey: 'vehicle.model', tipKey: 'vehicle.whyVehicle' },
  ]

  const missingMeta = computed(() =>
    REQUIRED_META.filter(({ field }) => !String(store.project.meta[field] || '').trim()).map((entry) => ({
      key: `meta.${entry.field}`,
      label: translate(entry.labelKey),
      tip: translate(entry.tipKey),
      hint: '',
      meta: true,
    })),
  )

  /** Die Stammdaten hängen alle am ersten Schritt. */
  function missingMetaForStep(step) {
    return step === 'vehicle' ? missingMeta.value : []
  }

  /**
   * Wie viele Pflichtangaben ein Schritt überhaupt hat.
   *
   * `missingForStep` allein kann einen Schritt nicht als erledigt ausweisen:
   * Ohne gewählte Kategorie liefert `requiredSlots` eine leere Liste, weil
   * `isSlotRequired` ohne Spalte immer false ist – dann fehlt nichts, obwohl
   * noch nichts da ist. Dasselbe gilt für Schritte, die in der gewählten
   * Kategorie gar kein Pflichtfoto führen. Ein Haken wäre dort eine Aussage
   * über etwas, das die App nicht geprüft hat.
   */
  function requiredCountForStep(step) {
    const photos = requiredSlots(column.value).filter((s) => s.section.step === step).length
    return photos + (step === 'vehicle' ? REQUIRED_META.length : 0)
  }

  const visibleSlots = computed(() => allSlots(column.value, store.mode))

  return {
    column,
    columnLabel,
    assessment,
    photos,
    score,
    maxScore,
    percent,
    level,
    missingRequired,
    missingForStep,
    missingMeta,
    missingMetaForStep,
    requiredCountForStep,
    visibleSlots,
  }
}
