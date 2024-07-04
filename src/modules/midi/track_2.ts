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
  NoteOffEvent,
} from "midifile-ts";


export class Track2 {
  name = "";
  tempo = 0.0;
  tempos: Tempo[] = []
  division = 0.0;
  seconds_per_tick = 0.0;
  num_of_notes = 0.0;
  raw_notes = new Array<NoteEvent>(0);
  notes = new Array<MergedNote>(0);
  pans_dt = new Array<{ ticks: number; secs: number }>(0);
  controllers_dt = new Array<{ ticks: number; secs: number }>(0);
  raw_time_appears = new Array<number>(0);

  controller_time = 0;
  is_include_pan_event = false;
  is_include_ctrl_event = true;


  constructor(
    header: MidiHeader,
    track_tempo: AnyEvent[] | undefined,
    name = "",
    is_include_pan_event = false,
    is_include_ctrl_event = true
  ) {
    this.division = header.ticksPerBeat;
    this.tempo =
      track_tempo?.find(is_set_tempo_event)?.microsecondsPerBeat || 0;

    let tempos_ev = track_tempo?.filter(is_set_tempo_event);

    let tempo_tick_acc = 0;
    let time_appear_in_secs_acc = 0;
    if (tempos_ev) {
      tempos_ev.forEach((ev, idx) => {
        let prev_tempo_ticks = tempo_tick_acc; 
        tempo_tick_acc += ev.deltaTime;

        let new_tempo = new Tempo()
          .set_delta_time(ev.deltaTime)
          .set_ms_secs_per_beat(ev.microsecondsPerBeat)
          .set_time_appear(
            tempo_tick_acc, prev_tempo_ticks,
            this.division, time_appear_in_secs_acc
          )


        this.tempos.push(new_tempo);

        time_appear_in_secs_acc = new_tempo.time_appear.secs;

        //if (0 == idx) {
        //  new_tempo.set_time_appear(tempo_tick_acc, this.division, time_appear_in_secs_acc);
        //  time_appear_in_secs_acc = new_tempo.time_appear.secs;
        //}

      })

      if (this.name == "main") {
        this.debug_tempo();
      }

    }

    this.name = name;
    this.calc_secs_per_tick();
    this.is_include_pan_event = is_include_pan_event;
    this.is_include_ctrl_event = is_include_ctrl_event;
  }

  get_data_basic(track: AnyEvent[] | undefined) {
    this.get_pans_dt(track);
    this.get_controllers_dt(track);
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

    this.pans_dt = track.filter(is_control_pan_event).map((e) => ({
      ticks: e.deltaTime,
      secs: this.tick2sec(e.deltaTime),
    }));
  }

  get_controllers_dt(track: AnyEvent[] | undefined) {
    if (track == undefined) return;

    this.controllers_dt = track.filter(is_controller_event).map((e) => ({
      ticks: e.deltaTime,
      secs: this.tick2sec(e.deltaTime),
    }));
  }

  get_raw_notes(track: AnyEvent[] | undefined) {
    if (track == undefined) return;

    this.raw_notes = track.filter(is_note_event).map((e) => e as NoteEvent);
  }

  get_raw_time_appear() {
    if (!this.raw_notes) return;
    if (this.raw_notes.length == 0) return;

    let tick_acc = 0;


    console.log(`track ${name} has pan events?: ${this.is_include_pan_event}`)
    if (this.is_include_pan_event) {
      tick_acc += this.pans_dt.reduce((acc, cur) => acc + cur.ticks, 0) || 0;
    }

    console.log(`track ${name} has ctrl events?: ${this.is_include_ctrl_event}`)
    if (this.is_include_ctrl_event) {
      tick_acc += this.controllers_dt.reduce((acc, cur) => acc + cur.ticks, 0) || 0;
    }

    console.log(`pre-events time from track ${name}: ${tick_acc}`)

    this.raw_time_appears = this.raw_notes.map(
      (e) => (tick_acc += e.deltaTime)
    );
  }

  get_notes() {
    if (!this.raw_notes) return;
    if (this.raw_notes.length == 0) return;

    this.raw_notes.forEach((e, i) => {
      // merge 2 notes on/off
      if (is_note_off_event(e)) {

        let match_note_id_on = this.find_match_note_id_on(i, e.noteNumber);


        if (match_note_id_on >= 0) {

          let note_on = this.raw_notes[match_note_id_on] as NoteOnEvent;

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
              this.raw_time_appears[i] -
              this.raw_time_appears[match_note_id_on] || 0
            )
            .set_time_appear(this.raw_time_appears[match_note_id_on] || 0)
            .set_from_track(this.name);
          this.notes.push(new_note);

        }
      }
    });
    this.notes.sort((a, b) => a.time_appear.ticks - b.time_appear.ticks);



    // update time appear of notes again in case there are many tempos in one
    // track, prev_tempos will be 1 as first tempo is applied above calculation 
    if (this.tempos.length < 2) return;

    // 1. find note that is last in tempo_idx range [0, 1]
    //let notes_in_first_range = this.notes
    //  .filter(n => n.time_appear.ticks < this.tempos[1].time_appear.ticks)
    //let last_note = notes_in_first_range[length - 1];

    //let time_appear_acc = last_note.time_appear.secs;
    //console.log("last note in first tempo range: ");
    //console.log(last_note);

    let cur_tempos_idx = 0;
    let next_tempos_idx = 1;
    let update_notes_tempo_info = {}
    let time_appear_acc = 0;
    
    while (cur_tempos_idx < this.tempos.length) {


      let range = [cur_tempos_idx, next_tempos_idx]

      if (cur_tempos_idx == this.tempos.length - 1) {
        range = [this.tempos[cur_tempos_idx].time_appear.ticks, Number.MAX_VALUE]
      } else {
        range = [this.tempos[cur_tempos_idx].time_appear.ticks,
        this.tempos[next_tempos_idx].time_appear.ticks]
      }

      update_notes_tempo_info[`tempo_${cur_tempos_idx}`] = this.tempos[cur_tempos_idx];


      this.tempo = this.tempos[cur_tempos_idx].ms_secs_per_beat;
      this.calc_secs_per_tick();

      this.notes.forEach((cur_note, idx, self) => {

        if (cur_note.time_appear.ticks >= range[0] 
         && cur_note.time_appear.ticks < range[1]) {

          let prev_note_ticks = 0;
          if (idx > 0) {
            prev_note_ticks = self[idx-1].time_appear.ticks;
          }

          cur_note
            .set_secs_per_tick(this.seconds_per_tick)
            .set_duration(cur_note.time_appear.ticks)
            .set_time_appear_2(
              cur_note.time_appear.ticks, prev_note_ticks, time_appear_acc
            )

          update_notes_tempo_info[`tempo_${cur_tempos_idx}`][`note_${idx}`] = cur_note;

          time_appear_acc = cur_note.time_appear.secs;
        }

      });


      //console.log("range: [%s, %s]", range[0], range[1]);
      //console.log(notes_in_range);
      //console.log("********************")

      cur_tempos_idx = next_tempos_idx;
      next_tempos_idx++;
    }

    if (this.name == "main") {
      console.log(update_notes_tempo_info);
    }

  }

  find_match_note_id_on(id: number, note_off_number: number): number {
    // ----1***********4----- cur
    // -------2*****3------
    // also recalc the delta time of note off 4
    // currently the value is from 3 to 4
    for (let i = id; i >= 0; i--) {
      let note = this.raw_notes[i];
      if (is_note_on_event(this.raw_notes[i])) {
        note = note as NoteOnEvent;
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

  debug_tempo() {
    if (!this.tempos) return;

    console.log("debug-tempos");
    let output = {}
    this.tempos.forEach((t, i) => {
      output[`tempo_${i}`] = t;
    });
    console.log(output);
    console.log("********************");
  }
}

class MergedNote {
  order: number = -1;
  note_off_order = -1;
  from_track: string = "";
  kind: string = "";
  number: number = -1;
  delta_time: DeltaTime = new DeltaTime();
  duration: Duration = new Duration();
  time_appear: TimeAppear = new TimeAppear();
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

  set_time_appear_2(cur_ticks: number, prev_note_ticks: number, prev_note_appear_time_in_secs: number) {
    this.time_appear.seconds_per_tick = this.seconds_per_tick;
    this.time_appear.ticks = cur_ticks;
    this.time_appear.secs =
      this.time_appear.tick2sec(cur_ticks - prev_note_ticks) + prev_note_appear_time_in_secs;

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

class Tempo {
  delta_time: number = 0;
  ms_secs_per_beat: number = 0;
  time_appear: TimeAppear = new TimeAppear()

  set_delta_time(val: number) {
    this.delta_time = val;
    return this;
  }

  set_ms_secs_per_beat(val: number) {
    this.ms_secs_per_beat = val;
    return this;
  }

  set_time_appear(
    cur_ticks: number,
    prev_ticks: number,
    division: number,
    prev_tempo_appear_time_in_secs: number
  ) {
    // recalc sec-per-ticks
    let ms_per_tick = this.ms_secs_per_beat / division;
    let seconds_per_tick = ms_per_tick / 1000000.0;

    //console.log("cur_ticks %s", this.ms_secs_per_beat);
    //console.log("ms_per_tick/division %s / %s", ms_per_tick, division);
    //console.log("seconds_per_tick %s", seconds_per_tick);
    //console.log("********************");
    this.time_appear.seconds_per_tick = seconds_per_tick;
    this.time_appear.ticks = cur_ticks;
    this.time_appear.secs = this.time_appear.tick2sec(cur_ticks - prev_ticks) + prev_tempo_appear_time_in_secs;
    return this;
  }


}

interface ITimeUnit {
  ticks: number;
  secs: number;
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



const is_track_name_event = (ev: AnyEvent): ev is TrackNameEvent =>
  is_any_meta_event(ev) && ev.subtype === "trackName";

const is_set_tempo_event = (ev: AnyEvent): ev is SetTempoEvent =>
  is_any_meta_event(ev) && ev.subtype === "setTempo";

const is_any_meta_event = (ev: AnyEvent): ev is AnyMetaEvent =>
  ev.type === "meta";

const is_note_event = (ev: AnyEvent): ev is NoteEvent =>
  is_any_channel_event(ev) &&
  (ev.subtype === "noteOn" || ev.subtype === "noteOff");

const is_note_on_event = (ev: AnyEvent | NoteEvent): ev is NoteOnEvent =>
  is_any_channel_event(ev) && ev.subtype === "noteOn";

const is_note_off_event = (ev: AnyEvent | NoteEvent): ev is NoteOffEvent =>
  is_any_channel_event(ev) && ev.subtype === "noteOff";

const is_control_pan_event = (ev: AnyEvent): ev is ControllerEvent =>
  is_controller_event(ev) && ev.controllerType == 10;

const is_controller_event = (ev: AnyEvent): ev is ControllerEvent =>
  is_any_channel_event(ev) && ev.subtype === "controller";

const is_any_channel_event = (ev: AnyEvent): ev is AnyChannelEvent =>
  ev.type === "channel";

type NoteEvent = NoteOnEvent | NoteOffEvent;
