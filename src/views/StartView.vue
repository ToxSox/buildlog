<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project.js'
import { MODES, EMMA_CLASSES } from '../data/schema.js'
import ArchiveTools from '../components/ArchiveTools.vue'
import { useI18n } from '../i18n/index.js'

const { t, locale } = useI18n()

const router = useRouter()
const store = useProjectStore()

const savedProjects = computed(() => [...store.projects].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)))

const className = (id) => EMMA_CLASSES.find((c) => c.id === id)?.label || '–'
const formatDate = (iso) =>
  new Date(iso).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' })

const modes = computed(() => [
  {
    id: MODES.QUICK,
    icon: '🚑',
    title: t('start.quick.title'),
    claim: t('start.quick.claim'),
    bullets: [t('start.quick.b1'), t('start.quick.b2'), t('start.quick.b3')],
    accent: 'from-rose-500 to-orange-500',
  },
  {
    id: MODES.MASTER,
    icon: '🏆',
    title: t('start.master.title'),
    claim: t('start.master.claim'),
    bullets: [t('start.master.b1'), t('start.master.b2'), t('start.master.b3')],
    accent: 'from-sky-500 to-indigo-500',
  },
])

async function start(mode) {
  await store.startProject(mode)
  router.push('/wizard/fahrzeug')
}

async function open(id) {
  await store.switchTo(id)
  router.push('/wizard/fahrzeug')
}

async function duplicate(id) {
  await store.switchTo(id)
  const newId = await store.duplicateActive(t('start.copySuffix'))
  if (newId) await store.switchTo(newId)
  router.push('/wizard/fahrzeug')
}

async function remove(entry) {
  const ok = window.confirm(t('start.deleteConfirm', { title: entry.title, photos: entry.photos }))
  if (ok) await store.deleteProject(entry.id)
}
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-2xl bg-slate-900 px-6 py-8 text-white sm:px-10 sm:py-12">
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">{{ t('start.kicker') }}</p>
      <h1 class="mt-2 text-3xl font-black leading-tight sm:text-4xl">
        {{ t('start.headline') }}<br class="hidden sm:block" />
        {{ t('start.headline2') }}
      </h1>
      <p class="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{{ t('start.lead') }}</p>
      <div class="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-300">
        <span class="rounded-full bg-white/10 px-3 py-1">{{ t('start.badgeOffline') }}</span>
        <span class="rounded-full bg-white/10 px-3 py-1">{{ t('start.badgeAutosave') }}</span>
        <span class="rounded-full bg-white/10 px-3 py-1">{{ t('start.badgeCamera') }}</span>
        <span class="rounded-full bg-white/10 px-3 py-1">{{ t('start.badgeZip') }}</span>
      </div>
    </section>

    <section v-if="savedProjects.length">
      <h2 class="section-title mb-3">{{ t('start.yourProjects') }}</h2>
      <ul class="space-y-2">
        <li
          v-for="entry in savedProjects"
          :key="entry.id"
          class="card card-body flex flex-wrap items-center gap-3"
          :class="entry.id === store.activeId ? 'border-sky-300 bg-sky-50' : ''"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-slate-900">
              {{ entry.title || t('start.untitled') }}
              <span v-if="entry.id === store.activeId" class="badge ml-1 bg-sky-600 text-white">{{
                t('start.active')
              }}</span>
            </p>
            <p class="truncate text-xs text-slate-500">
              {{ className(entry.emmaClass) }} · {{ t('common.photos', { n: entry.photos }) }} ·
              {{ t('start.changedAt', { date: formatDate(entry.updatedAt) }) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-primary btn-xs" @click="open(entry.id)">
              {{ t('common.open') }}
            </button>
            <button type="button" class="btn-soft btn-xs" @click="duplicate(entry.id)">
              {{ t('common.duplicate') }}
            </button>
            <button type="button" class="btn-ghost btn-xs !text-rose-600" @click="remove(entry)">
              {{ t('common.delete') }}
            </button>
          </div>
        </li>
      </ul>
      <p class="mt-2 text-xs text-slate-500">
        {{ t('start.duplicateHint') }}
      </p>
    </section>

    <section>
      <h2 class="section-title mb-3">
        {{ savedProjects.length ? t('start.newProject') : t('start.chooseStart') }}
      </h2>
      <div class="grid gap-4 md:grid-cols-2">
        <button
          v-for="m in modes"
          :key="m.id"
          type="button"
          class="card group text-left transition hover:-translate-y-0.5 hover:shadow-lg"
          @click="start(m.id)"
        >
          <div class="h-1.5 rounded-t-xl bg-gradient-to-r" :class="m.accent" />
          <div class="card-body">
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ m.icon }}</span>
              <div>
                <h3 class="text-lg font-extrabold text-slate-900">{{ m.title }}</h3>
                <p class="text-xs text-slate-500">{{ m.claim }}</p>
              </div>
            </div>
            <ul class="mt-4 space-y-1.5">
              <li v-for="b in m.bullets" :key="b" class="flex gap-2 text-sm text-slate-700">
                <span class="text-sky-500">✓</span><span>{{ b }}</span>
              </li>
            </ul>
            <p class="mt-4 text-sm font-bold text-sky-600 group-hover:underline">
              {{ t('start.startMode') }}
            </p>
          </div>
        </button>
      </div>
      <p class="mt-3 text-xs text-slate-500">
        {{ t('start.modeHint') }}
      </p>
    </section>

    <section>
      <h2 class="section-title mb-3">{{ t('start.loadZip') }}</h2>
      <ArchiveTools variant="import" />
      <p class="mt-2 text-xs text-slate-500">
        {{ t('start.loadZipHint') }}
      </p>
    </section>
  </div>
</template>
