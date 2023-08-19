<template>
  <a-dropdown-button @click="on_click_dropdown" class="midi-reader-dropdown">
    Game
    <template #overlay>
      <a-menu @click="on_click_menu">
        <a-menu-item key="1">
          <div class="flex-center menu-item">
            <Icon icon="svg-spinners:blocks-shuffle-3" class="text-black text-8xl" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">
              pi/bh
            </p>
          </div>
        </a-menu-item>

        <a-menu-item key="2">
          <div class="flex-center">
            <Icon icon="emojione:cat-face-with-wry-smile" flip="horizontal" :style="{ fontSize: '28px' }" />

            <Icon icon="emojione:cat-face-with-wry-smile" :style="{ fontSize: '28px' }" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">gduc</p>
          </div>
        </a-menu-item>

        <a-menu-item key="3">
          <div class="flex-center">
            <Icon icon="game-icons:horizon-road" :style="{ fontSize: '28px', color: 'black'}" />

            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">dr</p>
          </div>
        </a-menu-item>

      </a-menu>
    </template>

    <template #icon>
      <Icon icon="svg-spinners:3-dots-move" :style="{ fontSize: '28px' }" />
    </template>
  </a-dropdown-button>
</template>

<script setup lang="ts">
import type { MenuProps } from "ant-design-vue";
import { Icon } from "@iconify/vue";

const emit = defineEmits(["dropdown-select"]);
const on_click_dropdown = (e: Event) => { };

const on_click_menu: MenuProps["onClick"] = (e) => {
  // console.log("click", e.key);
  emit("dropdown-select", e.key);
};

//----------
// @events
//----------
</script>

<style lang="scss">
.midi-reader-dropdown {
  margin: 20px;

  span {
    font-size: 20px;
  }
}
</style>
