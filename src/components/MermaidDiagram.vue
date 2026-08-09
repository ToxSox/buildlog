<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from '../i18n/index.js'
import { declutterEdgeLabels } from '../utils/edgeLabels.js'

const { t } = useI18n()

const props = defineProps({
  definition: { type: String, default: '' },
  idPrefix: { type: String, default: 'diagram' },
})

const svg = ref('')
const error = ref('')
const host = ref(null)
let mermaidLib = null
let counter = 0
/** Zählt die Renderläufe: Ein langsamer Lauf darf ein neueres Diagramm nicht überschreiben. */
let runId = 0
let timer = null

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
  const run = ++runId
  error.value = ''
  if (!props.definition) {
    svg.value = ''
    return
  }
  try {
    const mermaid = await ensureMermaid()
    counter += 1
    const { svg: out } = await mermaid.render(`${props.idPrefix}-${counter}`, props.definition)
    if (run !== runId) return
    svg.value = out
    await nextTick()
    if (run !== runId) return
    // Läuft nach dem Einhängen, weil die Beschriftungen erst im Dokument
    // vermessen werden können. Ein Fehler darf höchstens die Feinarbeit
    // kosten, nie das ganze Diagramm.
    try {
      declutterEdgeLabels(host.value?.querySelector('svg'))
    } catch (err) {
      console.warn('[emma] Kanten-Beschriftungen konnten nicht entzerrt werden', err)
    }
  } catch (err) {
    if (run !== runId) return
    console.error('[emma] Diagramm konnte nicht gerendert werden', err)
    error.value = t('diagram.renderError')
    svg.value = ''
  }
}

/** Beim Tippen ändert sich die Definition pro Zeichen – ohne Pause flackert das Diagramm. */
function scheduleRender() {
  clearTimeout(timer)
  timer = setTimeout(render, 180)
}

onMounted(render)
watch(() => props.definition, scheduleRender)
onBeforeUnmount(() => {
  clearTimeout(timer)
  runId += 1
})
</script>

<template>
  <div>
    <!-- eslint-disable-next-line vue/no-v-html -- von mermaid erzeugtes SVG, mermaid laeuft mit securityLevel "strict" -->
    <div v-if="svg" ref="host" class="mermaid-host overflow-x-auto" v-html="svg" />
    <p v-else-if="error" class="text-sm text-rose-600">{{ error }}</p>
    <p
      v-else
      class="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500"
    >
      {{ t('diagram.empty2') }}
    </p>
  </div>
</template>

<style>
.mermaid-host svg {
  max-width: 100%;
  height: auto;
}
</style>
