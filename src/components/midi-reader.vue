<template>
  <div class="midi-reader flex-col-center w-full">
    <div class="flex-end gap-12">
      <dropdown-games @dropdown-select="on_dropdown_select" />

      <a-upload-dragger v-model:fileList="file_list" :multiple="false" @change="on_change_file" @drop="on_drop_file"
        :before-upload="on_select_file" class="upload-dragger">
        <a-button type="primary" @click="
                    {
        }
          " class="button flex-y-center">
          <div class="flex-center gap-8 w-full h-full">
            <Icon icon="solar:upload-track-2-bold" class="mt3-reader__icon" />
            <Icon icon="simple-icons:midi" class="mt3-reader__icon" />
          </div>
        </a-button>
      </a-upload-dragger>

      <a-switch v-if="is_show_relation_toggle()" v-model:checked="has_relation" checked-children="include-track-relation"
        un-checked-children="include-track-relation" />
    </div>

    <div class="title-wrapper w-full mt-[16px] mb-[4px]">
      <h4>Copy This Content</h4>
    </div>
    <a-space direction="vertical" class="m-12">
      <a-switch v-model:checked="cutter.enabled" checked-children="cutter-off" un-checked-children="cutter-on" />
      <a-space>
        note-start:
        <a-input-number v-model:value="cutter.note_start" :min="0" :max="10000" />
      </a-space>

      <a-space>
        note-end:
        <a-input-number v-model:value="cutter.note_end" :min="0" :max="10000" />
      </a-space>

      <a-space>
        song-start-time<a-input-number v-model:value="cutter.song_start_time" :min="0" :max="10000" />
      </a-space>
    </a-space>

    <a-textarea class="text-area" v-model:value="midi_info.output_str" placeholder="output" auto-size />

    <div class="title-wrapper w-full mt-[16px] mb-[4px]">
      <h4>Song Info</h4>
    </div>
    <a-textarea class="text-area" v-model:value="song_info" placeholder="song info" auto-size />
    <div class="title-wrapper w-full mt-[16px] mb-[4px]">
      <h4>Song Info</h4>
    </div>
    <div class="title-wrapper w-full mt-[16px] mb-[4px]">
      <h4>Raw Content</h4>
    </div>
    <a-textarea class="text-area" v-model:value="midi_info.raw_str" placeholder="raw string" auto-size />
  </div>
</template>

<script setup lang="ts">
//---------------
// @import-tauri
//---------------
// import { invoke } from "@tauri-apps/api/tauri";
// import { open } from "@tauri-apps/api/dialog";
// import { readBinaryFile } from "@tauri-apps/api/fs";

//
import { Icon } from "@iconify/vue";
import { Track } from "@/types";
import { read, MidiFile } from "midifile-ts";

import mock_2phuthon from "@/assets/a_2-phut-hon-phao_15s.json";

import {
  Track as MfTrack,
  MergedNote,
  is_set_tempo_event,
  is_track_name_event,
  is_note_event,
  NoteEvent,
  BH,
  GBOC,
  DR,
  GDUC,
  GameOldFormat,
} from "@/modules/midi";

//---------------
// @import-antd
//---------------
import { notification, UploadChangeParam, UploadProps } from "ant-design-vue";
import { GDUF } from "@/modules/midi/gduf";

//-----------
// @cutsong
//-----------
const cutter = reactive({
  enabled: false,
  note_start: 0,
  note_end: 0,
  song_start_time: 0,
});

//---------
// @props
//---------
const game_id = ref("");
const song_info = ref("");
const has_relation = ref(false);

const file_info = reactive({
  path: "",
  name: "",
});

const midi_info = reactive({
  ids: "",
  raw_str: "",
  output_str: "",
  time_appaers: "",
  pos_ids: "",
  color_ids: "",
});

const emit = defineEmits(["on_game_id_select"]);
const on_dropdown_select = (key: string) => {
  console.log(key);
  game_id.value = key;
  emit("on_game_id_select", key);
};

// https://github.com/ryohey/midifile-ts

const midi_file = ref<MidiFile>();
const file_list = ref([]);

watch(midi_file, () => {
  if (midi_file.value) {
    console.log(midi_file.value);
    switch (game_id.value) {
      case "-1":
        get_old_data();
        break;
      case "bh":
        get_bh_data();
        break;
      case "dr":
        get_dr_data();
        break;
      case "gduc":
        get_gduc_data();
        break;
      case "gduf":
        get_gduf_data();
        break;
      // case "pi":
      //   notification["error"]({
      //     message: "No support!!!!",
      //     description: "this game is not supported yet",
      //     duration: 1.6,
      //   });
      //   break;
      default:
        notification["error"]({
          message: "No game selected",
          description: "Please select game at dropdown button",
          duration: 1.6,
        });
        break;
    }
  }
});
const on_select_file: UploadProps["beforeUpload"] = async (file) => {
  midi_file.value = undefined;
  const reader = new FileReader();

  reader.onload = async (e) => {
    const buf = e.target?.result as ArrayBuffer;
    midi_file.value = read(buf);
  };

  await reader.readAsArrayBuffer(file);
  return false;
};

const on_change_file = (info: UploadChangeParam) => {
  file_info.name = info.file.name;
};

const on_drop_file = (ev: DragEvent) => {
  // console.log(ev);
  // ev.preventDefault();
  // console.log("drop a file");
  // if (ev.dataTransfer?.items) {
  //   console.log("drop a file");
  // }
};

const is_show_relation_toggle = () => {
  let list = ["bh", "dr", "gboc"];
  return list.some((e) => e === game_id.value);
};

//-----------------
// @bh/@tiles-hop
//-----------------
const bh = ref<BH>();

const get_bh_data = async () => {
  if (midi_file.value) {
    bh.value = new BH(midi_file.value);
  }

  midi_info.output_str = bh.value?.get_output() || "";
  song_info.value = `
    name: ${file_info.name}
    num-of-notes: ${bh.value?.total_notes}
  `;
};

//--------------------
// @dr/@dancing-road
//--------------------
const dr = ref<DR>();
const get_dr_data = async () => {
  if (midi_file.value) {
    dr.value = new DR(midi_file.value);
  }

  midi_info.output_str = dr.value?.get_output() || "";
  song_info.value = `
    name: ${file_info.name}
    num-of-notes: ${dr.value?.total_notes}
  `;
};

//----------------------
// @gboc/@bouncing-cat
//----------------------
const gboc = ref<GBOC>();

const get_gboc_data = async () => {
  if (midi_file.value) {
    gboc.value = new GBOC(midi_file.value);
  }

  midi_info.output_str = gboc.value?.get_output() || "";
  song_info.value = `
    name: ${file_info.name}
    num-of-notes: ${gboc.value?.total_notes}
  `;
};

//-------------------
// @gduc/@duet-cats
//-------------------
const gduc = ref<GDUC>();

const get_gduc_data = async () => {
  if (midi_file.value) {
    gduc.value = new GDUC(midi_file.value);
  }

  midi_info.output_str =
    gduc.value?.get_output(
      cutter.enabled,
      cutter.note_start,
      cutter.note_end,
      cutter.song_start_time
    ) || "";
  song_info.value = `
    name: ${file_info.name}
    num-of-notes: ${gduc.value?.total_notes}
  `;
};

//-------------------
// @gduf/@duet-cats
//-------------------
const gduf = ref<GDUF>();

const get_gduf_data = async () => {
  if (midi_file.value) {
    gduf.value = new GDUF(midi_file.value);
  }

  midi_info.output_str =
    gduf.value?.get_output(
      cutter.enabled,
      cutter.note_start,
      cutter.note_end,
      cutter.song_start_time
    ) || "";
  song_info.value = `
    name: ${file_info.name}
    num-of-notes: ${gduf.value?.total_notes}
  `;
};

//------------
// @old-data
//------------
const game_old_format = ref<GameOldFormat>();

const get_old_data = async () => {
  if (midi_file.value) {
    game_old_format.value = new GameOldFormat(midi_file.value);
  }

  midi_info.output_str = game_old_format.value?.get_output() || "";
  song_info.value = `
    name: ${file_info.name}
    num-of-notes: ${game_old_format.value?.total_notes}
  `;
};

//------------------
// @backup-@BACKUP
//------------------

const get_data_from_front_end = async () => {
  try {
    // const path = await open({
    //   multiple: false,
    //   title: "Open .mid/.midi file",
    // });
    // //
    // file_path.value = path as string;
    // const file = await readBinaryFile(path as string);
    // const buf = Uint8Array2ArrayBuffer(file);
    // const midi = midi_read(buf);
    //
    //   song_info.value = `
    // name: ${typeof file_path.value == "string"
    //       ? file_path.value.replace(/^.*[\\\/]/, "")
    //       : ""
    //     }
    // num-of-notes: ${bh.value?.total_notes}
    // `;
  } catch (err) {
    console.log(err);
  }
};

const get_data_from_back_end = async () => {
  //   const f = await open();
  //   console.log("read midi file: " + f);
  //
  //   invoke("read_midi", { filePathStr: f }).then((res) => {
  //     if (res) {
  //       let track = res as Track;
  //       console.log(track);
  //
  //       midi_info.name = typeof f == "string" ? f.replace(/^.*[\\\/]/, "") : "";
  //       midi_info.num_of_notes = track.timespans.length.toString();
  //       midi_info.timespan_min = Math.min(...track.timespans).toString();
  //       midi_info.timespan_max = Math.max(...track.timespans).toString();
  //       midi_info.raw_str = track.raw_str_vec.join(",");
  //       song_info.value = `
  // name: ${midi_info.name}
  // num-of-notes: ${midi_info.num_of_notes}
  // timespan(min - max) value:
  // ${midi_info.timespan_min} - ${midi_info.timespan_max}
  // --------------------
  // num-of-notes-on: ${track.notes_on.length}
  // num-of-notes-on-velocity-zero: ${track.notes_on_velocity_zero.length}
  // num-of-notes-off: ${track.notes_off.length}
  // `;
  //
  //       switch (game_id.value) {
  //         case "-1":
  //           midi_info.output_str = track.timespans
  //             .map((t) => t.toString())
  //             .join(",");
  //           break;
  //         case "gduc":
  //           midi_info.output_str = midi_info.raw_str;
  //           break;
  //         default:
  //           midi_info.output_str = "";
  //           break;
  //       }
  //     }
  //   });
};

const Uint8Array2ArrayBuffer = (array: Uint8Array): ArrayBuffer => {
  return array.buffer.slice(
    array.byteOffset,
    array.byteLength + array.byteOffset
  );
};

//@ts-ignore
const test_2phuthon = (notes: MergedNote[]) => {
  let data = mock_2phuthon.data;
  data.forEach((e, i) => {
    console.group();
    console.log(`note: ${i} format: mock-data | output: is_equal`);
    let mock_ta = e.time_appear;
    let note_ta = notes[i].time_appear.ticks;
    console.log(`time_appear: ${mock_ta} | ${note_ta}: ${mock_ta == note_ta}`);
    let mock_d = e.duration;
    let note_d = notes[i].duration.ticks;
    console.log(`time_appear: ${mock_d} | ${note_d}: ${mock_d == note_d}`);
    console.groupEnd();
  });
};
</script>

<style lang="scss">
.midi-reader {
  .upload-dragger {
    background: inherit;

    .ant-upload {
      padding: 16px;
    }

    .button {
      &.ant-btn {
        height: 40px;
        padding: 28px 30px;
      }
    }
  }

  .mt3-reader__icon {
    font-size: 40px;
  }
}
</style>
