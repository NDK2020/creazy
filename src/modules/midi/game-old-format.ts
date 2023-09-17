

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

export class GameOldFormat {
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

    if (track_main == undefined) {
      // find first track that has note
      track_main = midi.tracks.find((track) => {
         return track.some(is_note_event);
      })
    } 

    // console.log("track main");
    // console.log(track_main);
    // console.log("********************");

    //--------------
    // @track-main
    //--------------
    this.tracks.main = new MfTrack(midi.header, track_tempo, "main");
    this.tracks.main.get_data_basic(track_main);

  }


  get_output() {

    let final_notes: MergedNote[];

    // refine track_main
    let main_include_notes_number = [96, 97, 98, 99, 100];
    let relation_inclucde_notes_number = Array(6)
      .fill(0)
      .map((_, index) => index);

    final_notes = [...(this.tracks?.main?.notes ?? [])];
    let include_numbers = [...main_include_notes_number];


    //remove duplicate time_appear note
    const all_ta = final_notes.map(({time_appear}) => time_appear);
    final_notes = final_notes
      // .filter((n) => include_numbers.includes(n.number))
      .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks);


    console.log("final_notes");
    console.log(final_notes);
    console.log("********************");


    //------------
    // @/@output
    //------------

    let output = new Array<string>(0);
    for(let i = 0; i < final_notes.length; i++) {

      if (i == 0) {
        output.push((final_notes[i].time_appear.secs - 0).toString());
      }

      if (i > 0) {
        let v = final_notes[i].time_appear.secs - final_notes[i-1].time_appear.secs;
        output.push(v.toString());
      }

    }

    this.total_notes = final_notes.length;

    //----------------------------------------
    output = Array.from(new Set(output));

    return output.join(",");
  }
}
