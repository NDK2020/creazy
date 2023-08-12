<template>
  <nav class="sidebar" :style="styles">
    <div class="logo flex-center" :style="{ height: props.header_height }">
      <Icon 
        v-if="is_collapsed" 
        icon="lucide:panel-right-close"
        class="text-white text-[40px] cursor-pointer"
        @click="on_click_toggle_icon" 
      />

      <Icon 
        v-else 
        icon="lucide:panel-right-open" 
        class="text-white text-[40px]
        cursor-pointer" 
        @click="on_click_toggle_icon" 
      />

    </div>
    <div class="menu-wrapper" :style="{}">
      <div v-for="item in menus" :key="item.key"
        class="menu-item cursor-pointer hover:text-red text-white 
        transition-colors duration-300 select-none 
        p-10 hover:bg-black "
        :class="[
          is_collapsed ? 'flex-center': 'flex-start',
          'gap-20',
          { 'text-red!': item.key === active_key }
        ]" 
        @click="on_click_menu(item.key)"
      >
        <component :is="item.icon" class="w-40 h-40" />
        <span v-if="!is_collapsed" class="ml-2 text-[20px]">{{ item.label }}</span>
      </div>
    </div>
  </nav>
</template>

<!-- :class="[ 'Image', { clickable: props.callback!!}, `${selectedSize}`] " -->
<script setup lang="ts">
import { Icon } from "@iconify/vue";
import type { CSSProperties } from "vue";
import routes from "@/router/modules";

const is_collapsed = ref(false);
const sidebar_width = ref("200px");
const expand_width = ref("200px");
const collapsed_width = ref("80px");
interface Props {
  header_height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  header_height: "80px",
});

const styles = computed<CSSProperties>(() => {
  sidebar_width.value = is_collapsed.value
    ? collapsed_width.value
    : expand_width.value;

  emits("get-width", sidebar_width.value);
  const position = "fixed";
  return {
    width: `${sidebar_width.value}`,
    position: `${position}`,
  };
});
//-----------
//-- @icons
//-----------
const on_click_toggle_icon = (e: Event) => {
  is_collapsed.value = !is_collapsed.value;

  emits("get-width", sidebar_width.value);
};
//-----------
//-- @emits
//-----------
const emits = defineEmits(["get-width"]);

onMounted(() => {
  emits("get-width", sidebar_width.value);
});

///
const route = useRoute();
const router = useRouter();
const active_key = computed(() => route.matched[1].name as string);

const transformRouteToMenu = (routes: Route.RecordRaw[]): Route.Menu[] =>
  routes.map(({ name, meta, children }) => {
    const icon = meta?.icon ?? children?.[0]?.meta?.icon;
    if (meta?.isRoot && children) {
      return { key: children[0].name, label: name, icon };
    } else {
      return {
        key: name,
        label: name,
        icon,
        children: children && transformRouteToMenu(children),
      };
    }
  });

const menus = computed(() => transformRouteToMenu(routes));

const on_click_menu = (key: string) => router.push({ name: key });
</script>

<style lang="scss">
.sidebar {
  height: 100vh;
  top: 0;
  z-index: 800;
  transition: all 0.4s;
  display: flex;
  flex-flow: column;
  background-color: var(--color-violet-dark-2);

  .menu-wrapper {
    flex: 1 1 auto;
    position: relative;
    display: flex;
    flex-flow: column;
    left: 0px;
    overflow-y: overlay;
    overflow-x: hidden;

  }

  .logo {
    border-bottom: 2px solid #555; ;
    &:hover {
      border-bottom: 2px solid #ff6046;
    }
  }

}
</style>
