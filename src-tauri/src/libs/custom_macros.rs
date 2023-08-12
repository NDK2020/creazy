// fn approx(a: Self, b: S, eps: Self) -> bool { Self::abs(a - b) < eps }

#[macro_export]
macro_rules! is_approx {
  ($a: expr, $b: expr, $eps: expr) => ({
    let (a, b): (f64, f64)  = ($a, $b);
    let diff = (a - b).abs();
    (diff < $eps)
  });
  ($a: expr, $b: expr, $eps: expr) => ({
    // use std::num::Float;
    let (a, b): (f32, f32)  = ($a, $b);
    let diff = (a - b).abs();
    (diff < $eps)
  });
}
pub(crate)  use is_approx;

// cargo test -- --nocapture
#[ignore]
#[test]
fn test_approx() {
  // let res = is_approx!(1.0, 2.0, 1e-4);
  let arr = [1e-3, 2e-3, 4.0];

  println!("test approx ne");
  arr.iter()
    .filter(|&&x| !is_approx!(x, 0.0 , 1e-2))
    .for_each(|x| println!("{:?}", x));
    
}

#[test]
fn test_utils() {
  let flag = 0 as f32 == 0.0;
  println!("0 eq 0.0: {}", flag);
}


#[macro_export]
macro_rules! add {
  ($a: expr, $b: expr) => {
    $a + $b
  };
}

pub(crate)  use add;


