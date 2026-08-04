<script setup>
import { useI18n } from '../i18n/index.js'

const { t } = useI18n()

defineProps({
  title: { type: String, default: '' },
  meta: { type: Object, required: true },
  pageNumber: { type: Number, default: 1 },
  pageTotal: { type: Number, default: 1 },
})
</script>

<template>
  <section class="print-page">
    <header class="print-head">
      <div class="print-head__title">{{ title }}</div>
      <div class="print-head__meta">
        <div><strong>{{ meta.name || '—' }}</strong></div>
        <div>{{ meta.className || '—' }}<span v-if="meta.plate"> · {{ meta.plate }}</span></div>
        <div>{{ meta.vehicle }}</div>
      </div>
    </header>

    <div class="print-body">
      <slot />
    </div>

    <footer class="print-foot">
      <span>{{ t('app.name') }} · {{ meta.vehicle }}<span v-if="meta.event"> · {{ meta.event }}</span></span>
      <span>{{ t('print.page', { current: pageNumber, total: pageTotal }) }}</span>
    </footer>
  </section>
</template>
