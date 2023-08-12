use crate::core::Note;
use crate::core::Track as CoreTrack;
//
use midi_file::core::Message;
use midi_file::file::{Division, Event, Header, MetaEvent, QuarterNoteDivision, Track, TrackEvent};
use midi_file::MidiFile;
//
use serde::Serialize;

//----------
//-- @data
//----------

#[derive(Debug, Default, Serialize)]
pub struct Data {
  num_of_tracks: u32,
  // pulse per quarter note/division
  // `u14` and thus has the range 1 to 16,383.
  // The default value is 1024.
  division: u16,
  track_main: CoreTrack,
  track_has_tempo_ids: Vec<usize>,
  track_has_note_id: usize,
}

impl Data {
  pub fn get_data_from(&mut self, midi_file: MidiFile) {
    assert_ne!(midi_file.tracks_len(), 0);
    self.set_num_tracks(midi_file.tracks_len());
    //
    let mut tracks: Vec<Track> = midi_file.tracks().cloned().collect();

    //header
    self.read_header(midi_file.header());
    //
    // self.log_header();

    //get main track

    self.classify_tracks(tracks.clone());
    if self.track_has_note_id < self.num_of_tracks as usize {
      let mut track_has_tempo_closest_id = 0;
      self.track_has_tempo_ids.iter().for_each(|e| {
        if (e <= &self.track_has_note_id) {
          track_has_tempo_closest_id = *e;
        }
      });
      let track_has_notes = tracks[self.track_has_note_id].clone();
      let track_closest_has_tempo = tracks[track_has_tempo_closest_id].clone();
      self.track_main.get_data_from_main_track(
        midi_file.header(),
        &track_closest_has_tempo,
        &track_has_notes
      );
    } else {
      println!("midi file doesn't have notes or tempo event");
    }
  }

  pub fn set_num_tracks(&mut self, value: u32) {
    self.num_of_tracks = value;
  }

  pub fn read_header(&mut self, header: &Header) {
    let division = header.division();
    if let Division::QuarterNote(quarter_note_division) = division {
      self.set_division(quarter_note_division.get());
    }
  }

  fn set_division(&mut self, value: u16) {
    self.division = value;
  }

  fn classify_tracks(&mut self, tracks: Vec<Track>) {
    tracks.iter().enumerate().for_each(|(i, track)| {
      // find track has tempo
      track.events().for_each(|te| {
        if let Event::Meta(MetaEvent::SetTempo(ms_per_quarter)) = te.event() {
          self.track_has_tempo_ids.push(i);
        }
      })
    });

    let mut found_track_has_notes_on = false;
    tracks.iter().enumerate().for_each(|(i, track)| {
      // find track has tempo
      track.events().for_each(|te| {
        // find track has note::on
        if !found_track_has_notes_on && matches!(te.event(), Event::Midi(Message::NoteOn(_))) {
          self.track_has_note_id = i;
          found_track_has_notes_on = true;
        }
      })
    });
    println!("track-has-note-id: {}", self.track_has_note_id);
  }

  pub fn log(self) {
    println!("--------------------");
    println!("data: {:?}", self);
    println!("--------------------");
  }

  pub fn log_header(&self) {
    println!("--------------------");
    println!(
      "data-header: 
      num_of_tracks: {}
      division/ppq: {}
    ",
      self.num_of_tracks, self.division
    );
    println!("--------------------");
  }

  pub fn log_track(&self, track: &CoreTrack) {
    println!("--------------------");
    println!("data-track: {:?}", track);
    println!("--------------------");
  }

  pub fn log_main_track(&self) {
    self.log_header();
    self.track_main.log();
  }

  pub fn track_main(&self) -> &CoreTrack {
    &self.track_main
  }
}
