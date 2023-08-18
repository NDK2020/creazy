use midi_file::core::{Channel, Message, NoteNumber, Velocity};
use midi_file::file::{Event, TrackEvent};
use serde::Serialize;


//----------
//-- @note
//----------
#[derive(Clone, Debug, Serialize)]
pub struct Note {
  id: i32,
  delta_time: u32,
  kind: Kind,
  channel: String,
  note_number: u8,
  name: String,
  seconds_per_tick: f32,
  velocity: u8,
  /// delta-time: The time difference in ticks between
  /// the previous MIDI track event and the current one
  /// delta-time in seconds
  delta_time_in_seconds: f32,
}

impl Default for Note {
  fn default() -> Self {
    Self {
      id: 0,
      /// number of ticks
      delta_time: 0,
      delta_time_in_seconds: 0.0,
      seconds_per_tick: 0.0,
      channel: "0".to_string(),
      note_number: 0,
      name: "".to_string(),
      velocity: 100,
      kind: Kind::Off,
    }
  }
}

#[derive(Clone, Debug, Serialize)]
pub enum Kind {
  On,
  OnVelocityZero,
  Off,
}

impl Note {
  pub fn get_data_from(&mut self, id: i32, track_event: &TrackEvent, seconds_per_tick: f32) {
    self.get_data_from_track_event(id, track_event);
    self.seconds_per_tick = seconds_per_tick;
  }

  pub fn get_data_from_track_event(&mut self, id: i32, track_event: &TrackEvent) {
    if let Event::Midi(message) = track_event.event() {
      self.set_id(id);
      self.set_delta_time(track_event.delta_time());
      self.get_note_on_data_from_message(message);
    };
  }

  pub fn get_note_on_data_from_message(&mut self, message: &Message) {
    if let Message::NoteOn(note_message) = message {
      self
        .set_channel(note_message.channel())
        .set_note_number(note_message.note_number())
        .set_note_name(note_message.note_number())
        .set_velocity(note_message.velocity())
        .set_kind_on();
    };

    if let Message::NoteOff(note_message) = message {
      self
        .set_channel(note_message.channel())
        .set_note_number(note_message.note_number())
        .set_note_name(note_message.note_number())
        .set_velocity(note_message.velocity())
        .set_kind_off();
    };

  }

  pub fn set_id(&mut self, id: i32) -> &mut Self {
    self.id = id;
    self
  }

  pub fn set_channel(&mut self, channel: Channel) -> &mut Self {
    self.channel = channel.to_string();
    self
  }

  pub fn set_note_number(&mut self, note_number: NoteNumber) -> &mut Self {
    self.note_number = note_number.get();
    self
  }

  pub fn set_note_name(&mut self, note_number: NoteNumber) -> &mut Self {
    self.name = self.convert_note_number_to_name(note_number.get());
    self
  }

  // https://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies
  // https://studiocode.dev/resources/midi-middle-c/
  // overall, base on amanotes definition
  pub fn convert_note_number_to_name(&self, num: u8) -> String {
    match num {
      110 => "D8".to_string(),
      109 => "C#8".to_string(),
      108 => "C8".to_string(),
      102 => "Gb7".to_string(),
      101 => "F7".to_string(),
      100 => "E7".to_string(),
      99 => "Eb7".to_string(),
      98 => "D7".to_string(),
      97 => "Db7".to_string(),
      96 => "C7".to_string(),
      88 => "E6".to_string(),
      86 => "C6".to_string(),
      85 => "Db6".to_string(),
      84 => "D6".to_string(),
      17 => "F0".to_string(),
      16 => "E0".to_string(),
      15 => "D#0".to_string(),
      14 => "D0".to_string(),
      13 => "C#0".to_string(),
      12 => "C0".to_string(),
      5 => "F-1".to_string(),
      4 => "E-1".to_string(),
      3 => "D#-1".to_string(),
      2 => "D-1".to_string(),
      1 => "C#-1".to_string(),
      0 => "C-1".to_string(),
      _ => "none".to_string()
    }
  }

  pub fn set_velocity(&mut self, velocity: Velocity) -> &mut Self {
    self.velocity = velocity.into();
    self
  }

  pub fn set_kind_on(&mut self) -> &mut Self {
    self.kind = Kind::On;
    if (self.velocity == 0) {
      self.kind = Kind::OnVelocityZero;
    }
    self
  }

  pub fn set_kind_off(&mut self) -> &mut Self {
    self.kind = Kind::Off;
    self
  }

  pub fn set_delta_time(&mut self, delta_time: u32) -> &mut Self {
    self.delta_time = delta_time;
    self
  }


  /// A getter for the `delta_time_in_seconds` field.
  pub fn delta_time(&self) -> u32 {
    self.delta_time
  }

  /// A getter for the `delta_time_in_seconds` field.
  pub fn delta_time_in_seconds(&self) -> f32 {
    self.delta_time_in_seconds
  }

  pub fn calc_delta_time_in_seconds(&mut self) {
    self.delta_time_in_seconds = self.delta_time as f32 * self.seconds_per_tick;
  }

  pub fn note_number(&self) -> &u8 {
    &self.note_number
  }

  pub fn name(&self) -> String {
    self.name.clone()
  }

  pub fn velocity(&self) -> u8 {
    self.velocity
  }

  pub fn is_on(&self) -> bool {
    if let Kind::On = self.kind {
      return true;
    }
    false
  }

  pub fn is_on_velocity_zero(&self) -> bool {
    if let Kind::OnVelocityZero = self.kind {
      return true;
    }
    false
  }

  pub fn is_off(&self) -> bool {
    if let Kind::Off = self.kind {
      return true;
    }
    false
  }

}

pub enum NoteName {
  ///C
  C0 = 24,
  C1 = 36,
  C2 = 48,
  C3 = 60,
  C4 = 72,
  C5 = 84,
  C6 = 96,
  C7 = 108,
  C8 = 120,

  ///C#/Db
  Db0 = 25,
  Db1 = 37,
  Db2 = 49,
  Db3 = 61,
  Db4 = 73,
  Db5 = 85,
  Db6 = 97,
  Db7 = 109,
  Db8 = 121,

  ///D
  D0 = 26,
  D1 = 38,
  D2 = 50,
  D3 = 62,
  D4 = 74,
  D5 = 86,
  D6 = 98,
  D7 = 110,
  D8 = 122,

  ///D#/Eb
  Eb0 = 27,
  Eb1 = 39,
  Eb2 = 51,
  Eb3 = 63,
  Eb4 = 75,
  Eb5 = 87,
  Eb6 = 99,
  Eb7 = 111,
  Eb8 = 123,

  ///E
  E0 = 28,
  E1 = 40,
  E2 = 52,
  E3 = 64,
  E4 = 76,
  E5 = 88,
  E6 = 100,
  E7 = 112,
  E8 = 124,

  ///F
  F0 = 29,
  F1 = 41,
  F2 = 53,
  F3 = 65,
  F4 = 77,
  F5 = 89,
  F6 = 101,
  F7 = 113,
  F8 = 125,

  ///Gb
  Gb0 = 30,
  Gb1 = 42,
  Gb2 = 54,
  Gb3 = 66,
  Gb4 = 78,
  Gb5 = 90,
  Gb6 = 102,
  Gb7 = 114,
  Gb8 = 126,

  ///G
  G0 = 31,
  G1 = 43,
  G2 = 55,
  G3 = 67,
  G4 = 79,
  G5 = 91,
  G6 = 103,
  G7 = 115,
  G8 = 127,

  ///G#/Ab
  Ab0 = 32,
  Ab1 = 44,
  Ab2 = 56,
  Ab3 = 68,
  Ab4 = 80,
  Ab5 = 92,
  Ab6 = 104,
  Ab7 = 116,

  ///A
  A0 = 33,
  A1 = 45,
  A2 = 57,
  A3 = 69,
  A4 = 81,
  A5 = 93,
  A6 = 105,
  A7 = 117,

  ///A#/Bb
  Bb0 = 34,
  Bb1 = 46,
  Bb2 = 58,
  Bb3 = 70,
  Bb4 = 82,
  Bb5 = 94,
  Bb6 = 106,
  Bb7 = 118,

  ///B
  B0 = 35,
  B1 = 47,
  B2 = 59,
  B3 = 71,
  B4 = 83,
  B5 = 95,
  B6 = 107,
  B7 = 119,
}
