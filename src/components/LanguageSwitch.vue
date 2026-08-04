<script setup>
import { LANGUAGES, useI18n } from '../i18n/index.js'

const { lang, setLang, t } = useI18n()
</script>

<template>
  <div
    class="flex items-center gap-0.5 rounded-lg border border-slate-300 bg-white p-0.5"
    role="group"
    :aria-label="t('app.language')"
  >
    <button
      v-for="l in LANGUAGES"
      :key="l.id"
      type="button"
      class="rounded-md px-2 py-0.5 text-[11px] font-bold transition"
      :class="lang === l.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'"
      :aria-pressed="lang === l.id"
      :title="l.label"
      @click="setLang(l.id)"
    >
      {{ l.short }}
    </button>
  </div>
</template>
