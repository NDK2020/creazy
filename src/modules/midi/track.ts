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

export class Track {
  name = "";
  tempo = 0.0;
  division = 0.0;
  seconds_per_tick = 0.0;
  num_of_notes = 0.0;
  raw_notes = new Array<NoteEvent>(0);
  notes = new Array<MergedNote>(0);
  pans_dt = new Array<{ ticks: number; secs: number }>(0);
  controllers_dt = new Array<{ ticks: number; secs: number }>(0);
  raw_time_appears = new Array<number>(0);

  controller_time = 0;

  constructor(
    header: MidiHeader,
    track_tempo: AnyEvent[] | undefined,
    name = ""
  ) {
    this.division = header.ticksPerBeat;
    this.tempo =
      track_tempo?.find(is_set_tempo_event)?.microsecondsPerBeat || 0;
    this.name = name;
    this.calc_secs_per_tick();
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

    let tick_acc = this.pans_dt.reduce((acc, cur) => acc + cur.ticks, 0) || 0;
    tick_acc += this.controllers_dt.reduce((acc, cur) => acc + cur.ticks, 0) || 0;
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
}

export class MergedNote {
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

export const is_track_name_event = (ev: AnyEvent): ev is TrackNameEvent =>
  is_any_meta_event(ev) && ev.subtype === "trackName";

export const is_set_tempo_event = (ev: AnyEvent): ev is SetTempoEvent =>
  is_any_meta_event(ev) && ev.subtype === "setTempo";

const is_any_meta_event = (ev: AnyEvent): ev is AnyMetaEvent =>
  ev.type === "meta";

export const is_note_event = (ev: AnyEvent): ev is NoteEvent =>
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

export type NoteEvent = NoteOnEvent | NoteOffEvent;
