<template>
  <div class="header w-full" :style="styles">
    <div class="flex-y-center h-full">
      <a href="https://www.amanotes.com/" target="_blank">
        <img
          src="/ama-logo--white-160x40.svg"
          class="ml-20 ama-logo"
          alt="amanotes logo" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";


//-----------
//-- @props
//-----------
export interface Props {
  sidebar_width: string;
}

const props = withDefaults(defineProps<Props>(), {
  sidebar_width: "200px",
});

const height = ref("80px");
const styles = computed<CSSProperties>(() => {
  return {
    marginLeft: props.sidebar_width,
    height: height.value,
  };
});

const emits = defineEmits(["get-height"]);
onMounted(() => {
  emits("get-height", height.value);
});
</script>

<style lang="scss">
.header {
  background-color: var(--color-violet-dark);
  transition: all 0.4s;
}
</style>
