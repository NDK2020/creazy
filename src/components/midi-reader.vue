<template>
  <div class="midi-reader flex-col-center w-full">
    <div class="flex-end gap-12">
      <dropdown-games @dropdown-select="on_dropdown_select" />


      <a-upload-dragger :file-list="file_list" :multiple="false"
        :before-upload="on_select_file">

        <a-button type="primary" @click="{ }" class="button flex-y-center">
          <div class="flex-center gap-8 w-full h-full">
            <Icon icon="solar:upload-track-2-bold" class="mt3-reader__icon" />
            <Icon icon="simple-icons:midi" class="mt3-reader__icon" />
          </div>
        </a-button>
      </a-upload-dragger>

      <a-switch v-if="game_id == 'dr'" v-model:checked="dr.include_track_relation"
        checked-children="include-track-relation" un-checked-children="include-track-relation" />

      <a-switch v-if="game_id == 'bh'" v-model:checked="bh.include_track_relation"
        checked-children="include-track-relation" un-checked-children="include-track-relation" />
    </div>

    <div class="title-wrapper w-full mt-[16px] mb-[4px]">
      <h4>Copy This Content</h4>
    </div>
    <a-space direction="vertical" class="m-12">
      <a-switch v-model:checked="cutter.enabled" checked-children="cutter-off" un-checked-children="cutter-on" />
      <a-space>
        note-on:
        <a-input-number v-model:value="cutter.note_start" :min="0" :max="10000" />
      </a-space>

      <a-space>
        note-off:
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
import { read as midi_read } from "midifile-ts";

import mock_2phuthon from "@/assets/a_2-phut-hon-phao_15s.json";

import {
  Track as MfTrack,
  MergedNote,
  is_set_tempo_event,
  is_track_name_event,
  is_note_event,
  NoteEvent
} from "@/modules/midi";

//---------------
// @import-antd
//---------------
import { notification, UploadChangeParam, UploadProps } from "ant-design-vue";

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
const file_path = ref("");

const midi_info = reactive({
  name: "",
  raw_str: "",
  output_str: "",
  num_of_notes: "",
  timespan_min: "",
  timespan_max: "",
  time_appers: "",
  pos_ids: "",
  ids: "",
  color_ids: "",
});

interface ITracks {
  tempo?: MfTrack;
  main?: MfTrack;
  motif?: MfTrack;
  relation?: MfTrack;
  include_track_relation: boolean;
}

const tracks = reactive<ITracks>({
  main: undefined,
  motif: undefined,
  relation: undefined,
  include_track_relation: false,
});

const emit = defineEmits(["on_game_id_select"]);
const on_dropdown_select = (key: string) => {
  console.log(key);
  game_id.value = key;
  emit("on_game_id_select", key);
};

// https://github.com/ryohey/midifile-ts


const on_select_file:UploadProps['beforeUpload'] = file => {

  // const status = info.file.status;
  //
  // let file = file_list.value[0];
  // console.log(info.file);
  const reader = new FileReader()
  reader.onload = (res) => {
    console.log(res.target?.result);
  }
  reader.readAsText(file);
  return false;

  // console.log(status);
  // console.log(info.fileList[0]);
  // file_list.value = 

  // switch (game_id.value) {
  //   case "-1":
  //     get_data_from_back_end();
  //     break;
  //   case "bh":
  //     get_bh_data();
  //     break;
  //   case "dr":
  //     get_dr_data();
  //     break;
  //   case "gduc":
  //     get_data_from_back_end();
  //     break;
  //   case "pi":
  //     notification["error"]({
  //       message: "No support!!!!",
  //       description: "this game is not supported yet",
  //       duration: 1.6,
  //     });
  //     break;
  //   default:
  //     // get_data_from_front_end();
  //     get_dr_data();
  //     notification["error"]({
  //       message: "No game selected",
  //       description: "Please select game at dropdown button",
  //       duration: 1.6,
  //     });
  //     break;
  // }
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

//-----------------
// @bh/@tiles-hop
//-----------------
interface IBh {
  track_main?: MfTrack;
  track_relation?: MfTrack;
  pos_ids: number[];
  include_track_relation: boolean;
}

const bh = reactive<IBh>({
  track_main: undefined,
  track_relation: undefined,
  pos_ids: new Array<number>(0),
  include_track_relation: false,
});

const get_bh_data = async () => {
  await get_data_from_front_end();
  bh.track_main = tracks.main;
  bh.track_relation = tracks.relation;

  let final_notes: MergedNote[];

  // refine track_main
  let main_include_notes_number = [96, 97, 98, 99, 100];
  let relation_inclucde_notes_number = Array(6)
    .fill(0)
    .map((_, index) => index);

  final_notes = [...(bh?.track_main?.notes ?? [])];
  let include_numbers = [...main_include_notes_number];


  final_notes = final_notes
    .filter((n) => include_numbers.includes(n.number))
    .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks);

  console.log("final_notes");
  console.log(final_notes);
  console.log("********************");


  //--------------
  // @bh/@output
  //--------------
  let mc_cnt = 0;
  let output = final_notes.map((n, i) => {

    //pid - position-id
    //|….1….3….5….|
    //|…..2...4…..|
    let pid = "none";
    if (n.number == 96) {
      pid = "0";
    }

    if (n.number == 97) {
      pid = "1";
    }

    if (n.number == 98) {
      pid = "2";
    }

    if (n.number == 99) {
      pid = "3";
    }

    if (n.number == 100) {
      pid = "4";
    }

    // moodchange
    let is_mc = "0";
    if (bh.include_track_relation) {

      let found = bh?.track_relation?.notes.some(
        e => e.time_appear.ticks == n.time_appear.ticks
      );
      if (found) {
        if (mc_cnt > 1) {
          is_mc = "1";
          console.log(`note ${i}: has mood change`)
        }
        mc_cnt++;
        pid = "2"; // tile-long is at middle
      }
    }

    let id_str = `id:${i}`;
    let n_str = `n:${n.number}`;
    let pid_str = `pid:${pid}`;
    let ta_str = `ta:${n.time_appear.secs}`;
    let d_str = `d:${n.duration.secs}`;
    let v_str = `v:${n.velocity}`;
    let mc_str = `mc:${is_mc}`;
    return [id_str, n_str, pid_str, ta_str, d_str, v_str, mc_str].join("-");
  });

  //----------------------------------------

  if (cutter.enabled) {
    let tmp = final_notes.filter((n, i) => i >= cutter.note_start && i <=
      cutter.note_end)

    output = tmp.map((n, i) => {
      //pid
      //|….1….3….5….|
      //|…..2...4…..|
      let pid = "none";
      if (n.number == 96) {
        pid = "0";
      }

      if (n.number == 97) {
        pid = "1";
      }

      if (n.number == 98) {
        pid = "2";
      }

      if (n.number == 99) {
        pid = "3";
      }

      if (n.number == 100) {
        pid = "4";
      }

      let id_str = `id:${i}`;
      let n_str = `n:${n.number}`;
      let pid_str = `pid:${pid}`;
      let ta_str = `ta:${n.time_appear.secs - cutter.song_start_time}`;
      let d_str = `d:${n.duration.secs}`;
      let v_str = `v:${n.velocity}`;
      return [id_str, n_str, pid_str, ta_str, d_str, v_str].join("-");
    });
  }
  midi_info.output_str = output.join(",");
  song_info.value = `
name: ${typeof file_path.value == "string"
      ? file_path.value.replace(/^.*[\\\/]/, "")
      : ""
    }
num-of-notes: ${final_notes.length}
`;
};

//--------------------
// @dr/@dancing-road
//--------------------
interface IDr {
  track_main?: MfTrack;
  track_relation?: MfTrack;
  pos_ids: number[];
  include_track_relation: boolean;
}

const dr = reactive<IDr>({
  track_main: undefined,
  track_relation: undefined,
  pos_ids: new Array<number>(0),
  include_track_relation: false,
});

const get_dr_data = async () => {
  await get_data_from_front_end();
  dr.track_main = tracks.main;
  dr.track_relation = tracks.relation;

  let final_notes: MergedNote[];

  // refine track_main
  let main_include_notes_number = [84, 85, 86, 96, 97, 98, 88, 100, 102];
  let relation_inclucde_notes_number = Array(6)
    .fill(0)
    .map((_, index) => index);
  final_notes = [...(dr?.track_main?.notes ?? [])];
  let include_numbers = [...main_include_notes_number];

  if (dr.include_track_relation) {
    final_notes = [...final_notes, ...(dr?.track_relation?.notes ?? [])];
    include_numbers = [...include_numbers, ...relation_inclucde_notes_number];
  }

  final_notes = final_notes
    .filter((n) => include_numbers.includes(n.number))
    .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks);

  console.log(final_notes);

  //----------
  // @output
  //----------
  let output = final_notes.map((n, i) => {
    //pid
    let pid = "none";
    if (n.number == 96 || n.number == 84) {
      pid = "0";
    }

    if (n.number == 97 || n.number == 85) {
      pid = "1";
    }

    if (n.number == 98 || n.number == 86) {
      pid = "2";
    }

    // temporary
    // note 88 is diff color but moving
    // note 100 is same color but moving
    if (n.number == 88 || n.number == 100) {
      pid = "1";
    }

    let id_str = `id:${i}`;
    let n_str = `n:${n.number}`;
    let pid_str = `pid:${pid}`;
    let ta_str = `ta:${n.time_appear.secs}`;
    let d_str = `d:${n.duration.secs}`;
    return [id_str, n_str, pid_str, ta_str, d_str].join("-");
  });

  midi_info.output_str = output.join(",");
  song_info.value = `
name: ${typeof file_path.value == "string"
      ? file_path.value.replace(/^.*[\\\/]/, "")
      : ""
    }
num-of-notes: ${final_notes.length}
`;
};

//----------------------
// @bgoc/@bouncing-cat
//----------------------
interface IGboc {
  track_main?: MfTrack;
  track_relation?: MfTrack;
  pos_ids: number[];
  include_track_relation: boolean;
}

const gboc = reactive<IGboc>({
  track_main: undefined,
  track_relation: undefined,
  pos_ids: new Array<number>(0),
  include_track_relation: false,
});

const get_gboc_data = async () => {
  await get_data_from_front_end();
  gboc.track_main = tracks.main;
  gboc.track_relation = tracks.relation;

  let final_notes: MergedNote[];

  // refine track_main
  let main_include_notes_number = [84, 85, 86, 87, 88];
  let relation_include_notes_number = [36, 37, 38, 39, 40];

  final_notes = [...(gboc?.track_main?.notes ?? [])];
  let include_numbers = [...main_include_notes_number];

  if (gboc.include_track_relation) {
    final_notes = [...final_notes, ...(gboc?.track_relation?.notes ?? [])];
    include_numbers = [...include_numbers, ...relation_include_notes_number];
  }

  final_notes = final_notes
    .filter((n) => include_numbers.includes(n.number))
    .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks);

  console.log(final_notes);

  //--------------
  // @gboc/@output
  //--------------
  let output = final_notes.map((n, i) => {
    //pid
    //|….1….3….5….|
    //|…..2...4…..|
    let pid = "none";
    if (n.number == 84) {
      pid = "0";
    }

    if (n.number == 85) {
      pid = "1";
    }

    if (n.number == 86) {
      pid = "2";
    }

    if (n.number == 87) {
      pid = "3";
    }

    if (n.number == 88) {
      pid = "4";
    }

    let id_str = `id:${i}`;
    let n_str = `n:${n.number}`;
    let pid_str = `pid:${pid}`;
    let ta_str = `ta:${n.time_appear.secs}`;
    let d_str = `d:${n.duration.secs}`;
    let v_str = `v:${n.velocity}`;
    return [id_str, n_str, pid_str, ta_str, d_str, v_str].join("-");
  });

  midi_info.output_str = output.join(",");
  song_info.value = `
name: ${typeof file_path.value == "string"
      ? file_path.value.replace(/^.*[\\\/]/, "")
      : ""
    }
num-of-notes: ${final_notes.length}
`;
};

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
    // //
    // let track_tempo = midi.tracks.find((track_events) =>
    //   track_events.find(is_set_tempo_event)
    // );
    //
    // console.log("midi data");
    // console.log(midi);
    // console.log("********************");
    //
    // let track_mains = midi.tracks.filter((track_events) => {
    //   return track_events
    //     .filter(is_track_name_event)
    //     .find((n) => n.text == "main");
    // });
    //
    // let track_main = track_mains.find((track) => {
    //   let notes = track.filter(is_note_event).map((e) => e as NoteEvent);
    //   return notes.length > 0;
    // });
    //
    // console.log("track main");
    // console.log(track_main);
    // console.log("********************");
    //
    // let track_relation = midi.tracks.find((track_events) => {
    //   return track_events
    //     .filter(is_track_name_event)
    //     .find((n) => n.text == "relation");
    // });
    // console.log("track relation");
    // console.log(track_relation);
    // console.log("********************");
    //
    // //--------------
    // // @track-main
    // //--------------
    // tracks.main = new MfTrack(midi.header, track_tempo, "main");
    // tracks.main.get_data_basic(track_main);
    //
    // //------------------
    // // @track-relation
    // //------------------
    // tracks.relation = new MfTrack(midi.header, track_tempo, "relation");
    // tracks.relation.get_data_basic(track_relation);
    //
  } catch (err) {
    console.log(err);
  }
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
  .button {
    &.ant-btn {
      height: 40px;
      padding: 28px 30px;
      margin: 20px auto;
    }
  }

  .mt3-reader__icon {
    font-size: 40px;
  }
}
</style>
