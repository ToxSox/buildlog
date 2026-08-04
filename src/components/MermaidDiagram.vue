<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  definition: { type: String, default: '' },
  idPrefix: { type: String, default: 'diagram' },
})

const svg = ref('')
const error = ref('')
let mermaidLib = null
let counter = 0

async function ensureMermaid() {
  if (mermaidLib) return mermaidLib
  const mod = await import('mermaid')
  mermaidLib = mod.default
  mermaidLib.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    flowchart: { htmlLabels: true, curve: 'basis', padding: 12 },
    themeVariables: {
      fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
      fontSize: '14px',
      lineColor: '#475569',
    },
  })
  return mermaidLib
}

async function render() {
  error.value = ''
  if (!props.definition) {
    svg.value = ''
    return
  }
  try {
    const mermaid = await ensureMermaid()
    counter += 1
    const { svg: out } = await mermaid.render(`${props.idPrefix}-${counter}`, props.definition)
    svg.value = out
  } catch (err) {
    console.error('[emma] Diagramm konnte nicht gerendert werden', err)
    error.value = 'Diagramm konnte nicht gezeichnet werden. Prüfe die Bezeichnungen der Komponenten.'
    svg.value = ''
  }
}

onMounted(render)
watch(() => props.definition, render)
</script>

<template>
  <div>
    <div v-if="svg" class="mermaid-host overflow-x-auto" v-html="svg" />
    <p v-else-if="error" class="text-sm text-rose-600">{{ error }}</p>
    <p v-else class="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
      Lege Komponenten an und verbinde sie – das Diagramm entsteht automatisch.
    </p>
  </div>
</template>

<style>
.mermaid-host svg {
  max-width: 100%;
  height: auto;
}
</style>
