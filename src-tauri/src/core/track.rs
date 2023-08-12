use crate::core::Note;
use midi_file::core::Message;
use midi_file::file::{
  Division, Event, Header, MetaEvent, QuarterNoteDivision, Track as MfTrack, TrackEvent,
};

use crate::libs::custom_macros as cm;
use serde::Serialize;

//-----------
//-- @track
//-----------
#[derive(Clone, Debug, Default, Serialize)]
pub struct Track {
  id: i32,
  /// Tempo Meta-Event
  /// (tt tt tt) 3 bytes that specify the amt of ms per quarter note
  /// eg: 0x07A120 = 500_000 ms
  ///quarter note duration in milisecons
  ///amount of time(ie, microseconds) per quarter note
  tempo: u32,
  /// num of clock pulses per quarter note
  /// ticks per beat
  division: u16,
  seconds_per_tick: f32,
  name: String,
  num_of_notes: usize,
  raw_notes: Vec<Note>,
  // timespan bwt notes
  timespans: Vec<f32>,
  notes_on: Vec<Note>,
  notes_on_velocity_zero: Vec<Note>,
  notes_off: Vec<Note>,
  notes_names: Vec<String>,
  notes_velocities: Vec<String>,
  raw_str_vec: Vec<String>,
  //Duration is measured as the time between reception of a NoteOn and it’s corresponding NoteOff.
  // There is no way to know the duration of a note until you have seen the noteoff event.  By definition!
  notes_durations: Vec<f32>,
}

impl Track {
  pub fn get_data_from(
    &mut self,
    header: &Header,
    track_has_tempo: &MfTrack,
    track_has_notes: &MfTrack,
  ) {
    self.get_data_from_header(header);
    self.get_data_from_tracks(track_has_tempo, track_has_notes);
    self.calc_notes_delta_time_in_seconds();

    //
    let raw_notes_clone = self.raw_notes.clone();
    self.set_notes_on(&raw_notes_clone);
    self.set_notes_on_velocity_zero(&raw_notes_clone);
    self.set_notes_off(&raw_notes_clone);
    self.set_notes_durations();
    //
    let notes_on_clone = self.notes_on.clone();
    self.set_notes_names(&notes_on_clone);
    self.set_notes_velocities(&notes_on_clone);
    //
    self.get_timespans();
    self.get_raw_str_vec();
    //
    self.refine();
  }

  fn get_data_from_header(&mut self, header: &Header) {
    let division = header.division();
    if let Division::QuarterNote(quarter_note_division) = division {
      self.set_division(quarter_note_division.get());
    }
  }

  fn set_division(&mut self, value: u16) {
    self.division = value;
  }

  fn get_data_from_tracks(&mut self, track_has_tempo: &MfTrack, track_has_notes: &MfTrack) {
    self.get_tempo(track_has_tempo);
    self.calc_sec_per_tick();
    //
    self.get_name(track_has_notes);
    self.get_notes(track_has_notes);
  }

  pub fn get_tempo(&mut self, track: &MfTrack) {
    let track_events_iter = track.events();

    let mut has_tempo = false;
    track.events().for_each(|te| {
      if let Event::Meta(MetaEvent::SetTempo(ms_per_quarter)) = te.event() {
        self.set_tempo(ms_per_quarter.get());
        has_tempo = true;
      }
    });

    if (!has_tempo) {
      println!("this track has no TEMPO meta event");
    }
  }
  //

  fn set_tempo(&mut self, value: u32) {
    self.tempo = value;
  }

  pub fn get_name(&mut self, track: &MfTrack) {
    let ev_name = track
      .events()
      .find(|e| matches!(e.event(), Event::Meta(MetaEvent::TrackName(_))));

    if let Event::Meta(MetaEvent::TrackName(name)) = ev_name.unwrap().event() {
      self.set_name(name.to_string());
    }
  }

  fn set_name(&mut self, name: String) {
    self.name = name;
  }

  pub fn get_notes(&mut self, track: &MfTrack) {
    let mut notes: Vec<Note> = Vec::new();
    let mut note_id: i32 = 0;
    for track_event in track.events() {
      if !matches!(track_event.event(), Event::Midi(Message::NoteOn(_)))
        && !matches!(track_event.event(), Event::Midi(Message::NoteOff(_)))
      {
        continue;
      }

      let mut note = Note::default();

      // println!("{:?}", track_event);
      note.get_data_from(note_id, track_event, self.seconds_per_tick);
      notes.push(note);
      note_id += 1;
    }
    self.set_notes(&notes);
    self.set_num_of_notes(&notes);
  }

  pub fn calc_notes_delta_time_in_seconds(&mut self) {
    if (!self.raw_notes.is_empty()) {
      self
        .raw_notes
        .iter_mut()
        .for_each(|n| n.calc_delta_time_in_seconds());
    }
  }

  fn set_notes(&mut self, notes: &Vec<Note>) {
    self.raw_notes = notes.to_owned();
  }

  fn set_num_of_notes(&mut self, notes: &Vec<Note>) {
    self.num_of_notes = notes.len();
  }

  pub fn to_bpm(&self, val: u32) {
    // 60.000.000 / (tt tt tt);
    println!("{} to bpm: {}", val, 60_000_000 / val);
  }

  /// ticks_per_quarter = <PPQ(division) from the header>
  /// µs_per_quarter = <Tempo in latest Set Tempo event>
  /// µs_per_tick = µs_per_quarter / ticks_per_quarter
  /// seconds_per_tick = µs_per_tick / 1.000.000
  /// seconds = ticks * seconds_per_tick
  fn calc_sec_per_tick(&mut self) {
    let microsecond_per_tick = self.tempo as f32 / self.division as f32;
    self.seconds_per_tick = microsecond_per_tick / 1_000_000.0;
  }

  /// In MIDI, each message that starts a note (a Note On message for a particular channel and key with non-zero velocity) must eventually be followed by a message that ends the same note (a Note On message for the same channel and key with zero velocity, or a Note Off message for the same channel and key with any velocity).
  ///
  /// It is possible to start another instance of a note with the same channel and key as a note that is already sounding, but each instance must eventually have a message that ends the note.
  /// However, when there are overlapping notes with the same channel and key, it is ambiguous which end goes with which start. For example, if you encounter the following sequence of messages on the same channel at beat intervals:
  ///
  /// start C5, start C5, end C5, end C5.
  ///
  /// The sequence could be interpreted two ways:
  ///
  /// start a, start b, end b, end a.
  /// or
  /// start a, start b, end a, end b.
  /// Because of this ambiguity, I believe overlapping notes of the same channel and key are usually avoided in MIDI.
  pub fn get_timespans(&mut self) {
    if (self.notes_on_velocity_zero.is_empty()) {
      for (note_on, note_off) in self.notes_on.iter().zip(self.notes_off.iter()) {
        self
          .timespans
          .push(note_on.delta_time_in_seconds() + note_off.delta_time_in_seconds())
      }
    }

    if (self.notes_off.is_empty()) {
      for (note_on, note_on_velocity_zero) in
        self.notes_on.iter().zip(self.notes_on_velocity_zero.iter())
      {
        self
          .timespans
          .push(note_on.delta_time_in_seconds() + note_on_velocity_zero.delta_time_in_seconds())
      }
    }

  }

  pub fn set_notes_on(&mut self, notes: &[Note]) {
    self.notes_on = notes.iter().filter(|e| e.is_on()).cloned().collect();
  }

  pub fn set_notes_on_velocity_zero(&mut self, notes: &[Note]) {
    self.notes_on_velocity_zero = notes
      .iter()
      .filter(|e| e.is_on_velocity_zero())
      .cloned()
      .collect();
  }

  pub fn set_notes_off(&mut self, notes: &[Note]) {
    self.notes_off = notes.iter().filter(|e| e.is_off()).cloned().collect();
  }

  pub fn set_notes_durations(&mut self) {
    self.notes_off.iter().for_each(|e| {
      self.notes_durations.push(e.delta_time_in_seconds());
    })
  }

  pub fn set_notes_names(&mut self, notes: &[Note]) {
    self.notes_names = notes.iter().map(|x| x.name()).collect();
  }

  pub fn set_notes_velocities(&mut self, notes: &[Note]) {
    self.notes_velocities = notes.iter().map(|x| x.velocity().to_string()).collect();
  }

  pub fn get_raw_str_vec(&mut self) {
    let mut actual_id = 0; 
    let len = self.timespans.len();
    for (i, t) in self.timespans.iter().enumerate() {
      // note on & note off both equal 0 => this note and a note
      // before has double things depend on games
      if self.check_note_on_off_is_zero(&i) { continue; }
      //
      let mut note_name_mirror = "nil".to_string();
      if (i + 1 < len && self.check_note_on_off_is_zero(&(i + 1))) {
        note_name_mirror = self.notes_on[i + 1].name();
      }

      // get duration
      let mut duration = "nil".to_string();
      if (self.notes_off.len() == self.notes_on.len()) {
        duration = self.notes_durations[i].clone().to_string();
      }

      //
      let str = format!(
        "id:{}-n:{}-t:{}-v:{}-d:{}-m:{}",
        actual_id,
        self.notes_names[i],
        t,
        self.notes_velocities[i],
        duration,
        note_name_mirror
      );
      actual_id += 1;
      self.raw_str_vec.push(str);
    }
  }

  fn check_note_on_off_is_zero(&self, note_id: &usize) -> bool {
    if (self.notes_on.len() != self.notes_off.len()) {
      return false;
    }

    if (self.notes_on[*note_id].delta_time_in_seconds() == 0.0 
    && self.notes_off[*note_id].delta_time_in_seconds() == 0.0) {
      return true;
    }
    false
  }

  fn refine(&mut self) {
    // refine
    self.timespans = self.timespans
      .clone()
      .into_iter()
      .filter(|&e| e > 1e-2)
      .collect();
  }


  pub fn log(&self) {
    println!("--------------------");
    println!(
      "track: 
      id: {}
      tempo: {}
      name: {}
      num_of_raw_notes: {}
    ",
      self.id, self.tempo, self.name, self.num_of_notes
    );
    self.log_notes();
    println!("--------------------");
    println!(
      "\ntimespans - {} unit: {:?}",
      self.timespans.len(),
      self.timespans
    );
    println!("timspan sum: {}", self.timespans.iter().sum::<f32>());
    println!("\nnotes_on - {} unit: ", self.notes_on.len());
    self.notes_on.iter().for_each(|e| println!("{:?}", e));
    println!(
      "\nnotes_on_velocity_zero - {} unit: ",
      self.notes_on_velocity_zero.len()
    );
    self
      .notes_on_velocity_zero
      .iter()
      .for_each(|e| println!("{:?}", e));
    println!("\nnotes_off - {} unit: ", self.notes_off.len());
    self.notes_off.iter().for_each(|e| println!("{:?}", e));
    println!(
      "\nnotes_names - {} unit: {:?}",
      self.notes_names.len(),
      self.notes_names
    );
    println!(
      "\nnotes_velocities - {} unit: {:?}",
      self.notes_velocities.len(),
      self.notes_velocities
    );

    println!(
      "\nraw vec string - {} unit: {:?}",
      self.raw_str_vec.len(),
      self.raw_str_vec
    );
    println!("--------------------");
  }

  fn log_notes(&self) {
    println!("notes: ");
    self.raw_notes.iter().for_each(|e| println!("{:?}", e));
  }

  pub fn log_overall(&self) {
    println!(
      "track: 
      id: {}
      tempo: {}
      name: {}
      num_of_raw_notes: {}
    ",
      self.id, self.tempo, self.name, self.num_of_notes
    );
    println!("--------------------");
    println!(
      "\ntimespans - {} unit: {:?}",
      self.timespans.len(),
      self.timespans
    );
    println!("timspan sum: {}", self.timespans.iter().sum::<f32>());

    println!(
      "\nraw vec string - {} unit: {:?}",
      self.raw_str_vec.len(),
      self.raw_str_vec
    );
    println!("num_of_notes_on: {}", self.notes_on.len());
    println!(
      "num_of_notes_on_velocity_zero: {}",
      self.notes_on_velocity_zero.len()
    );
    println!("num_of_nots_off: {}", self.notes_off.len());
    println!("--------------------\n");
  }
}
