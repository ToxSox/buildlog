<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project.js'
import { MODES } from '../data/schema.js'

const router = useRouter()
const store = useProjectStore()

const hasSaved = computed(() => store.hasProject)

const modes = [
  {
    id: MODES.QUICK,
    icon: '🚑',
    title: 'Quick Rescue',
    claim: 'Show ist morgen, Mappe ist leer.',
    bullets: [
      'Nur die sicherheitsrelevanten Pflichtangaben',
      'Strom, Absicherung, Befestigung, Blockdiagramm',
      'In ca. 20 Minuten druckfertig',
    ],
    accent: 'from-rose-500 to-orange-500',
  },
  {
    id: MODES.MASTER,
    icon: '🏆',
    title: 'SQ Masterclass',
    claim: 'Der komplette Bauprozess, lückenlos belegt.',
    bullets: [
      'Alles aus Quick Rescue',
      'Plus Türdämmung Schicht für Schicht, Terminierung unter dem Teppich',
      'Plus Custom-Parts, GFK, 3D-Druck und REW-Messungen',
    ],
    accent: 'from-sky-500 to-indigo-500',
  },
]

function start(mode) {
  if (hasSaved.value) {
    const ok = window.confirm(
      'Es liegt bereits ein gespeichertes Projekt vor. Ein neues Projekt zu starten löscht die aktuelle Mappe. Fortfahren?',
    )
    if (!ok) return
  }
  store.startProject(mode)
  router.push('/wizard/fahrzeug')
}

function resume() {
  router.push('/wizard/fahrzeug')
}
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-2xl bg-slate-900 px-6 py-8 text-white sm:px-10 sm:py-12">
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">EMMA Build Log Creator</p>
      <h1 class="mt-2 text-3xl font-black leading-tight sm:text-4xl">
        Deine Einbaudokumentation.<br class="hidden sm:block" />
        Geführt, regelkonform, druckfertig.
      </h1>
      <p class="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
        Der Assistent fragt genau das ab, was die Richter sehen wollen – prüft deine Absicherung live gegen
        das Regelwerk und wirft am Ende ein DIN-A4-Querformat-Dokument aus. Alles läuft lokal in deinem
        Browser: keine Uploads, kein Konto, kein Server.
      </p>
      <div class="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-300">
        <span class="rounded-full bg-white/10 px-3 py-1">100 % offline</span>
        <span class="rounded-full bg-white/10 px-3 py-1">Autosave im Browser</span>
        <span class="rounded-full bg-white/10 px-3 py-1">Handy-Kamera direkt nutzbar</span>
        <span class="rounded-full bg-white/10 px-3 py-1">ZIP-Export für später</span>
      </div>
    </section>

    <div v-if="hasSaved" class="card card-body flex flex-wrap items-center justify-between gap-3 border-sky-200 bg-sky-50">
      <div>
        <p class="text-sm font-bold text-sky-900">Gespeicherte Mappe gefunden</p>
        <p class="text-xs text-sky-800">
          {{ store.title }} · {{ store.mode }} ·
          zuletzt geändert
          {{ new Date(store.project.updatedAt).toLocaleString('de-DE') }}
        </p>
      </div>
      <button type="button" class="btn-primary" @click="resume">Weiterarbeiten →</button>
    </div>

    <section>
      <h2 class="section-title mb-3">Womit möchtest du starten?</h2>
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
            <p class="mt-4 text-sm font-bold text-sky-600 group-hover:underline">Modus starten →</p>
          </div>
        </button>
      </div>
      <p class="mt-3 text-xs text-slate-500">
        Der Modus lässt sich später im Schritt „Fahrzeug &amp; Klasse“ jederzeit wechseln – eingegebene Daten
        bleiben dabei erhalten.
      </p>
    </section>
  </div>
</template>
