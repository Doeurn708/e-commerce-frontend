<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import ToastContainer from './components/ToastContainer.vue'

const route = useRoute()

const isBare = computed(
  () => route.path.startsWith('/admin') || route.meta.guestOnly === true,
)
</script>

<template>
  <div class="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-950">
    <Navbar v-if="!isBare" />
    <main :class="!isBare ? 'min-h-[60vh]' : 'min-h-screen'">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <Footer v-if="!isBare" />
    <ToastContainer />
  </div>
</template>