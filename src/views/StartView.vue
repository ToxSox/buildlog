<script setup>
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project.js'
import { MODES } from '../data/schema.js'
const router = useRouter()
const store = useProjectStore()
function start(mode) {
  store.startProject(mode)
  router.push('/wizard/fahrzeug')
}
</script>
<template>
  <div class="card card-body space-y-3">
    <h1 class="section-title">Modus wählen</h1>
    <button class="btn-primary" @click="start(MODES.QUICK)">Quick Rescue</button>
    <button class="btn-primary" @click="start(MODES.MASTER)">SQ Masterclass</button>
  </div>
</template>
