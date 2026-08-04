<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import { sectionsForStep } from '../data/sections.js'
import PhotoSlot from './PhotoSlot.vue'
import { useI18n } from '../i18n/index.js'

const { tx } = useI18n()

const props = defineProps({
  step: { type: String, required: true },
})

const store = useProjectStore()
const sections = computed(() => sectionsForStep(props.step, store.column, store.mode))
</script>

<template>
  <div class="space-y-6">
    <section v-for="section in sections" :key="section.key" class="card">
      <div class="card-header">
        <div>
          <h2 class="section-title">{{ tx(section.title) }}</h2>
          <p v-if="tx(section.intro)" class="mt-0.5 text-sm text-slate-600">{{ tx(section.intro) }}</p>
        </div>
      </div>
      <div class="card-body grid gap-4 sm:grid-cols-2">
        <PhotoSlot v-for="slot in section.slots" :key="slot.key" :slot-def="slot" />
      </div>
    </section>
  </div>
</template>
