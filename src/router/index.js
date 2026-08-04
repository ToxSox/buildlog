import { createRouter, createWebHashHistory } from 'vue-router'
import { useProjectStore } from '../stores/project.js'
import { stepsForMode } from '../data/steps.js'

const routes = [
  { path: '/', name: 'start', component: () => import('../views/StartView.vue') },
  {
    path: '/wizard/fahrzeug',
    name: 'vehicle',
    component: () => import('../views/VehicleView.vue'),
    meta: { step: 'vehicle' },
  },
  {
    path: '/wizard/diagramme',
    name: 'diagram',
    component: () => import('../views/DiagramView.vue'),
    meta: { step: 'diagram' },
  },
  {
    path: '/wizard/strom',
    name: 'power',
    component: () => import('../views/PowerView.vue'),
    meta: { step: 'power' },
  },
  {
    path: '/wizard/hardware',
    name: 'hardware',
    component: () => import('../views/HardwareView.vue'),
    meta: { step: 'hardware' },
  },
  {
    path: '/wizard/handwerk',
    name: 'craft',
    component: () => import('../views/CraftView.vue'),
    meta: { step: 'craft' },
  },
  {
    path: '/wizard/pruefen',
    name: 'review',
    component: () => import('../views/ReviewView.vue'),
    meta: { step: 'review' },
  },
  {
    path: '/druck',
    name: 'print',
    component: () => import('../views/PrintView.vue'),
    meta: { print: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// Ohne gewählten Modus gibt es keinen Wizard – zurück zum Start.
router.beforeEach(async (to) => {
  const store = useProjectStore()
  if (!store.ready) await store.load()

  if (to.name === 'start') return true
  if (!store.hasProject) return { name: 'start' }

  if (to.meta.step) {
    const allowed = stepsForMode(store.mode).some((s) => s.key === to.meta.step)
    if (!allowed) return { name: 'vehicle' }
  }
  return true
})

export default router
