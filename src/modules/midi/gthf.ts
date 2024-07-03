
import {
  Track as MfTrack,
  MergedNote,
  is_set_tempo_event,
  is_track_name_event,
  is_note_event,
  NoteEvent
} from "@/modules/midi";

import { read as midi_read, MidiFile } from "midifile-ts";

interface ITracks {
  tempo?: MfTrack;
  main?: MfTrack;
  motif?: MfTrack;
  relation?: MfTrack;
  include_track_relation: boolean;
}

export class GTHF {
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

  constructor(
    midi: MidiFile,
    include_track_relation = false,
    include_pan_events = false,
    include_ctrl_events = true
  ) {

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
    this.tracks.main = new MfTrack(
      midi.header, track_tempo, "main",
      include_pan_events,
      include_ctrl_events
    );
    this.tracks.main.get_data_basic(track_main);

    //------------------
    // @track-relation
    //------------------
    this.tracks.relation = new MfTrack(
      midi.header, track_tempo, "relation",
      include_pan_events,
      include_ctrl_events
    );
    this.tracks.relation.get_data_basic(track_relation);


    //----------------------------------------
    //this.cutter.enabled = enabled_cutter;

    //----------------------------------------
    this.tracks.include_track_relation = include_track_relation;
  }


  get_output() {

    let final_notes: MergedNote[];

    // refine track_main
    let main_include_notes_number = [96, 97, 98, 99, 100];

    let relation_include_notes_number = Array(13)
      .fill(0)
      .map((_, index) => index)
    ;

    final_notes = [...(this.tracks?.main?.notes ?? [])];
    let include_numbers = [...main_include_notes_number];

    //if (bh.include_track_relation) {
    //  final_notes = [...final_notes, ...(bh?.track_relation?.notes ?? [])];
    //  include_numbers = [...include_numbers, ...relation_inclucde_notes_number];
    //}

    if (this.tracks.include_track_relation) {
      final_notes = [...final_notes, ...(this.tracks?.relation?.notes ?? [])];
      // we need extract the note `12` of relation track
      include_numbers = [...include_numbers];
    }

    final_notes = final_notes
      .filter((n) => include_numbers.includes(n.number))
      .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks);

    console.log("final_notes");
    console.log(final_notes);
    console.log("********************");
    console.log("relation");
    console.log(this.tracks?.relation?.notes);

    let used_relation_note = [];

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
        pid = "4";
      }

      if (n.number == 97) {
        pid = "3";
      }

      if (n.number == 98) {
        pid = "2";
      }

      if (n.number == 99) {
        pid = "1";
      }

      if (n.number == 100) {
        pid = "0";
      }

      // moodchange
      let is_mc = "100";
      if (this.tracks.include_track_relation) {

        let found = this.tracks?.relation?.notes.some(
          e => e.time_appear.ticks == n.time_appear.ticks
        );

        let find = this.tracks?.relation?.notes.find(
          e => e.time_appear.ticks == n.time_appear.ticks
        );

        if (found) {
          if (mc_cnt > 1) {
            if (find && !used_relation_note.includes(find.order)) {
              is_mc = `${find.number}`;
              used_relation_note.push(find.order)
              console.log(`note ${i} has mood change`);
              console.log(find);
              console.log("**************")
            }
          }
          mc_cnt++;
          pid = "2"; // tile-long is at middle
        }

      }


      //space_travel 
      let is_st = "0";
      if (n.number == 12) {
        is_st="1";
      }



      let id_str = `id:${i}`;
      let n_str = `n:${n.number}`;
      let pid_str = `pid:${pid}`;
      let ta_str = `ta:${n.time_appear.secs}`;
      let d_str = `d:${n.duration.secs}`;
      let v_str = `v:${n.velocity}`;
      let mc_str = `mc:${is_mc}`;
      let st_str = `st:${is_st}`;
      return [id_str, n_str, pid_str, ta_str, d_str, v_str, mc_str, st_str].join("-");
    });

    this.total_notes = final_notes.length;

    //----------------------------------------

    if (this.cutter?.enabled) {
      let tmp = final_notes.filter((n, i) => i >= this.cutter.note_start && i <=
        this.cutter?.note_end)

      this.total_notes = tmp.length;

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
        let ta_str = `ta:${n.time_appear.secs - this.cutter.song_start_time}`;
        let d_str = `d:${n.duration.secs}`;
        let v_str = `v:${n.velocity}`;
        return [id_str, n_str, pid_str, ta_str, d_str, v_str].join("-");
      });
    }
    return output.join(",");
  }
}
