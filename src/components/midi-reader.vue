<template>
  <div class="midi-reader flex-col-center w-full">
    <div class="flex-end">
      <dropdown-games @dropdown-select="on_dropdown_select" />

      <a-button type="primary" @click="on_select_file" class="button flex-y-center">
        <div class="flex-center gap-8 w-full h-full">
          <Icon icon="solar:upload-track-2-bold" class="mt3-reader__icon" />
          <Icon icon="simple-icons:midi" class="mt3-reader__icon" />
        </div>
      </a-button>

    </div>

    <div class="title-wrapper w-full mt-[16px] mb-[4px]">
      <h4> Copy This Content </h4>
    </div>
    <a-textarea class="text-area" v-model:value="midi_info.output_str" placeholder="output" auto-size />


    <div class="title-wrapper w-full mt-[16px] mb-[4px]">
      <h4> Song Info</h4>
    </div>
    <a-textarea class="text-area" v-model:value="song_info" placeholder="song info" auto-size />


    <div class="title-wrapper w-full mt-[16px] mb-[4px]">
      <h4> Raw Content </h4>
    </div>
    <a-textarea class="text-area" v-model:value="midi_info.raw_str" placeholder="raw string" auto-size />
  </div>
</template>

<script setup lang="ts">
//---------
// @tauri
//---------
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { readBinaryFile } from "@tauri-apps/api/fs";

//
import { Icon } from "@iconify/vue";
import { Track, Track2, Note2 } from "@/types";
import {
  read as midi_read,
  TrackNameEvent,
  SetTempoEvent,
  AnyEvent,
  AnyMetaEvent,
  MidiHeader,
  AnyChannelEvent,
  ControllerEvent,
  NoteOnEvent,
  NoteOffEvent
} from "midifile-ts";

//--------
// @antd
//--------
//-----------
// @antd-ui
//-----------
import { notification } from "ant-design-vue";



//---------
// @props
//---------
const game_id = ref("");
const song_info = ref("");

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
  color_ids: ""
});



//------
// @dr
//------
interface dr {
  track_main?: MfTrack,
  track_relation?: MfTrack,
  pos_ids: number[],
  color_ids: number[]
}

const dr = reactive<dr>({
  track_main: undefined,
  track_relation: undefined,
  pos_ids: new Array<number>(0),
  color_ids: new Array<number>(0),
});



const emit = defineEmits(["on_game_id_select"])
const on_dropdown_select = (key: string) => {
  console.log(key);
  game_id.value = key;
  emit("on_game_id_select", key);
};


// https://github.com/ryohey/midifile-ts

const on_select_file = async () => {
  switch (game_id.value) {
    case "1":
      get_data_from_back_end();
      break;
    case "2":
      get_data_from_back_end();
      break;
    case "3":
      get_data_from_front_end();
      break;
    default:
      get_data_from_front_end();
      // notification["error"]({
      //   message: "No game selected",
      //   description: "Please select game at dropdown button",
      //   duration: 1.6
      // });
      break;

  }
}


const get_data_from_back_end = async () => {
  const f = await open();
  console.log("read midi file: " + f);

  invoke("read_midi", { filePathStr: f }).then((res) => {
    if (res) {
      let track = res as Track;
      console.log(track);

      midi_info.name = typeof f == "string" ? f.replace(/^.*[\\\/]/, "") : "";
      midi_info.num_of_notes = track.timespans.length.toString();
      midi_info.timespan_min = Math.min(...track.timespans).toString();
      midi_info.timespan_max = Math.max(...track.timespans).toString();
      midi_info.raw_str = track.raw_str_vec.join(",");
      song_info.value = `
name: ${midi_info.name}
num-of-notes: ${midi_info.num_of_notes}
timespan(min - max) value: 
${midi_info.timespan_min} - ${midi_info.timespan_max}
--------------------
num-of-notes-on: ${track.notes_on.length}
num-of-notes-on-velocity-zero: ${track.notes_on_velocity_zero.length}
num-of-notes-off: ${track.notes_off.length}
`;

      switch (game_id.value) {
        case "1":
          midi_info.output_str = track.timespans.map(t => t.toString()).join(",")
          break;
        case "2":
          midi_info.output_str = midi_info.raw_str
          break;
        default:
          midi_info.output_str = ""
          break;
      }

    }
  });
};

const get_data_from_front_end = async () => {

  try {
    const path = await open({
      multiple: false,
      title: "Open .mid/.midi file"
    })
    //
    const file = await readBinaryFile(path as string);
    const buf = Uint8Array2ArrayBuffer(file);
    const midi = midi_read(buf)
    //
    let track_tempo = midi.tracks.find((events) => {
      return events
        .filter(is_set_tempo_event)
    });

    //
    let track_main = midi.tracks.find((events) => {
      return events
        .filter(is_track_name_event)
        .find(n => n.text = "main");
    });

    let track_relation = midi.tracks.find((events) => {
      return events
        .filter(is_track_name_event)
        .find(n => n.text = "main");
    });

    dr.track_main = new MfTrack(midi.header, track_tempo);
    dr.track_main.get_data_basic(track_main);
    console.log(dr.track_main);
    //
    dr.track_relation = new MfTrack(midi.header, track_tempo);
    dr.track_relation.get_data_basic(track_main);


    //--------------
    // @track-main
    //--------------
    // console.log(track_main);


  } catch (err) {
    console.log(err);
  }
}

const Uint8Array2ArrayBuffer = (array: Uint8Array): ArrayBuffer => {
  return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
}

const is_track_name_event = (ev: AnyEvent): ev is TrackNameEvent =>
  is_any_meta_event(ev) && ev.subtype === "trackName";

const is_set_tempo_event = (ev: AnyEvent): ev is SetTempoEvent =>
  is_any_meta_event(ev) && ev.subtype === "setTempo";

const is_any_meta_event = (ev: AnyEvent): ev is AnyMetaEvent => ev.type ===
  "meta";



const is_note_on_event = (ev: AnyEvent): ev is NoteOnEvent =>
  is_any_channel_event(ev) && ev.subtype === "noteOn";


const is_note_off_event = (ev: AnyEvent): ev is NoteOffEvent =>
  is_any_channel_event(ev) && ev.subtype === "noteOff";

const is_control_pan_event = (ev: AnyEvent): ev is ControllerEvent => is_controller_event(ev) && ev.controllerType === 7;

const is_controller_event = (ev: AnyEvent): ev is ControllerEvent =>
  is_any_channel_event(ev) && ev.subtype === "controller";

const is_any_channel_event = (ev: AnyEvent): ev is AnyChannelEvent => ev.type ===
  "channel";


class MfTrack {
  name = "";
  tempo = 0.0;
  division = 0.0;
  seconds_per_tick = 0.0;
  num_of_notes = 0.0;
  notes_on = new Array<Note2>(0);
  notes_off = new Array<Note2>(0);
  min_duration = 0.0;
  durations = new Array<number>(0);
  pans_dt = new Array<number>(0);

  constructor(header: MidiHeader, track_tempo: AnyEvent[] | undefined) {
    this.division = header.ticksPerBeat;
    this.tempo = track_tempo?.find(is_set_tempo_event)?.microsecondsPerBeat || 0;
    this.calc_sec_per_tick();
  }

  get_data_basic(track: AnyEvent[] | undefined) {
    this.get_pans_dt(track);
    this.get_notes_on(track);
    this.get_notes_off(track);
    this.get_durations();
    this.get_min_duration();
  }

  get_pans_dt(track: AnyEvent[] | undefined) {
    if (track == undefined) return;
    this.pans_dt = track
      .filter(is_control_pan_event)
      .map(e => e.deltaTime);
  }

  get_notes_on(track: AnyEvent[] | undefined) {
    if (track == undefined) return;

    this.notes_on = track
      .filter(is_note_on_event)
      .map((e, i) => ({
        id: i,
        delta_time: e.deltaTime,
        kind: "on",
        channel: e.channel.toString(),
        number: e.noteNumber,
        name: "",
        seconds_per_tick: this.seconds_per_tick,
        velocity: e.velocity,
        delta_time_in_seconds: this.calc_delta_time_in_seconds(e.deltaTime)
      }));
  }

  get_notes_off(track: AnyEvent[] | undefined) {
    if (track == undefined) return;

    this.notes_on = track
      .filter(is_note_off_event)
      .map((e, i) => ({
        id: i,
        delta_time: e.deltaTime,
        kind: "off",
        channel: e.channel.toString(),
        number: e.noteNumber,
        name: "",
        seconds_per_tick: this.seconds_per_tick,
        velocity: e.velocity,
        delta_time_in_seconds: this.calc_delta_time_in_seconds(e.deltaTime)
      }));
  }

  get_durations() {
    if (!this.notes_off) return;
    if (this.notes_off.length == 0) return;
    this.durations = this.notes_off.map(e => e.delta_time_in_seconds)
  }

  get_min_duration() {
    if (!this.durations) return;
    if (this.durations.length == 0) return;
    this.min_duration = 
      this.durations.reduce(
        (acc, cur) => Math.min(acc, cur),
        Number.MAX_VALUE 
      );
  }

  calc_delta_time_in_seconds(dt: number): number {
    return dt * this.seconds_per_tick;
  }


  calc_sec_per_tick() {
    let ms_per_tick = this.tempo / this.division;
    this.seconds_per_tick = ms_per_tick / 1000000.0;
  }
}




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
