// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(unused)]
use serde::{ser::Serializer, Deserialize, Serialize};

//-------------
// @midi_file
//-------------
use midi_file::MidiFile;
use midi_file::file::{ Event, MetaEvent, TrackEvent };


use std::io::{BufWriter, Read, Write};
use std::{convert::TryFrom, error::Error, fs, fs::File, path::Path};

mod core;
use crate::core::{Data, Note, Track};

mod games;
use crate::games::Dr;

mod libs;
use crate::libs::custom_macros as cm;

//-------------------------
//-- @midi-readder-writer
//-------------------------
// use midi_reader_writer::{
//     ConvertTicksToMicroseconds, ConvertMicroSecondsToTicks,
//     midly_0_5::{exports::Smf, merge_tracks, TrackSeparator},
// };
// use midly::{Smf, merge_tracks, TrackSeparator};

// lsof -i @localhost
fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![read_midi])
    // .invoke_handler(tauri::generate_handler![get_raw_file])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// create the error type that represents all errors possible in our program
// #[derive(Debug, thiserror::Error)]
// pub enum CommandError {
//   #[error(transparent)]
//   Io(#[from] std::io::Error),
// }
//
// // we must manually implement serde::Serialize
// impl serde::Serialize for Error {
//   fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
//   where
//     S: serde::ser::Serializer,
//   {
//     serializer.serialize_str(self.to_string().as_ref())
//   }
// }

// #[derive(Debug, Deserialize, Serialize)]
// struct MidiResponse {
//   message: String,
//   track: Track,
// }


// pub fn read<R: Read>(r: R) -> Result<Self> {
//   let bytes = r.bytes();
//   let iter = ByteIter::new(bytes).context(io!())?;
//   Ok(Self::read_inner(iter)?)
// }

//------------
// @commands
//------------
#[tauri::command]
fn read_midi(file_path_str: &str) -> Track {
  let midi_file = read_midi_file(file_path_str.to_string());
  let mut data = Data::default();
  data.get_data_from(midi_file);
  data.track_main().clone()
}

// #[tauri::command]
// fn get_raw_file(file_path_str: &str) -> File<tauri::command::Private> {
//   let file_path = &Path::new(&file_path_str);
//   let mut f = File::open(file_path).unwrap();
//   f
// }


//--------
// @test
//--------
#[test]
fn test_read_midi_with_data() {
  let file_path_str = get_file_path();
  println!("file_path: {} ", file_path_str);
  //
  let midi_file = read_midi_file(file_path_str);

  println!("len of tracks: {}", midi_file.tracks_len());
  let mut data = Data::default();
  data.get_data_from(midi_file);
  data.log_main_track();
}

#[test]
fn test_read_midi_dr() {
  let file_path_str = get_file_path();
  println!("file_path: {} ", file_path_str);
  //
  let midi_file = read_midi_file(file_path_str);

  println!("len of tracks: {}", midi_file.tracks_len());
  let mut dr = Dr::default();
  dr.get_data_from(midi_file);
}

// #[test]
// fn test_midly() {
//   let file_path_str = get_file_path();
//   println!("file_path: {} ", file_path_str);
//   // Load bytes first
//   let data = std::fs::read(file_path_str).unwrap();
//
//   // Parse the raw bytes
//   let mut smf = midly::Smf::parse(&data).unwrap();
//
//   for (i, track) in smf.tracks.iter().enumerate() {
//     track.clone().iter().for_each(|te|  {
//       println!("{:?}", te);
//     });
//   }
// }

#[test]
fn test_read_midi_raw() {
  let file_path_str = get_file_path();
  println!("file_path: {} ", file_path_str);
  //
  let midi_file = read_midi_file(file_path_str);

  println!("len of tracks: {}", midi_file.tracks_len());

  let mut tracks = midi_file.tracks();
  for (i, track) in tracks.enumerate() {
    println!("track {} INFO: ", i);
    track.events().for_each(|te| println!("{:?}", te));
    println!("*********************");
  }
}

#[test]
fn test_read_midi_tmain() {
  let file_path_str = get_file_path();
  println!("file_path: {} ", file_path_str);
  //
  let midi_file = read_midi_file(file_path_str);
  let mut tracks = midi_file.tracks();
  for (i, track) in tracks.enumerate() {
    track.events().for_each(|te| {
      if let Event::Meta(MetaEvent::TrackName(name)) = te.event() {
        if (name.to_string().eq_ignore_ascii_case("main")) {
          println!("info of track name: {}", name);
          track.events().for_each(|te| println!("{:?}", te));
        }
      }
    })
  }
}


#[test]
fn test_read_midi_trelation() {
  let file_path_str = get_file_path();
  println!("file_path: {} ", file_path_str);
  //
  let midi_file = read_midi_file(file_path_str);
  let mut tracks = midi_file.tracks();
  for (i, track) in tracks.enumerate() {
    track.events().for_each(|te| {
      if let Event::Meta(MetaEvent::TrackName(name)) = te.event() {
        if (name.to_string().eq_ignore_ascii_case("relation")) {
          println!("info of track name: {}", name);
          track.events().for_each(|te| println!("{:?}", te));
        }
      }
    })
  }
}

#[test]
fn test_read_midi_pitch_bench() {
  let file_path_str = get_file_path();
  println!("file_path: {} ", file_path_str);
  //
  let midi_file = read_midi_file(file_path_str);
}

#[test]
fn test_all_songs() {
  let paths = fs::read_dir("./src/assets/").unwrap();

  for path in paths {
    let path_clone = path.as_ref().unwrap().path().clone();
    // println!("file_name: {}", path.as_ref().unwrap().path().clone().display());
    println!("file_name: {}", path_clone.display());
    let mut f = File::open(path_clone).unwrap();
    let midi_file = MidiFile::read(f).unwrap();
    println!("len of tracks: {}", midi_file.tracks_len());
    let mut data = Data::default();
    data.get_data_from(midi_file);
    data.track_main().log_overall();
    println!("####################\n");
  }
}

fn get_file_path() -> String {
  let base_path = "./src/assets/";
  // let file_name = "Herewithme_playableads_tut";
  // let file_name = "Cupid_FiftyFifty_BH_PlayableAd";
  // let file_name = "Believer_DueCats";
  // let file_name = "a_2-phut-hon_Phao_best-cut_st";
  // let file_name = "a_2-phut-hon_Phao_best-cut_st_v2";
  let file_name = "a_2-phut-hon-phao_15s_st";
  // let file_name = "2PhutHon_Phao_bestcut_P3_15s_relation";
  let file_extension = ".midi";

  format!("{}{}{}", base_path, file_name, file_extension)
}

fn read_midi_file(file_path_str: String) -> MidiFile {
  let file_path = &Path::new(&file_path_str);
  let mut f = File::open(file_path).unwrap();
  MidiFile::read(f).unwrap()
}
