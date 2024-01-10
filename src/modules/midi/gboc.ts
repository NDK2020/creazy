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

export class GBOC {
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


  constructor(
    midi: MidiFile,
    include_track_relation = false,
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
    this.tracks.main = new MfTrack(midi.header, track_tempo, "main");
    this.tracks.main.get_data_basic(track_main);

    //------------------
    // @track-relation
    //------------------
    this.tracks.relation = new MfTrack(midi.header, track_tempo, "relation");
    this.tracks.relation.get_data_basic(track_relation);



    //----------------------------------------
    this.tracks.include_track_relation = include_track_relation;
  }


  get_output(
    has_cutter = false,
    note_start = 0,
    note_end = 0,
    cut_start_time = 0
  ) {

    let final_notes: MergedNote[];

    // refine track_main
    let main_include_notes_number = [95, 96, 97, 98, 99, 100];
    let relation_included_notes_number = Array(6)
      .fill(0)
      .map((_, index) => index);

    final_notes = [...(this.tracks?.main?.notes ?? [])];
    let include_numbers = [...main_include_notes_number];


    let relation_notes: MergedNote[] | undefined;
    if (this.tracks.include_track_relation) {
      relation_notes = this.tracks?.relation?.notes.filter((n) =>
        relation_included_notes_number.includes(n.number)
      );
      //
      final_notes = [...final_notes, ...(this.tracks.relation?.notes ?? [])];
      include_numbers = [...include_numbers, ...relation_included_notes_number];
    }

    final_notes = final_notes
      .filter((n) => include_numbers.includes(n.number))
      .sort((a, b) => a.time_appear.ticks - b.time_appear.ticks);

    console.log("final_notes");
    console.log(final_notes);
    console.log("********************");


    //--------------
    // @bh/@output
    //--------------
    let rnote_count = 0;
    let first_rnote_exclude = final_notes.find(fn => fn.from_track.includes("relation"));
    let first_rnote_exclude_ta = first_rnote_exclude?.time_appear.ticks;

    let output = final_notes.map((cur_note, i, self) => {

      //pid - position-id
      //|….1….3….5….|
      //|…..2...4…..|
      let pid = "none";

      /* according to
       * https://docs.google.com/spreadsheets/d/1o6sIngj9PwPIhuZE2mAUXRTvSfoSJzSiAY_xv0BJS7A/edit#gid=480870965
       * this rule is currently incorrect
      if (n.number == 84) {
        pid = "0";
      }
  
      if (n.number == 85) {
        pid = "1";
      }
  
      if (n.number == 86) {
        pid = "2";
      }
  
      if (n.number == 87) {
        pid = "3";
      }
  
      if (n.number == 88) {
        pid = "4";
      }
      */

      // now gboc rule is the same as tile-hop
      if (cur_note.number == 96) {
        pid = "0";
      }

      if (cur_note.number == 97) {
        pid = "1";
      }

      if (cur_note.number == 98) {
        pid = "2";
      }

      if (cur_note.number == 99) {
        pid = "3";
      }

      if (cur_note.number == 100) {
        pid = "4";
      }

      // moodchange
      let is_mc = "0";
      let is_dis = "0";
      if (this.tracks.include_track_relation) {
        if (cur_note.from_track.includes("relation")) {

          console.log(`note relation: ${cur_note.number} - ${cur_note.time_appear.ticks}`)
          console.log(` relation-note-count ${rnote_count}`);
          console.log("********************");

          rnote_count = rnote_count + 1;
          if (rnote_count == 1) {
            is_mc = "0";
            is_dis = "1";

            console.log(`rnote count=1 ${i} is disabled`);
          }

          if (rnote_count > 1) {
            is_mc = "1";
            console.log(`cur note ${i}: has mood change`)
          }

          pid = "2"; // tile-for-mood-change is at middle
        }

        // handle case where cur-note is normal note and
        // have same time-appear with mood-change note

        if (!cur_note.from_track.includes("relation")) {

          let has_overlap_is_mood_change_note =
            self.some(
              (nn) =>
                nn.time_appear.ticks === cur_note.time_appear.ticks &&
                nn.from_track.includes("relation")
            );

          let overlap_note = self.find(nn =>
            nn.time_appear.ticks === cur_note.time_appear.ticks &&
            nn.from_track.includes("relation")
          )


          if (first_rnote_exclude_ta === cur_note.time_appear.ticks) {
            is_dis = "0";
          } else {
            if (has_overlap_is_mood_change_note) {
              is_dis = "1";
              console.log(`cur-note ${cur_note.order} is overlap-note ${overlap_note?.order}`);
              console.log(`cur-note ta: ${cur_note.time_appear.ticks} ${cur_note.from_track}`)
              console.log(`overlap_note ta: ${overlap_note?.time_appear.ticks} ${overlap_note?.from_track}`)
              console.log("***********")
            }
          }


        }


      }


      //----------------------------------------
      // detect gift item spawn on top tile
      let is_g = "0";
      if (cur_note.number == 95) {
        console.log(`is note has gift: id:${i}-${cur_note.time_appear.secs}`);
        is_g = "1";
        pid = "-1";
      }

      let ts =
        i == 0
          ? self[i].time_appear.secs
          : self[i].time_appear.secs - self[i - 1].time_appear.secs;

      let id_str = `id:${i}`;
      let n_str = `n:${cur_note.number}`;
      let pid_str = `pid:${pid}`;
      let ta_str = `ta:${cur_note.time_appear.secs}`;
      let ts_str = `ts:${ts}`;
      let d_str = `d:${cur_note.duration.secs}`;
      let v_str = `v:${cur_note.velocity}`;
      let mc_str = `mc:${is_mc}`;
      let is_g_str = `ig:${is_g}`;
      let is_dis_str = `idis:${is_dis}`;

      return [
        id_str,
        n_str,
        pid_str,
        ta_str,
        ts_str,
        d_str,
        v_str,
        mc_str,
        is_g_str,
        is_dis_str
      ].join("-");
    });

    this.total_notes = final_notes.length;

    //----------------------------------------
    //----------------------------------------
    //----------------------------------------
    //----------------------------------------
    rnote_count = 0;
    if (has_cutter) {
      let tmp = final_notes.filter(
        (n, i) => i >= note_start && i <= note_end
      );

      this.total_notes = tmp.length;

      output = tmp.map((cur_note, i, self) => {
        //pid - position-id
        //|….1….3….5….|
        //|…..2...4…..|
        let pid = "none";

        /* according to
         * https://docs.google.com/spreadsheets/d/1o6sIngj9PwPIhuZE2mAUXRTvSfoSJzSiAY_xv0BJS7A/edit#gid=480870965
         * this rule is currently incorrect
        if (n.number == 84) {
          pid = "0";
        }
    
        if (n.number == 85) {
          pid = "1";
        }
    
        if (n.number == 86) {
          pid = "2";
        }
    
        if (n.number == 87) {
          pid = "3";
        }
    
        if (n.number == 88) {
          pid = "4";
        }
        */

        // now gboc rule is the same as tile-hop
        if (cur_note.number == 96) {
          pid = "0";
        }

        if (cur_note.number == 97) {
          pid = "1";
        }

        if (cur_note.number == 98) {
          pid = "2";
        }

        if (cur_note.number == 99) {
          pid = "3";
        }

        if (cur_note.number == 100) {
          pid = "4";
        }

        // moodchange
        let is_mc = "0";
        let is_dis = "0";
        if (this.tracks.include_track_relation) {
          if (cur_note.from_track.includes("relation")) {

            console.log(`note relation: ${cur_note.number} - ${cur_note.time_appear.ticks}`)
            console.log(` relation-note-count ${rnote_count}`);
            console.log("********************");

            rnote_count = rnote_count + 1;
            if (rnote_count == 1) {
              is_mc = "0";
              is_dis = "1";
            }

            if (rnote_count > 1) {
              is_mc = "1";
              console.log(`cur note ${i}: has mood change`)

            }

            pid = "2"; // tile-for-mood-change is at middle
          }

          // handle case where cur-note is normal note and
          // have same time-appear with mood-change note

        if (!cur_note.from_track.includes("relation")) {

          let has_overlap_is_mood_change_note =
            self.some(
              (nn) =>
                nn.time_appear.ticks === cur_note.time_appear.ticks &&
                nn.from_track.includes("relation")
            );

          let overlap_note = self.find(nn =>
            nn.time_appear.ticks === cur_note.time_appear.ticks &&
            nn.from_track.includes("relation")
          )


          if (first_rnote_exclude_ta === cur_note.time_appear.ticks) {
            is_dis = "0";
          } else {
            if (has_overlap_is_mood_change_note) {
              is_dis = "1";
              console.log(`cur-note ${cur_note.order} is overlap-note ${overlap_note?.order}`);
              console.log(`cur-note ta: ${cur_note.time_appear.ticks} ${cur_note.from_track}`)
              console.log(`overlap_note ta: ${overlap_note?.time_appear.ticks} ${overlap_note?.from_track}`)
              console.log("***********")
            }
          }


        }

        //----------------------------------------
        // detect gift item spawn on top tile
        let is_g = "0";
        if (cur_note.number == 95) {
          console.log(`is note has gift: id:${i}-${cur_note.time_appear.secs}`);
          is_g = "1"
          pid = "-1";
        }


        let ta = self[i].time_appear.secs - cut_start_time;
        let ts =
          i == 0
            ? self[i].time_appear.secs
            : self[i].time_appear.secs - self[i - 1].time_appear.secs;

        let id_str = `id:${i}`;
        let n_str = `n:${cur_note.number}`;
        let pid_str = `pid:${pid}`;
        let ta_str = `ta:${ta}`;
        let ts_str = `ts:${ts}`;
        let d_str = `d:${cur_note.duration.secs}`;
        let v_str = `v:${cur_note.velocity}`;
        let mc_str = `mc:${is_mc}`;
        let is_g_str = `ig:${is_g}`;
        let is_dis_str = `idis:${is_dis}`;

        return [
          id_str,
          n_str,
          pid_str,
          ta_str,
          ts_str,
          d_str,
          v_str,
          mc_str,
          is_g_str,
          is_dis_str
        ].join("-");
      });
    }
    return output.join(",");
  }
}
