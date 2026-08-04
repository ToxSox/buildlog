<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import WizardShell from '../components/WizardShell.vue'
import SlotGrid from '../components/SlotGrid.vue'
import ItemList from '../components/ItemList.vue'

const store = useProjectStore()
const craft = computed(() => store.project.craft)

const CUSTOM_FIELDS = [
  { key: 'name', label: 'Bauteil', placeholder: 'Hochtöner-Podest A-Säule', span: 2 },
  {
    key: 'technique',
    label: 'Fertigung',
    type: 'select',
    options: ['3D-Druck', 'GFK / Laminat', 'MDF / Holz', 'CNC-Fräsen', 'Metallbau', 'Sonstiges'],
  },
  { key: 'material', label: 'Material', placeholder: 'ASA / PETG / Epoxid-Matte' },
  { key: 'purpose', label: 'Zweck', placeholder: 'Winkelgenaue Ausrichtung auf den Hörplatz', span: 2 },
  { key: 'notes', label: 'Beschreibung des Bauprozesses', type: 'textarea', span: 2 },
]

const MEASURE_FIELDS = [
  { key: 'name', label: 'Messung', placeholder: 'Frequenzgang Fahrerplatz nach Einmessung', span: 2 },
  { key: 'tool', label: 'Messsystem', placeholder: 'REW + UMIK-1' },
  { key: 'position', label: 'Mikrofonposition', placeholder: 'Kopfposition Fahrer' },
  { key: 'result', label: 'Ergebnis / Interpretation', type: 'textarea', span: 2 },
]
</script>

<template>
  <WizardShell
    step-key="craft"
    title="Handwerk & Akustik"
    subtitle="Alles, was im fertigen Zustand nicht mehr sichtbar ist – und genau deshalb dokumentiert werden muss."
  >
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">Dämmung</h2>
          <p class="mt-0.5 text-sm text-slate-600">Beschreibe Aufbau und Material je Bereich.</p>
        </div>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-3">
        <div>
          <label class="field" for="dampDoors">Türen</label>
          <textarea
            id="dampDoors"
            v-model="craft.dampingDoors"
            class="textarea"
            placeholder="Außenblech Alubutyl 2 mm, Innenblech geschlossen, TVK entdröhnt"
          />
        </div>
        <div>
          <label class="field" for="dampFloor">Boden</label>
          <textarea id="dampFloor" v-model="craft.dampingFloor" class="textarea" placeholder="Alubutyl + Schaumauflage" />
        </div>
        <div>
          <label class="field" for="dampTrunk">Kofferraum</label>
          <textarea id="dampTrunk" v-model="craft.dampingTrunk" class="textarea" placeholder="Radhäuser und Heckklappe" />
        </div>
      </div>
    </div>

    <ItemList
      path="craft.customParts"
      title="Custom-Parts (3D-Druck, GFK, Holz)"
      intro="Der Dreiklang CAD → Fertigung → Einbau ist die stärkste Story in jeder Mappe."
      add-label="+ Bauteil"
      empty-label="Noch keine Eigenbau-Teile erfasst."
      :fields="CUSTOM_FIELDS"
      photo-slot-prefix="craft.customParts"
      photo-label="Fotos"
      photo-example="custom"
    />

    <ItemList
      path="craft.measurements"
      title="Messungen"
      intro="REW & Co. – belege, dass die Abstimmung auf Messungen basiert."
      add-label="+ Messung"
      empty-label="Noch keine Messung erfasst."
      :fields="MEASURE_FIELDS"
      photo-slot-prefix="craft.measurements"
      photo-label="Screenshots"
      photo-example="measurement"
    />

    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Tuning & Abstimmung</h2>
      </div>
      <div class="card-body">
        <textarea
          v-model="craft.tuningNotes"
          class="textarea"
          placeholder="Trennfrequenzen, Flankensteilheiten, Laufzeiten, Zielkurve, Vorgehen beim Einmessen …"
        />
      </div>
    </div>

    <SlotGrid step="craft" />
  </WizardShell>
</template>
