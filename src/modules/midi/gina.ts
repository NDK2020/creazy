
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
  BRSO_Articulate?: MfTrack,
  BRSO_Articulate_3?: MfTrack,
  relation?: MfTrack;
  include_track_relation: boolean;
}

export class GINA {
  tracks: ITracks = {
    tempo: undefined,
    main: undefined,
    relation: undefined,
    BRSO_Articulate: undefined,
    BRSO_Articulate_3: undefined,
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


    // console.log("track main");
    // console.log(track_main);
    // console.log("********************");

    // console.log("track relation");
    // console.log(track_relation);
    // console.log("********************");


    //------------------------
    // @track-brso-articulate
    //------------------------
    let track_brso_articulates = midi.tracks.filter((track_events) => {
      return track_events
        .filter(is_track_name_event)
        .find((n) => n.text == "BRSO Articulate");
    });

    let track_brso_articulate = track_brso_articulates.find((track) => {
      let notes = track.filter(is_note_event).map((e) => e as NoteEvent);
      return notes.length > 0;
    });

    this.tracks.BRSO_Articulate = new MfTrack(
      midi.header, track_tempo, "brso_articulate",
      include_pan_events,
      include_ctrl_events
    );
    this.tracks.BRSO_Articulate.get_data_basic(track_brso_articulate);


    //--------------------------
    // @track-brso-articulate-3
    //--------------------------
    let track_brso_articulates_3 = midi.tracks.filter((track_events) => {
      return track_events
        .filter(is_track_name_event)
        .find((n) => n.text == "BRSO Articulate #3" || "BRSO Articulate #2");
    });


    let track_brso_articulate_3 = track_brso_articulates_3.find((track) => {
      let notes = track.filter(is_note_event).map((e) => e as NoteEvent);
      return notes.length > 0;
    });

    this.tracks.BRSO_Articulate_3 = new MfTrack(
      midi.header, track_tempo, "brso_articulate_3",
      include_pan_events,
      include_ctrl_events
    );
    this.tracks.BRSO_Articulate_3.get_data_basic(track_brso_articulate_3);

    //------------------
    // @track-relation
    //------------------
    let track_relation = midi.tracks.find((track_events) => {
      return track_events
        .filter(is_track_name_event)
        .find((n) => n.text == "relation");
    });

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
    let main_include_notes_number = [81, 80, 79, 79, 77, 76, 75, 74, 73];

    let relation_include_notes_number = Array(13)
      .fill(0)
      .map((_, index) => index)
    ;

    final_notes = [...(this.tracks?.BRSO_Articulate?.notes ?? [])];
    final_notes = [...final_notes, ...(this.tracks?.BRSO_Articulate_3?.notes ?? [])];
    let include_numbers = [...main_include_notes_number];

    //if (bh.include_track_relation) {
    //  final_notes = [...final_notes, ...(bh?.track_relation?.notes ?? [])];
    //  include_numbers = [...include_numbers, ...relation_inclucde_notes_number];
    //}

    //if (this.tracks.include_track_relation) {
    //  final_notes = [...final_notes, ...(this.tracks?.relation?.notes ?? [])];
    //}

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
      if (81 === n.number) {
        pid = "1";
      }

      if (80 == n.number ) {
        pid = "2";
      }

      if (79 == n.number) {
        pid = "3";
      }

      if (78 == n.number) {
        pid = "4";
      }

      if (77 == n.number) {
        pid = "5";
      }

      if (76 == n.number) {
        pid = "6";
      }

      if (75 == n.number) {
        pid = "7";
      }

      if (74 == n.number) {
        pid = "8";
      }

      if (73 == n.number) {
        pid = "9";
      }



      // moodchange
      let is_mc = "0";
      if (this.tracks.include_track_relation) {

        let found = this.tracks?.relation?.notes.some(
          e => e.time_appear.ticks == n.time_appear.ticks
        );
        if (found) {
          if (mc_cnt > 1) {
            is_mc = "1";
            // console.log(`note ${i}: has mood change`)
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
