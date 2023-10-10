import {
  Track as MfTrack,
  MergedNote,
  is_set_tempo_event,
  is_track_name_event,
  is_note_event,
  NoteEvent,
} from "@/modules/midi";

import { read as midi_read, MidiFile } from "midifile-ts";

interface ITracks {
  tempo?: MfTrack;
  main?: MfTrack;
  motif?: MfTrack;
  relation?: MfTrack;
  include_track_relation: boolean;
}

export class DR {
  tracks: ITracks = {
    tempo: undefined,
    main: undefined,
    motif: undefined,
    relation: undefined,
    include_track_relation: false,
  };
  pos_ids = new Array<number>(0);

  cutter = {
    enabled: false,
    note_start: 0,
    note_end: 0,
    song_start_time: 0,
  };

  output_final = "";
  total_notes = 0;

  constructor(midi: MidiFile, enabled_cutter = false) {
    let track_tempo = midi.tracks.find((track_events) =>
      track_events.find(is_set_tempo_event)
    );

    // console.log("midi data");
    // console.log(midi);
    // console.log("********************");

    let track_mains = midi.tracks.filter((track_events) => {
      return track_events
        .filter(is_track_name_event)
        .find((n) => n.text == "main");
    });

    let track_main = track_mains.find((track) => {
      let notes = track.filter(is_note_event).map((e) => e as NoteEvent);
      return notes.length > 0;
    });

    // console.log("track main");
    // console.log(track_main);
    // console.log("********************");

    let track_relation = midi.tracks.find((track_events) => {
      return track_events
        .filter(is_track_name_event)
        .find((n) => n.text == "relation");
    });
    // console.log("track relation");
    // console.log(track_relation);
    // console.log("********************");

    //--------------
    // @track-main
    //--------------
    this.tracks.main = new MfTrack(midi.header, track_tempo, "main");
    this.tracks.main.get_data_basic(track_main);

    //------------------
    // @track-relation
    //------------------
    this.tracks.relation = new MfTrack(midi.header, track_tempo, "relation");
    this.tracks.relation.get_data_basic(track_relation);

    //----------------------------------------
    this.cutter.enabled = enabled_cutter;
  }

  get_output() {
    let final_notes: MergedNote[];

    // refine track_main
    let main_include_notes_number = [84, 85, 86, 96, 97, 98, 88, 100, 102];
    let relation_included_notes_number = Array(6)
      .fill(0)
      .map((_, index) => index);
    final_notes = [...(this.tracks?.main?.notes ?? [])];
    let include_numbers = [...main_include_notes_number];

    if (this.tracks.include_track_relation) {
      // final_notes = [...final_notes, ...(this.tracks?.relation?.notes ?? [])];
      //
      // include_numbers = [...include_numbers, ...relation_included_notes_number];
    }

    final_notes = final_notes
      .filter((n) => include_numbers.includes(n.number))
      .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks);

    console.log("final_notes");
    console.log(final_notes);
    console.log("********************");

    // if (this.tracks?.relation?.notes) {
    //   let tmp = this.tracks.relation.notes;
    //
    //   final_notes.forEach((n, i, self) => {
    //     let found = tmp.some((t) => n.time_appear.ticks == t.time_appear.ticks);
    //     if (found) {
    //       console.log("found note relation same with note on: ");
    //       console.log(n);
    //       console.log("********************");
    //     }
    //   });
    // }

    //----------
    // @output
    //----------
    let is_cg_cnt = 0;
    let cur_relation_note_number = -1;
    if (this.tracks?.relation?.notes) {
      let tmp = this.tracks?.relation?.notes.filter((n) =>
        relation_included_notes_number.includes(n.number)
      );
      if (tmp && tmp.length > 0) {
        cur_relation_note_number = tmp[0].number;
      }
    }

    let output = final_notes.map((n, i, self) => {
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

      let ts =
        i == 0
          ? self[i].time_appear.secs
          : self[i].time_appear.secs - self[i - 1].time_appear.secs;

      // is color-gate and road break
      let is_cg = "0";
      if (this.tracks?.relation?.notes) {
        //
        let note_found = this.tracks.relation.notes.find((t) => {
          return n.time_appear.ticks == t.time_appear.ticks;
        });

        if (note_found != null && note_found != undefined) {
          if (is_cg_cnt > 1) {
            is_cg = "1";
          }
          // color-gate-change is at middle
          is_cg_cnt++;
          pid = "1";
        }
      }

      let id_str = `id:${i}`;
      let n_str = `n:${n.number}`;
      let ta_str = `ta:${n.time_appear.secs}`;
      let ts_str = `ts:${ts}`;
      let d_str = `d:${n.duration.secs}`;
      let v_str = `v:${n.velocity}`;
      let pid_str = `pid:${pid}`;
      let is_cg_str = `icg:${is_cg}`;
      return [
        id_str,
        n_str,
        ta_str,
        ts_str,
        d_str,
        v_str,
        pid_str,
        is_cg_str,
      ].join("-");
    });
    return output.join(",");
  }
}
