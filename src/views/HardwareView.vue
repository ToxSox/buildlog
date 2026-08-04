<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import WizardShell from '../components/WizardShell.vue'
import SlotGrid from '../components/SlotGrid.vue'
import ItemList from '../components/ItemList.vue'

const store = useProjectStore()
const hardware = computed(() => store.project.hardware)

const AMP_FIELDS = [
  { key: 'brand', label: 'Hersteller / Modell', placeholder: 'Audison AP8.9 bit', span: 2 },
  { key: 'channels', label: 'Kanäle', placeholder: '8' },
  { key: 'power', label: 'Leistung (RMS)', placeholder: '8 × 85 W' },
  { key: 'location', label: 'Einbauort', placeholder: 'Unter dem Beifahrersitz' },
  { key: 'mounting', label: 'Befestigung', placeholder: 'MDF-Platte, M6 verschraubt' },
  { key: 'fuse', label: 'Absicherung (A)', placeholder: '60' },
]

const DSP_FIELDS = [
  { key: 'brand', label: 'Hersteller / Modell', placeholder: 'Helix DSP.3', span: 2 },
  { key: 'channels', label: 'Ein-/Ausgänge', placeholder: '6 in / 8 out' },
  { key: 'location', label: 'Einbauort', placeholder: 'Hinter Handschuhfach' },
  { key: 'mounting', label: 'Befestigung', placeholder: 'Alu-Halter, verschraubt' },
  { key: 'input', label: 'Signalquelle', placeholder: 'Hochpegel ab Werksradio' },
]

const SPEAKER_FIELDS = [
  { key: 'brand', label: 'Hersteller / Modell', placeholder: 'Gladen RS 165', span: 2 },
  { key: 'position', label: 'Position', placeholder: 'Tür vorne links' },
  { key: 'size', label: 'Größe', placeholder: '165 mm' },
  { key: 'mounting', label: 'Montage / Adapter', placeholder: 'MDF-Ring, mit Karosserie verschraubt' },
  { key: 'wiring', label: 'Kabel (mm²)', placeholder: '2,5' },
]

const SUB_FIELDS = [
  { key: 'brand', label: 'Hersteller / Modell', placeholder: 'Ground Zero GZPW 12', span: 2 },
  { key: 'enclosure', label: 'Gehäuse', placeholder: 'Geschlossen 32 l' },
  { key: 'volume', label: 'Volumen / Abstimmung', placeholder: '32 l / geschlossen' },
  { key: 'location', label: 'Einbauort', placeholder: 'Reserveradmulde' },
  { key: 'securing', label: 'Sicherung gegen Verrutschen', placeholder: 'Verschraubt + Spanngurt' },
]
</script>

<template>
  <WizardShell
    step-key="hardware"
    title="Hardware-Montage"
    subtitle="Was ist verbaut, wo sitzt es und wie ist es befestigt? Jede Komponente muss sicher montiert sein."
  >
    <ItemList
      path="hardware.amps"
      title="Endstufen"
      intro="Alle Verstärker inklusive Einbauort und Befestigungsart."
      add-label="+ Endstufe"
      empty-label="Noch keine Endstufe erfasst."
      :fields="AMP_FIELDS"
    />

    <ItemList
      path="hardware.dsp"
      title="DSP / Signalprozessor"
      add-label="+ DSP"
      empty-label="Kein DSP erfasst."
      :fields="DSP_FIELDS"
    />

    <ItemList
      path="hardware.speakers"
      title="Lautsprecher"
      intro="Jede Position einzeln – der Richter gleicht das mit dem Blockdiagramm ab."
      add-label="+ Lautsprecher"
      empty-label="Noch keine Lautsprecher erfasst."
      :fields="SPEAKER_FIELDS"
    />

    <ItemList
      path="hardware.subs"
      title="Subwoofer"
      add-label="+ Subwoofer"
      empty-label="Kein Subwoofer erfasst."
      :fields="SUB_FIELDS"
    />

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Anmerkungen zur Montage</h2>
      </div>
      <div class="card-body">
        <textarea
          v-model="hardware.mountingNotes"
          class="textarea"
          placeholder="Besonderheiten: reversibler Einbau, Originalbohrungen genutzt, Entkopplung, Kühlung …"
        />
      </div>
    </div>

    <SlotGrid step="hardware" />
  </WizardShell>
</template>
