<template>
  <a-dropdown-button @click="on_click_dropdown" class="midi-reader-dropdown">
    Game
    <template #overlay>
      <a-menu @click="on_click_menu">
        <a-menu-item key="-1">
          <div class="flex-center menu-item">
            <Icon icon="ph:warning-circle-bold" class="text-black text-8xl"
              :style="{ fontSize: '28px', color: 'gold' }" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">
              pi/bh (old)
            </p>
          </div>
        </a-menu-item>

        <a-menu-item key="bh">
          <div class="flex-center menu-item">
            <Icon icon="svg-spinners:bouncing-ball" class="text-black text-8xl" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">bh</p>
          </div>
        </a-menu-item>

        <a-menu-item key="dr">
          <div class="flex-center">
            <Icon icon="game-icons:horizon-road" :style="{ fontSize: '28px', color: 'black' }" />

            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">dr</p>
          </div>
        </a-menu-item>

        <!--
        <a-menu-item key="gboc">
          <div class="flex-center">
            <Icon icon="game-icons:hollow-cat" :style="{ fontSize: '28px', color: 'black' }" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">gboc</p>
          </div>
        </a-menu-item>
        -->
        <a-menu-item key="gdub">
          <div class="flex-center">
            <Icon icon="streamline-emojis:bird-1" flip="horizontal" :style="{ fontSize: '28px' }" />

            <Icon icon="streamline-emojis:bird-1" :style="{ fontSize: '28px' }" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">gdub</p>
          </div>
        </a-menu-item>

        <a-menu-item key="gduc">
          <div class="flex-center">
            <Icon icon="emojione:cat-face-with-wry-smile" flip="horizontal" :style="{ fontSize: '28px' }" />

            <Icon icon="emojione:cat-face-with-wry-smile" :style="{ fontSize: '28px' }" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">gduc</p>
          </div>
        </a-menu-item>

        <a-menu-item key="gduf">
          <div class="flex-center">
            <Icon icon="fluent-emoji-flat:rabbit-face" flip="horizontal" :style="{ fontSize: '28px' }" />

            <Icon icon="emojione:hamster-face" :style="{ fontSize: '28px' }" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">gduf</p>
          </div>
        </a-menu-item>

        <a-menu-item key="gdut">
          <div class="flex-center">
            <Icon icon="material-symbols:square-rounded" flip="horizontal"
            :style="{ fontSize: '28px', color: 'blue' }" />

            <Icon icon="material-symbols:square-rounded" :style="{ fontSize:
            '28px', color: 'pink' }" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">gdut</p>
          </div>
        </a-menu-item>


        <a-menu-item key="gmnb">
          <div class="flex-center">
            <Icon icon="arcticons:friday-night-funkin" 
            :style="{ fontSize: '40px', color: '#5bdef4', fontWeight: '900' }" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">gmnb</p>
          </div>
        </a-menu-item>

        <a-menu-item key="pi">
          <div class="flex-center">
            <Icon icon="svg-spinners:blocks-scale" flip="horizontal" :style="{
              fontSize: '28px',
              color: 'black',
            }" />
            <p class="mt-8 ml-8 text-black" :style="{ color: 'black' }">pi</p>
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
  console.log("click", e.key);
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
