use crate::core::{Note, Track};
//
use midi_file::core::Message;
use midi_file::file::{
  Division, Event, Header, MetaEvent, QuarterNoteDivision, Track as MfTrack, TrackEvent,
};
use midi_file::MidiFile;
//
use crate::libs::custom_macros as cm;
use serde::Serialize;

//--------
//-- @dr
//--------
#[derive(Clone, Debug, Default, Serialize)]
pub struct Dr {
  num_of_tracks: u32,
  // pulse per quarter note/division
  // `u14` and thus has the range 1 to 16,383.
  // The default value is 1024.
  division: u16,
  track_main: Track,
  track_relation: Track,
  output: Vec<String>,
}

impl Dr {
  pub fn get_data_from(&mut self, midi_file: MidiFile) {
    assert_ne!(midi_file.tracks_len(), 0);
    self.set_num_tracks(midi_file.tracks_len());
    //
    let mut tracks: Vec<MfTrack> = midi_file.tracks().cloned().collect();

    //header
    self.read_header(midi_file.header());
    //
    // self.log_header();

    //get main track
    let mut track_has_tempo: MfTrack = MfTrack::default();
    let mut main_track: MfTrack = MfTrack::default();
    let mut relation_track: MfTrack = MfTrack::default();

    let tracks_clone = tracks.clone();
    tracks_clone.iter().enumerate().for_each(|(i, track)| {
      track.events().for_each(|te| {
        // TrackEvent { delta_time: 0, event: Meta(SetTempo(MicrosecondsPerQuarter(468750))) }

        if let Event::Meta(MetaEvent::SetTempo(ms_per_quarter)) = te.event() {
          println!("{}", ms_per_quarter);
          track_has_tempo = track.clone();
        }

        if let Event::Meta(MetaEvent::TrackName(name)) = te.event() {
          if (name.to_string().eq_ignore_ascii_case("main")) {
            main_track = track.clone();
            println!("{}", name);
          }

          if (name.to_string().eq_ignore_ascii_case("relation")) {
            relation_track = track.clone();
            println!("{}", name);
          }
        }
      })
    });

    self
      .track_main
      .get_data_from_main_track(midi_file.header(), &track_has_tempo, &main_track);

    self.track_relation.get_data_from_relation_track(
      midi_file.header(),
      &track_has_tempo,
      &relation_track,
    );

    // self.track_main.log_overall();
    // self.track_relation.log_overall();
    self.refine_track_relation();
  }

  fn refine_track_relation(&mut self) {
    println!("refine track relation: ");
    let notes_on = self.track_relation.notes_on().clone();
    let notes_off = self.track_relation.notes_off().clone();

    let new_notes_on: Vec<Note> = notes_off
      .iter()
      .filter(|n| {
        // n.note_number() == 0 as u8 || n.note_number() == 1 || n.note_number() == 2
        // *n.note_number() == 0
        //   || *n.note_number() == 1
        //   || *n.note_number() == 2
        //   || *n.note_number() == 3
        //   || *n.note_number() == 4
        //   || *n.note_number() == 5
        (0..=5).any(|x| *n.note_number() == x)
      })
      .cloned()
      .collect();

    new_notes_on.iter().for_each(|n| println!("{:?}", n));
    // println!("{:?}", new_notes_on);
  }

  pub fn read_header(&mut self, header: &Header) {
    let division = header.division();
    if let Division::QuarterNote(quarter_note_division) = division {
      self.set_division(quarter_note_division.get());
    }
  }

  pub fn set_num_tracks(&mut self, value: u32) {
    self.num_of_tracks = value;
  }

  fn set_division(&mut self, value: u16) {
    self.division = value;
  }
}
