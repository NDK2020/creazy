
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
        .find((n) => n.text === "BRSO Articulate" || n.text == "main");
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
        //.find((n) => n.text == "BRSO Articulate #3" || n.text == "BRSO Articulate #2");
        .find((n) => n.text === "BRSO Articulate #3");
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
    //let main_include_notes_number = [81, 80, 79, 78, 77, 76, 75, 74, 73];
    let left_notes_num = [80, 79, 78];
    let right_notes_num = [76, 75, 74];
    let main_include_notes_number = [...left_notes_num, ...right_notes_num];

    if (this.tracks?.BRSO_Articulate?.notes) {
      console.log("BRSO_Articulate notes");
      console.log(
        this.tracks?.BRSO_Articulate?.notes
          .filter((n) => main_include_notes_number.includes(n.number))
          .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks)
      );
      console.log("********************");
    }

    if (this.tracks?.BRSO_Articulate_3?.notes) {
      console.log("BRSO_Articulate_3 notes");
      console.log(
        this.tracks?.BRSO_Articulate_3?.notes
          .filter((n) => main_include_notes_number.includes(n.number))
          .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks)
      );
      console.log("********************");
    }

    final_notes = [...(this.tracks?.BRSO_Articulate?.notes ?? [])];
    final_notes = [...final_notes, ...(this.tracks?.BRSO_Articulate_3?.notes ?? [])];

    let include_numbers = [...main_include_notes_number];

    let change_mood_notes_list = final_notes
      .filter((n) => [83, 71].includes(n.number))
      .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks)
    ;

    final_notes = final_notes
      .filter((n) => include_numbers.includes(n.number))
      .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks)
      //.filter((cur, cur_idx,self) => 
      //  !self.some(
      //    (dup, dup_idx) => dup_idx < cur_idx 
      //      && dup.time_appear.ticks == cur.time_appear.ticks 
      //      && dup.number == cur.number
      //  )
      //)


    console.log("final_notes");
    console.log(final_notes);
    console.log("********************");


    //--------------
    // @bh/@output
    //--------------
    let mc_cnt = 0;
    let output = final_notes.map((cur_note, i, self) => {

      //pid - position-id
      //|….1….3….5….|
      //|…..2...4…..|
      let pid = "none";

      //--- left
      if (80 == cur_note.number ) {
        pid = "3";
      }

      if (79 == cur_note.number) {
        pid = "2";
      }

      if (78 == cur_note.number) {
        pid = "1";
      }

      //--- right
      if (76 == cur_note.number) {
        pid = "3";
      }

      if (75 == cur_note.number) {
        pid = "2";
      }

      if (74 == cur_note.number) {
        pid = "1";
      }
      // moodchange
      let is_mc = "0";

      // handle left side
      let found_mood_change_on_left = change_mood_notes_list.some(
        cm_n => cm_n.time_appear.ticks === cur_note.time_appear.ticks && cm_n.number === 83
      )

      if (found_mood_change_on_left && [80, 79, 79].includes(cur_note.number)) {
        is_mc = "1"
      } 

      // handle right side
      let found_mood_change_on_right = change_mood_notes_list.some(
        cm_n => cm_n.time_appear.ticks === cur_note.time_appear.ticks && cm_n.number === 83
      )

      if (found_mood_change_on_right && [76, 75, 74].includes(cur_note.number)) {
        is_mc = "1"
      } 


      let id_str = `id:${i}`;
      let n_str = `n:${cur_note.number}`;
      let pid_str = `pid:${pid}`;
      let ta_str = `ta:${cur_note.time_appear.secs}`;
      let d_str = `d:${cur_note.duration.secs}`;
      let v_str = `v:${cur_note.velocity}`;
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
