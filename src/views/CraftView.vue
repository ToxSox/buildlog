<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import WizardShell from '../components/WizardShell.vue'
import SlotGrid from '../components/SlotGrid.vue'
import ItemList from '../components/ItemList.vue'
import { FABRICATION_TECHNIQUES } from '../data/options.js'
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()

const store = useProjectStore()
const craft = computed(() => store.project.craft)

const CUSTOM_FIELDS = [
  { key: 'name', label: { de: 'Bauteil', en: 'Part' }, placeholder: 'Hochtöner-Podest A-Säule', span: 2 },
  {
    key: 'technique',
    label: { de: 'Fertigung', en: 'Fabrication' },
    type: 'select',
    options: FABRICATION_TECHNIQUES,
  },
  { key: 'material', label: { de: 'Material', en: 'Material' }, placeholder: 'ASA / PETG / Epoxid-Matte' },
  {
    key: 'purpose',
    label: { de: 'Zweck', en: 'Purpose' },
    placeholder: 'Winkelgenaue Ausrichtung auf den Hörplatz',
    span: 2,
  },
  {
    key: 'notes',
    label: { de: 'Beschreibung des Bauprozesses', en: 'Description of the build process' },
    type: 'textarea',
    span: 2,
  },
]

const MEASURE_FIELDS = [
  {
    key: 'name',
    label: { de: 'Messung', en: 'Measurement' },
    placeholder: 'Frequenzgang Fahrerplatz nach Einmessung',
    span: 2,
  },
  { key: 'tool', label: { de: 'Messsystem', en: 'Measurement system' }, placeholder: 'REW + UMIK-1' },
  {
    key: 'position',
    label: { de: 'Mikrofonposition', en: 'Microphone position' },
    placeholder: 'Kopfposition Fahrer',
  },
  {
    key: 'result',
    label: { de: 'Ergebnis / Interpretation', en: 'Result / interpretation' },
    type: 'textarea',
    span: 2,
  },
]
</script>

<template>
  <WizardShell step-key="craft" :title="t('steps.craft')" :subtitle="t('craft.subtitle')">
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ t('craft.damping') }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ t('craft.dampingIntro') }}</p>
        </div>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-3">
        <div>
          <label class="field" for="dampDoors">{{ t('craft.doors') }}</label>
          <textarea
            id="dampDoors"
            v-model="craft.dampingDoors"
            class="textarea"
            placeholder="Außenblech Alubutyl 2 mm, Innenblech geschlossen, TVK entdröhnt"
          />
        </div>
        <div>
          <label class="field" for="dampFloor">{{ t('craft.floor') }}</label>
          <textarea
            id="dampFloor"
            v-model="craft.dampingFloor"
            class="textarea"
            placeholder="Alubutyl + Schaumauflage"
          />
        </div>
        <div>
          <label class="field" for="dampTrunk">{{ t('craft.trunk') }}</label>
          <textarea
            id="dampTrunk"
            v-model="craft.dampingTrunk"
            class="textarea"
            placeholder="Radhäuser und Heckklappe"
          />
        </div>
      </div>
    </div>

    <ItemList
      path="craft.customParts"
      :title="t('craft.customParts')"
      :intro="t('craft.customIntro')"
      add-label="+ Bauteil"
      :empty-label="t('craft.customEmpty')"
      :fields="CUSTOM_FIELDS"
      photo-slot-prefix="craft.customParts"
      :photo-label="t('craft.photosFor')"
      photo-example="custom"
    />

    <ItemList
      path="craft.measurements"
      :title="t('craft.measurements')"
      :intro="t('craft.measurementsIntro')"
      add-label="+ Messung"
      :empty-label="t('craft.measurementsEmpty')"
      :fields="MEASURE_FIELDS"
      photo-slot-prefix="craft.measurements"
      :photo-label="t('craft.screenshotsFor')"
      photo-example="measurement"
    />

    <div class="card">
      <div class="card-header">
        <h2 class="section-title" id="craft-tuning-title">{{ t('craft.tuning') }}</h2>
      </div>
      <div class="card-body">
        <textarea
          id="tuning"
          v-model="craft.tuningNotes"
          class="textarea"
          aria-labelledby="craft-tuning-title"
          :placeholder="t('craft.tuningPlaceholder')"
        />
      </div>
    </div>

    <SlotGrid step="craft" />
  </WizardShell>
</template>
