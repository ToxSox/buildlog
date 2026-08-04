<script setup>
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
      <span>EMMA Build Log · {{ meta.vehicle }}<span v-if="meta.event"> · {{ meta.event }}</span></span>
      <span>Seite {{ pageNumber }} von {{ pageTotal }}</span>
    </footer>
  </section>
</template>
