<template>
  <div class="midi-reader flex-col-center w-full">
    <div class="flex-end gap-12">
      <dropdown-games @dropdown-select="on_dropdown_select" />

      <a-button type="primary" @click="on_select_file" class="button flex-y-center">
        <div class="flex-center gap-8 w-full h-full">
          <Icon icon="solar:upload-track-2-bold" class="mt3-reader__icon" />
          <Icon icon="simple-icons:midi" class="mt3-reader__icon" />
        </div>
      </a-button>

      <a-switch v-if="game_id == '3'" v-model:checked="dr.include_track_relation"
        checked-children="include-track-relation" un-checked-children="include-track-relation" 
      />

    </div>

    <div class="title-wrapper w-full mt-[16px] mb-[4px]">
      <h4> Copy This Content </h4>
    </div>
    <a-textarea class="text-area" v-model:value="midi_info.output_str" placeholder="output" auto-size />


    <div class="title-wrapper w-full mt-[16px] mb-[4px]">
      <h4> Song Info</h4>
    </div>
    <a-textarea class="text-area" v-model:value="song_info" placeholder="song info" auto-size />
    <div class="title-wrapper w-full mt-[16px] mb-[4px]"><h4> Song Info</h4></div>


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
import { Track } from "@/types";
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

import mock_2phuthon from "@/assets/a_2-phut-hon-phao_15s.json";

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

interface ITracks {
  main?: MfTrack,
  motif?: MfTrack,
  relation?: MfTrack,
  include_track_relation: boolean
}

const tracks = reactive<ITracks>({
  main: undefined,
  motif: undefined,
  relation: undefined,
  include_track_relation: false
})

//-----
// @pi
//-----
interface dr {
  track_main?: MfTrack,
  track_relation?: MfTrack,
  pos_ids: number[],
  color_ids: number[]
}




//------
// @dr
//------
interface dr {
  track_main?: MfTrack,
  track_relation?: MfTrack,
  pos_ids: number[],
  color_ids: number[]
  include_track_relation: boolean
}

const dr = reactive<dr>({
  track_main: undefined,
  track_relation: undefined,
  pos_ids: new Array<number>(0),
  color_ids: new Array<number>(0),
  include_track_relation: false
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
      // get_data_from_front_end();
      notification["error"]({
        message: "No game selected",
        description: "Please select game at dropdown button",
        duration: 1.6
      });
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

const get_data_for_dr = async () => {
  get_data_from_front_end();

}

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
    let track_tempo = midi.tracks.find((track_events) =>
      track_events.find(is_set_tempo_event)
    );

    let track_main = midi.tracks.find((track_events) => {
      return track_events
        .filter(is_track_name_event)
        .find(n => n.text == "main");
    });

    let track_relation = midi.tracks.find((track_events) => {
      return track_events
        .filter(is_track_name_event)
        .find(n => n.text == "relation");
    });

    //--------------
    // @track-main
    //--------------
    dr.track_main = new MfTrack(midi.header, track_tempo, "main");
    dr.track_main.get_data_basic(track_main);

    // let mut range_on = (84..=86).chain(96..=98).collect::<Vec<u8>>();
    // range_on.extend([88, 100, 102].iter().copied());
    // refine track_main
    // let main_notes_number = [84, 85, 86, 96, 96, 98, 88, 100, 102]; 
    //
    // dr.track_main.notes_on = dr.track_main.notes_on
    //   .filter(n => main_notes_number.includes(n.number));
    // dr.track_main.notes_off = dr.track_main.notes_off
    //   .filter(n => main_notes_number.includes(n.number));

    // console.log(dr.track_main);
    // test_2phuthon(dr.track_main.notes);
    // 
    // //------------------
    // // @track-relation
    // //------------------
    dr.track_relation = new MfTrack(midi.header, track_tempo, "relation");
    dr.track_relation.get_data_basic(track_relation);

    let final_notes: MergedNote[];

    // refine track_main
    let main_include_notes_number = [84, 85, 86, 96, 97, 98, 88, 100, 102]; 
    let relation_inclucde_notes_number = Array(6).fill(0).map((_, index) => index);
    final_notes = [...dr.track_main.notes];
    let include_numbers = [...main_include_notes_number ];

    if (dr.include_track_relation) {
      final_notes = [...final_notes, ...dr.track_relation.notes]
      include_numbers = [...include_numbers, ...relation_inclucde_notes_number]
    }

    final_notes = final_notes
      .filter(n => include_numbers.includes(n.number))
      .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks);

    console.log(final_notes);


    //-----------------
    // @gen-dr-output
    //-----------------
    let output = final_notes.map((n,i) => {
      //pid
      let pid = "none";
      if (n.number == 96 || n.number == 84 ) {
        pid = "0"
      }

      if (n.number == 97 || n.number == 85 ) {
        pid = "1"
      }

      if (n.number == 98 || n.number == 86 ) {
        pid = "2"
      }

      let id_str = `id:${i}`
      let n_str = `n:${n.number}`
      let pid_str = `pid:${pid}`
      let ta_str = `ta:${n.time_appear.secs}`
      let d_str = `d:${n.duration.secs}`
      return [id_str, n_str, pid_str, ta_str, d_str].join("-")
    }) ;

    midi_info.output_str = output.join(',')
      song_info.value = `
name: ${typeof path == "string" ? path.replace(/^.*[\\\/]/, "") : ""}
num-of-notes: ${final_notes.length}
`;



    console.log("midi data");
    console.log(midi);


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


const is_note_event = (ev: AnyEvent): ev is NoteEvent =>
  is_any_channel_event(ev) && (ev.subtype === "noteOn" || ev.subtype ===
    "noteOff");

const is_note_on_event = (ev: AnyEvent | NoteEvent): ev is NoteOnEvent =>
  is_any_channel_event(ev) && ev.subtype === "noteOn";


const is_note_off_event = (ev: AnyEvent | NoteEvent): ev is NoteOffEvent =>
  is_any_channel_event(ev) && ev.subtype === "noteOff";

const is_control_pan_event = (ev: AnyEvent): ev is ControllerEvent =>
  is_controller_event(ev) && ev.controllerType == 10;

const is_controller_event = (ev: AnyEvent): ev is ControllerEvent =>
  is_any_channel_event(ev) && ev.subtype === "controller";

const is_any_channel_event = (ev: AnyEvent): ev is AnyChannelEvent => ev.type ===
  "channel";

type NoteEvent = NoteOnEvent | NoteOffEvent

class MfTrack {
  name = "";
  tempo = 0.0;
  division = 0.0;
  seconds_per_tick = 0.0;
  num_of_notes = 0.0;
  raw_notes = new Array<NoteEvent>(0);
  notes = new Array<MergedNote>(0);
  pans_dt = new Array<{ ticks: number, secs: number }>(0);
  raw_time_appears = new Array<number>(0);

  constructor(header: MidiHeader, track_tempo: AnyEvent[] | undefined, name = "") {
    this.division = header.ticksPerBeat;
    this.tempo = track_tempo?.find(is_set_tempo_event)?.microsecondsPerBeat || 0;
    this.name = name;
    this.calc_secs_per_tick();
  }

  get_data_basic(track: AnyEvent[] | undefined) {
    this.get_pans_dt(track);
    this.get_raw_notes(track);
    this.get_raw_time_appear();
    this.get_notes();
    // this.calc_note_time_appears();
    // this.get_notes_off(track);
    // this.get_notes_on(track);
    this.num_of_notes = this.notes?.length;
  }

  get_pans_dt(track: AnyEvent[] | undefined) {
    if (track == undefined) return;

    this.pans_dt = track
      .filter(is_control_pan_event)
      .map(e => ({
        ticks: e.deltaTime,
        secs: this.tick2sec(e.deltaTime)
      }));
  }

  get_raw_notes(track: AnyEvent[] | undefined) {
    if (track == undefined) return;

    this.raw_notes = track
      .filter(is_note_event)
      .map(e => e as NoteEvent)
  }

  get_raw_time_appear() {
    if (!this.raw_notes) return;
    if (this.raw_notes.length == 0) return;

    let tick_acc = this.pans_dt.reduce((acc, cur) => acc + cur.ticks, 0) || 0;
    this.raw_time_appears = this.raw_notes.map(e => tick_acc += e.deltaTime)
  }

  get_notes() {
    if (!this.raw_notes) return;
    if (this.raw_notes.length == 0) return;

    this.raw_notes.forEach((e, i) => {

      // merge 2 notes on/off
      if (is_note_off_event(e)) {
        //
        let match_note_id_on = this.find_match_note_id_on(i, e.noteNumber);
        //
        if (match_note_id_on >= 0) {
          let note_on = this.raw_notes[match_note_id_on] as NoteOnEvent;
          //
          let new_note = new MergedNote()
            .set_order(match_note_id_on)
            .set_match_note_order(i)
            .set_kind("merged-note")
            .set_channel(note_on.channel.toString())
            .set_number(note_on.noteNumber)
            .set_secs_per_tick(this.seconds_per_tick)
            .set_velocity(note_on.velocity)
            .set_delta_time(note_on.deltaTime)
            .set_duration(
              (this.raw_time_appears[i] - this.raw_time_appears[match_note_id_on]) || 0
            )
            .set_time_appear(this.raw_time_appears[match_note_id_on] || 0)
            .set_from_track(this.name)
          this.notes.push(new_note);
        }
      }

    })
    this.notes.sort((a, b) => a.time_appear.ticks - b.time_appear.ticks);
  }

  find_match_note_id_on(id: number, note_off_number: number): number {

    // ----1***********4----- cur
    // -------2*****3------ 
    // also recalc the delta time of note off 4
    // currently the value is from 3 to 4
    for (let i = id; i >= 0; i--) {
      let note = this.raw_notes[i];
      if (is_note_on_event(this.raw_notes[i])) {
        note = note as NoteOnEvent
        if (note.noteNumber == note_off_number) {
          return i;
        }
      }
    }
    return -1;
  }
  

  //-----------
  // @helpers
  //-----------

  tick2sec(delta_time_in_ticks: number): number {
    return delta_time_in_ticks * this.seconds_per_tick;
  }

  sec2tick(delta_time_in_secs: number): number {
    return delta_time_in_secs / this.seconds_per_tick;
  }


  calc_secs_per_tick() {
    let ms_per_tick = this.tempo / this.division;
    this.seconds_per_tick = ms_per_tick / 1000000.0;
  }
}

class MergedNote {
  order: number = -1;
  note_off_order = -1;
  from_track: string = ""; 
  kind: string = "";
  number: number = -1;
  delta_time: DeltaTime = new DeltaTime();
  duration: TimeAppear = new Duration();
  time_appear: Duration = new TimeAppear();
  seconds_per_tick: number = 0;
  channel: string = "";
  velocity: number = 0;

  set_order(val: number) {
    this.order = val;
    return this;
  }

  set_match_note_order(val: number) {
    this.note_off_order = val;
    return this;
  }

  set_kind(val: string) {
    this.kind = val;
    return this;
  }

  set_channel(val: string) {
    this.channel = val;
    return this;
  }

  set_number(val: number) {
    this.number = val;
    return this;
  }
  set_secs_per_tick(val: number) {
    this.seconds_per_tick = val;
    return this;
  }
  set_velocity(val: number) {
    this.velocity = val;
    return this;
  }
  //
  set_delta_time(new_val_in_tick: number) {
    this.delta_time.seconds_per_tick = this.seconds_per_tick;
    this.delta_time.set(new_val_in_tick);
    return this;
  }

  set_duration(new_val_in_tick: number) {
    this.duration.seconds_per_tick = this.seconds_per_tick;
    this.duration.set(new_val_in_tick);
    return this;
  }

  set_time_appear(new_val_in_tick: number) {
    this.time_appear.seconds_per_tick = this.seconds_per_tick;
    this.time_appear.set(new_val_in_tick);
    return this;
  }

  set_from_track(val: string) {
    this.from_track = val;
    return this;
  }

  tick2sec(delta_time_in_ticks: number): number {
    return delta_time_in_ticks * this.seconds_per_tick;
  }
}

interface ITimeUnit {
  ticks: number,
  secs: number
}

class TimeUnit implements ITimeUnit {
  ticks: number = 0;
  secs: number = 0;
  seconds_per_tick: number = 0;

  set(new_val_in_tick: number) {
    this.ticks = new_val_in_tick;
    this.secs = this.tick2sec(new_val_in_tick);
  }
  tick2sec(delta_time_in_ticks: number): number {
    return delta_time_in_ticks * this.seconds_per_tick;
  }
}

class DeltaTime extends TimeUnit { }
class TimeAppear extends TimeUnit { }
class Duration extends TimeUnit { }


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
  })
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
