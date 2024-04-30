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

export class GDUB {
  tracks: ITracks = {
    tempo: undefined,
    main: undefined,
    motif: undefined,
    relation: undefined,
    include_track_relation: false,
  };
  pos_ids = new Array<number>(0);

  output_final = "";
  total_notes = 0;

  // this midi also have a track called instrumnet, same as gduc, but the main
  // is for right charm the instrument for left char
  track_instrument?: MfTrack = undefined;

  constructor(
    midi: MidiFile,
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


    if (track_main == undefined) {
      // find first track that has note
      track_main = midi.tracks.find((track) => {
         return track.some(is_note_event);
      })
    } 




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


    //--------------------
    // @track-instrument
    //--------------------
    let track_instruments = midi.tracks.filter((track_events) => {
      return track_events
        .filter(is_track_name_event)
        .find((n) => n.text == "instrument");
    });

    let track_instrument_events = track_instruments.find((track) => {
      let notes = track.filter(is_note_event).map((e) => e as NoteEvent);
      return notes.length > 0;
    });
    
    this.track_instrument = new MfTrack(
      midi.header, track_tempo, "instrument",
      include_pan_events,
      include_ctrl_events
    )
    this.track_instrument.get_data_basic(track_instrument_events);


    //------------------
    // @track-relation
    //------------------
    this.tracks.relation = new MfTrack(
      midi.header, track_tempo, "relation",
      include_pan_events,
      include_ctrl_events
    );
    this.tracks.relation.get_data_basic(track_relation);
    


  }


  get_output(has_cutter = false, note_start = 0, note_end = 0, cut_start_time = 0) {

    let final_notes: MergedNote[];

    // refine track_main
    let main_include_notes_number = [96, 97, 98, 99, 100, 101];
    let relation_inclucde_notes_number = Array(6)
      .fill(0)
      .map((_, index) => index);

    final_notes = [...(this.tracks?.main?.notes ?? [])];
    let include_numbers = [...main_include_notes_number];

    
    // combine all notes from track instrument 
    final_notes = [...final_notes, ...(this.track_instrument?.notes ?? [])]

    //if (bh.include_track_relation) {
    //  final_notes = [...final_notes, ...(bh?.track_relation?.notes ?? [])];
    //  include_numbers = [...include_numbers, ...relation_inclucde_notes_number];
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
    let output = final_notes.map((n, i, self) => {

      //pid - position-id
      //|….0….1….2….|….3….4….5….|
        let pid = "none";
        if (n.number == 101) {
          pid = "0";
        }

        if (n.number == 100) {
          pid = "1";
        }

        if (n.number == 99) {
          pid = "2";
        }

        if (n.number == 98) {
          pid = "3";
        }

        if (n.number == 97) {
          pid = "4";
        }

        if (n.number == 96) {
          pid = "5";
        }

      // moodchange
      // let is_mc = "0";
      // if (this.tracks.include_track_relation) {
      //
      //   let found = this.tracks?.relation?.notes.some(
      //     e => e.time_appear.ticks == n.time_appear.ticks
      //   );
      //   if (found) {
      //     if (mc_cnt > 1) {
      //       is_mc = "1";
      //       // console.log(`note ${i}: has mood change`)
      //     }
      //     mc_cnt++;
      //     pid = "2"; // tile-long is at middle
      //   }
      // }

      let ts = 0;
      if (i == 0) {
        ts = self[i].time_appear.secs - 0; 
      } else {
        ts = self[i].time_appear.secs - self[i-1].time_appear.secs;
      }

      let id_str = `id:${i}`;
      let n_str = `n:${n.number}`;
      let ta_str = `ta:${n.time_appear.secs}`;
      let ts_str = `ts:${ts}`;
      let d_str = `d:${n.duration.secs}`;
      let v_str = `v:${n.velocity}`;
      let pid_str = `pid:${pid}`;
      return [id_str, n_str, ta_str, ts_str, d_str, v_str, pid_str].join("-");
    });
    this.total_notes = final_notes.length;

    //----------------------------------------

    if (has_cutter) {
      let tmp = final_notes
        .filter((n, i) => i >= note_start && i <= note_end)

      this.total_notes = tmp.length;

      output = tmp.map((n, i, self) => {

      //pid - position-id
      //|….0….1….2….|….3….4….5….|
        let pid = "none";
        if (n.number == 101) {
          pid = "0";
        }

        if (n.number == 100) {
          pid = "1";
        }

        if (n.number == 99) {
          pid = "2";
        }

        if (n.number == 98) {
          pid = "3";
        }

        if (n.number == 97) {
          pid = "4";
        }

        if (n.number == 96) {
          pid = "5";
        }

      // moodchange
      // let is_mc = "0";
      // if (this.tracks.include_track_relation) {
      //
      //   let found = this.tracks?.relation?.notes.some(
      //     e => e.time_appear.ticks == n.time_appear.ticks
      //   );
      //   if (found) {
      //     if (mc_cnt > 1) {
      //       is_mc = "1";
      //       // console.log(`note ${i}: has mood change`)
      //     }
      //     mc_cnt++;
      //     pid = "2"; // tile-long is at middle
      //   }
      // }

      let ta = self[i].time_appear.secs - cut_start_time;
      let ts = 0;
      if (i == 0) {
        ts = self[i].time_appear.secs - 0; 
      } else {
        // let ta_prev = self[i-1].time_appear.secs - cut_start_time;
        ts = self[i].time_appear.secs - self[i-1].time_appear.secs;
      }

      let id_str = `id:${i}`;
      let n_str = `n:${n.number}`;
      let ta_str = `ta:${ta}`;
      let ts_str = `ts:${ts}`;
      let d_str = `d:${n.duration.secs}`;
      let v_str = `v:${n.velocity}`;
      let pid_str = `pid:${pid}`;
      return [id_str, n_str, ta_str, ts_str, d_str, v_str, pid_str].join("-");
      });
    }
    return output.join(",");
  }
}
