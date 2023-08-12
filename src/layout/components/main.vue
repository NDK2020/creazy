<template>
  <router-view v-slot="{ Component, route }" class="content-width-boxed" >
    <transition name="fade-slide" mode="out-in" appear>
      <keep-alive>
        <component :is="Component" :key="route.fullPath" />
      </keep-alive>
    </transition>
  </router-view>
</template>

<script setup lang="ts">
//import type { CSSProperties } from "vue";

/*
interface Props {
  header_height: string,
  sidebar_width: string
}

const props = withDefaults(defineProps<Props>(), {
  header_height: "80px",
  sidebar_width: "100px"
})


const styles = computed<CSSProperties>(() => {
  return {
    width: 100% - props.sidebar_width,
    marginTop: props.header_height
  }
})
*/

</script>

<style lang="scss"> </style>
