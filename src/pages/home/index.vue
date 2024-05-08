<template>
  <div class="home ">
    <h1 class="text-center mt-40"> read midi game '{{ game_name }}'</h1>
    <div class="flex-center gap-20 mt-40">
      <midi-reader  @on_game_id_select="on_game_id_select"/>
    </div>
  </div>
</template>

<script setup lang="ts">

const DEFAULT_NAME = "..."; 
const DEFAULT_ID = "-1"; 
const game_name = ref<string>(DEFAULT_NAME);
const game_id = ref<string>(DEFAULT_ID);

const on_game_id_select = (key: string) => {
  console.log(key);
  game_id.value = key;
  switch (key) {
    case "-1":
      game_name.value = "pi/bh (old)";
      break;
    case "bh":
      game_name.value = "bh";
      break;
    case "dr":
      game_name.value = "dr";
      break;
    //case "gboc":
    //  game_name.value = "gboc";
    //  break;
    case "gdub":
      game_name.value = "gdub";
      break;
    case "gduc":
      game_name.value = "gduc";
      break;
    case "gduf":
      game_name.value = "gduf";
      break;
    case "gdut":
      game_name.value = "gdut";
      break;
    case "gmnb":
      game_name.value = "gmnb";
      break;
    case "gthf":
      game_name.value = "gthf";
      break;
    case "pi":
      game_name.value = "pi";
      break;
    default:
      game_name.value = DEFAULT_NAME;
  }
};
</script>

<style lang="scss">
.home {
  padding: 40px;
}
</style>
