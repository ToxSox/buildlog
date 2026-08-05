<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import WizardShell from '../components/WizardShell.vue'
import SlotGrid from '../components/SlotGrid.vue'
import ComponentEnrichmentList from '../components/ComponentEnrichmentList.vue'
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()

const store = useProjectStore()
const hardware = computed(() => store.project.hardware)

/**
 * name/channels sind die geteilten Felder der zentralen Komponente aus dem
 * Blockdiagramm; alles mit source 'install' sind Montage-Details dieser Seite.
 */
const AMP_FIELDS = [
  {
    key: 'name',
    source: 'component',
    label: { de: 'Hersteller / Modell', en: 'Manufacturer / model' },
    placeholder: 'Audison AP8.9 bit',
    span: 2,
  },
  { key: 'channels', source: 'component', label: { de: 'Kanäle', en: 'Channels' }, placeholder: '8' },
  {
    key: 'power',
    source: 'install',
    label: { de: 'Leistung (RMS)', en: 'Power (RMS)' },
    placeholder: '8 × 85 W',
  },
  {
    key: 'location',
    source: 'install',
    label: { de: 'Einbauort', en: 'Location' },
    placeholder: 'Unter dem Beifahrersitz',
  },
  {
    key: 'mounting',
    source: 'install',
    label: { de: 'Befestigung', en: 'Mounting' },
    placeholder: 'MDF-Platte, M6 verschraubt',
  },
]

const DSP_FIELDS = [
  {
    key: 'name',
    source: 'component',
    label: { de: 'Hersteller / Modell', en: 'Manufacturer / model' },
    placeholder: 'Helix DSP.3',
    span: 2,
  },
  {
    key: 'channels',
    source: 'component',
    label: { de: 'Ein-/Ausgänge', en: 'Inputs / outputs' },
    placeholder: '6 in / 8 out',
  },
  {
    key: 'location',
    source: 'install',
    label: { de: 'Einbauort', en: 'Location' },
    placeholder: 'Hinter Handschuhfach',
  },
  {
    key: 'mounting',
    source: 'install',
    label: { de: 'Befestigung', en: 'Mounting' },
    placeholder: 'Alu-Halter, verschraubt',
  },
  {
    key: 'input',
    source: 'install',
    label: { de: 'Signalquelle', en: 'Signal source' },
    placeholder: 'Hochpegel ab Werksradio',
  },
]

const SPEAKER_FIELDS = [
  {
    key: 'name',
    source: 'component',
    label: { de: 'Hersteller / Modell', en: 'Manufacturer / model' },
    placeholder: 'Gladen RS 165',
    span: 2,
  },
  {
    key: 'position',
    source: 'install',
    label: { de: 'Position', en: 'Position' },
    placeholder: 'Tür vorne links',
  },
  { key: 'size', source: 'install', label: { de: 'Größe', en: 'Size' }, placeholder: '165 mm' },
  {
    key: 'mounting',
    source: 'install',
    label: { de: 'Montage / Adapter', en: 'Mounting / adapter' },
    placeholder: 'MDF-Ring, mit Karosserie verschraubt',
  },
  {
    key: 'wiring',
    source: 'install',
    label: { de: 'Kabel (mm²)', en: 'Cable (mm²)' },
    placeholder: '2,5',
  },
]

const SUB_FIELDS = [
  {
    key: 'name',
    source: 'component',
    label: { de: 'Hersteller / Modell', en: 'Manufacturer / model' },
    placeholder: 'Ground Zero GZPW 12',
    span: 2,
  },
  {
    key: 'enclosure',
    source: 'install',
    label: { de: 'Gehäuse', en: 'Enclosure' },
    placeholder: 'Geschlossen 32 l',
  },
  {
    key: 'volume',
    source: 'install',
    label: { de: 'Volumen / Abstimmung', en: 'Volume / tuning' },
    placeholder: '32 l / geschlossen',
  },
  {
    key: 'location',
    source: 'install',
    label: { de: 'Einbauort', en: 'Location' },
    placeholder: 'Reserveradmulde',
  },
  {
    key: 'securing',
    source: 'install',
    label: { de: 'Sicherung gegen Verrutschen', en: 'Secured against movement' },
    placeholder: 'Verschraubt + Spanngurt',
  },
]
</script>

<template>
  <WizardShell step-key="hardware" :title="t('steps.hardware')" :subtitle="t('hardware.subtitle')">
    <p class="text-xs text-slate-500">{{ t('hardware.sharedHint') }}</p>

    <ComponentEnrichmentList
      type="amp"
      :title="t('hardware.amps')"
      :intro="t('hardware.ampsIntro')"
      add-label="+ Endstufe"
      :empty-label="t('hardware.ampsEmpty')"
      :fields="AMP_FIELDS"
      show-fuse
    />

    <ComponentEnrichmentList
      type="dsp"
      :title="t('hardware.dsp')"
      add-label="+ DSP"
      :empty-label="t('hardware.dspEmpty')"
      :fields="DSP_FIELDS"
      show-fuse
    />

    <ComponentEnrichmentList
      type="speaker"
      :title="t('hardware.speakers')"
      :intro="t('hardware.speakersIntro')"
      add-label="+ Lautsprecher"
      :empty-label="t('hardware.speakersEmpty')"
      :fields="SPEAKER_FIELDS"
    />

    <ComponentEnrichmentList
      type="sub"
      :title="t('hardware.subs')"
      add-label="+ Subwoofer"
      :empty-label="t('hardware.subsEmpty')"
      :fields="SUB_FIELDS"
    />

    <div class="card">
      <div class="card-header">
        <h2 id="hardware-notes-title" class="section-title">{{ t('hardware.notes') }}</h2>
      </div>
      <div class="card-body">
        <textarea
          id="hardware-notes"
          v-model="hardware.mountingNotes"
          class="textarea"
          aria-labelledby="hardware-notes-title"
          :placeholder="t('hardware.notesPlaceholder')"
        />
      </div>
    </div>

    <SlotGrid step="hardware" />
  </WizardShell>
</template>
