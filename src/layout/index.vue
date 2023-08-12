<template>
  <div class="h-screen w-screen">

    <div class="flex-start gap-0">

      <layout-header 
        :sidebar_width="sidebar_width" 
        @get-height="( h) => header_height = h"
      />

      <layout-sidebar 
        :header_height="header_height"
        @get-width="(w) => sidebar_width = w" 
      />

    </div>

    <div class="main-wrapper flex-start gap-0">
      <div class="empty-left-section" :style="{width: sidebar_width}"></div>
      <layout-main  />
    </div>

  </div>
</template>

<script setup lang="ts">
import { LayoutMain, LayoutSidebar, LayoutHeader } from "./components";
const sidebar_width = ref("200px")
const header_height = ref("80px")
</script>
