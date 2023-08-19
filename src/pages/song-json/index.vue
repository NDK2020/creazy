<template>
  <div class="song-json ">
    <h1 class="text-center mt-80"> read json game '{{ game_name }}'</h1>


    <div class="flex-center gap-20 mt-40">

      <a-button type="primary" @click="on_click" class="button flex-x-center">
        run
      </a-button>
    </div>

    <div class="flex-center gap-20 mt-40">

      <a-textarea class="text-area" v-model:value="json_info.output_str" placeholder="output" auto-size />
    </div>
  </div>
</template>

<script setup lang="ts">
  import sayso from "@/assets/a_sayso_data.json";

//----------------------------------------
const DEFAULT_NAME = "...";
const DEFAULT_ID = "1";
const game_name = ref<string>(DEFAULT_NAME);
const game_id = ref<string>(DEFAULT_ID);

const on_game_id_select = (key: string) => {
  console.log(key);
  game_id.value = key;
  switch (parseInt(key)) {
    case 1:
      game_name.value = "pi/bh";
      break;
    case 2:
      game_name.value = "gduc";
      break;
    default:
      game_name.value = DEFAULT_NAME;
  }
};

//--------------------------
// @read-dr-json-temporary
//--------------------------

const on_click = () => {
  // let level_data = JSON.parse(sayso);
  // console.log(sayso);

  let tmp: string[] = new Array<string>(0);
  let level_data = sayso.levelData;

  let len = level_data.length;
  level_data.forEach((item, i) => {
    let id = `id:${i}`;
    let cid = `cid:${item.noteID}`; 
    let pid = `pid:${item.positionID}`;
    let time_appear = `ta:${item.timeAppear}`;
    tmp.push(id + "-" + cid + "-" + pid + "-" + time_appear);
  })
  
  // console.log(tmp);
  // console.log(tmp.join(","));
  json_info.output_str = tmp.join(","); 
}


const json_info = reactive({
  output_str: "",
});

</script>

<style lang="scss">
.home {
  padding: 40px;
}
</style>
