export interface Track {
  id: number,
  /// Tempo Meta-Event
  /// (tt tt tt) 3 bytes that specify the amt of ms per quarter note
  /// eg: 0x07A120 = 500_000 ms
  ///quarter note duration in milisecons
  ///amount of time(ie, microseconds) per quarter note
  tempo: number,
  /// num of clock pulses per quarter note
  /// ticks per beat
  division: number,
  seconds_per_tick: number,
  name: string,
  num_of_notes: number,
  raw_notes: Note[],
  // timespan bwt notes
  timespans: number[],
  notes_on: Note[],
  notes_on_velocity_zero: Note[],
  notes_off: Note[],
  notes_names: string[],
  notes_velocities: string[],
  raw_str_vec: string[],
  //Duration is measured as the time between reception of a NoteOn and it’s corresponding NoteOff.
  // There is no way to know the duration of a note until you have seen the noteoff event.  By definition!
  notes_durations: number[],
}

export interface Note {
  id: number,
  delta_time: number,
  kind: string,
  channel: string,
  note_number: number,
  name: string,
  seconds_per_tick: number,
  velocity: number,
  /// delta-time: The time difference in ticks between 
  /// the previous MIDI track event and the current one
  /// delta-time in seconds
  delta_time_in_seconds: number,
}


//-------------------------
// @for read in front end
//-------------------------
export interface Track2 {
  id: number,
  /// Tempo Meta-Event
  /// (tt tt tt) 3 bytes that specify the amt of ms per quarter note
  /// eg: 0x07A120 = 500_000 ms
  ///quarter note duration in milisecons
  ///amount of time(ie, microseconds) per quarter note
  tempo: number,
  /// num of clock pulses per quarter note
  /// ticks per beat
  division: number,
  seconds_per_tick: number,
  name: string,
  num_of_notes: number,
  notes_on: Note2[],
  notes_off: Note[],
  notes_names: string[],
  notes_velocities: string[],
  pans_dt: number[],
  min_duration: number,
  durations: number[],
}

export interface Note2 {
  id: number,
  delta_time: number,
  kind: string,
  channel: string,
  number: number,
  name: string,
  seconds_per_tick: number,
  velocity: number,
  /// delta-time: The time difference in ticks between 
  /// the previous MIDI track event and the current one
  /// delta-time in seconds
  delta_time_in_seconds: number,
}
