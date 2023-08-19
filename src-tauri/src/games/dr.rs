use crate::core::{Note, Track};
//
use midi_file::core::{Control, Message};
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
  //
  control_change_value: f32,
  //
  time_appears: Vec<f32>,
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

    //
    self.track_relation.get_data_from_relation_track(
      midi_file.header(),
      &track_has_tempo,
      &relation_track,
    );

    // self.track_main.log_overall();

    // for (i, (note_on, note_off)) in self
    //   .track_main
    //   .notes_on()
    //   .iter()
    //   .zip(self.track_main.notes_off().iter())
    //   .enumerate()
    // {
    //     println!("{}", note_on.delta_time_in_seconds());
    //     println!("{}", note_off.delta_time_in_seconds());
    //     println!("*********************");
    // }
    // self.track_main.log_overall();
    // self.track_relation.log_overall();
    self.refine_track_main();
    self.refine_track_relation();
    // //
    // // //
    self.gen_output();
  }

  fn refine_track_main(&mut self) {
    println!("refine track main: ");
    let notes_on = self.track_main.notes_on().clone();
    let notes_off = self.track_main.notes_off().clone();

    let mut range_on = (84..=86).chain(96..=98).collect::<Vec<u8>>();
    range_on.extend([88, 100, 102].iter().copied());

    let new_notes_on: Vec<Note> = notes_on
      .iter()
      .filter(|n| range_on.contains(n.note_number()))
      .cloned()
      .collect();
    //
    let new_notes_off: Vec<Note> = notes_off
      .iter()
      .filter(|n| range_on.contains(n.note_number()))
      .cloned()
      .collect();
    //
    self.track_main.set_notes_on(&new_notes_on);
    self.track_main.set_notes_off(&new_notes_off);

    // self.track_main.pans_dt().clone().iter().for_each(|e| println!("{}", e));
    // self
    //   .track_main
    //   .notes_on()
    //   .iter()
    //   .for_each(|e| println!("{:?}", e));
    // self
    //   .track_main
    //   .notes_off()
    //   .iter()
    //   .for_each(|e| println!("{:?}", e));
  }

  fn refine_track_relation(&mut self) {
    println!("refine track relation: ");
    let notes_on = self.track_relation.notes_on().clone();
    let notes_off = self.track_relation.notes_off().clone();

    let new_notes_on: Vec<Note> = notes_on
      .iter()
      .filter(|n| (0..=5).any(|x| *n.note_number() == x))
      .cloned()
      .collect();

    let new_notes_off: Vec<Note> = notes_off
      .iter()
      .filter(|n| (0..=5).any(|x| *n.note_number() == x))
      .cloned()
      .collect();

    self.track_relation.set_notes_on(&new_notes_on);
    self.track_relation.set_notes_off(&new_notes_off);

    // self
    //   .track_relation
    //   .pans_dt()
    //   .clone()
    //   .iter()
    //   .for_each(|e| println!("{}", e));
    // self
    //   .track_relation
    //   .notes_on()
    //   .iter()
    //   .for_each(|e| println!("{:?}", e));
    // self
    //   .track_relation
    //   .notes_off()
    //   .iter()
    //   .for_each(|e| println!("{:?}", e));
  }

  fn gen_output(&mut self) {
    // concat 2 track data
    // let mut notes_on: Vec<Note> = self.track_main.notes_on()
    //   .iter()
    //   .cloned()
    //   .chain(self.track_relation.notes_on().iter().cloned()).collect();
    //
    // notes_on.iter().for_each(|e|  println!("{:?}", e));
    //
    // let mut notes_off: Vec<Note> = self.track_main.notes_off()
    //   .iter()
    //   .cloned()
    //   .chain(self.track_relation.notes_off().iter().cloned()).collect();
    //
    // notes_off.iter().for_each(|e|  println!("{:?}", e));

    //----------------
    // @time-appears
    //----------------
    self.track_main.get_time_appears();
    // self.track_main.time_appears().iter().for_each(|e| println!("{}", e));
    self.track_relation.get_time_appears();
    self.track_relation.time_appears().iter().for_each(|e| println!("{}", e));
    //
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
// Khi đọc Musicalization Content sẽ đc 3 List<NoteData> là main, motif_main, relation
// Track main:
// - đọc toàn bộ lấy note có duration thấp nhất làm chuẩn quét hết các note có cùng duration thấp nhất đó => danh sách note đơn (còn lại là note dài)
// - node đơn có nodeId = 96 97 98 là note đơn cùng màu với bóng của người chơi và có vị trí 1 2 3 từ trái qua phải
// - node đơn có nodeId = 85 85 86 là note đơn khác màu với bóng của người chơi và có vị trí 1 2 3 từ trái qua phải
// - node đơn có nodeId = 102 là hộp quà bí mật
// - các note dài cũng tương tự logic trên nhưng node dài sẽ có hiệu ứng ăn note dài
// - note ngắn có nodeId = 100 là note cùng màu nhưng di chuyển qua lại 2 bên đường
// - note ngắn có nodeId = 88 là note khác màu nhưng di chuyển qua lại 2 bên đường
// Track relation:
// - mỗi một relation là 1 đoạn đường nếu đoạn tiếp theo cùng mood với đoạn trước thì có gờ đổi màu ở đó còn nếu khác mood với trước đó thì là nhảy qua đoạn đường khác.
