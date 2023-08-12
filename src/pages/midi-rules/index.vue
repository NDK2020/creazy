<template>
  <div class="midi-rules">
    <h1 class="heading-1">game midi rule</h1>

    <h2 class="heading-2">Duet Cats</h2>

    <div class="flex-x-center">
      <p>
        Trong midi sẽ có tổng cộng 6 hàng note, tương ứng với 6 cột kem khi lên
        game, theo thứ tự các note từ trái sang phải sẽ là: F, E, Eb, D, Db, C.
        Các note sẽ có giá trị velocity theo rule:
        <br />
        127: kem lớn
        <br />
        '&lt;' 127: kem nhỏ
        <br />
        Các note kem đơn sẽ được gen dựa trên note midi có độ dài ngắn nhất,
        toàn bộ các note midi có độ dài lớn hơn note ngắn nhất sẽ được tính là
        kem dài.
      </p>
    </div>

    <h2 class="heading-2">Dancing Road</h2>
    <p>
      Khi đọc Musicalization Content sẽ đc 3 List-NoteData là main, motif_main,
      relation
      <br />
      Track main: 
      <br />
      - đọc toàn bộ lấy note có duration thấp nhất làm chuẩn quét
      hết các note có cùng duration thấp nhất đó => danh sách note đơn (còn lại
      là note dài) 
      <br />
      - node đơn có nodeId = 96 97 98 là note đơn cùng màu với bóng
      của người chơi và có vị trí 1 2 3 từ trái qua phải 
      <br />
      - node đơn có nodeId =
      85 85 86 là note đơn khác màu với bóng của người chơi và có vị trí 1 2 3
      từ trái qua phải 
      <br />
      - node đơn có nodeId = 102 là hộp quà bí mật 
      <br />
      - các note
      dài cũng tương tự logic trên nhưng node dài sẽ có hiệu ứng ăn note dài 
      <br />
      - note ngắn có nodeId = 100 là note cùng màu nhưng di chuyển qua lại 2 bên
      đường 
      <br />
      - note ngắn có nodeId = 88 là note khác màu nhưng di chuyển qua lại
      2 bên đường
      <br />
      Track relation: 
      <br />
      - mỗi một relation là 1 đoạn đường nếu đoạn tiếp theo cùng
      mood với đoạn trước thì có gờ đổi màu ở đó còn nếu khác mood với trước đó
      thì là nhảy qua đoạn đường khác.
    </p>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss">
.midi-rules {
  .heading-1,
  .heading-2 {
    text-align: center;
  }

  .heading-1 {
    margin-top: 20px;
  }

  .heading-2 {
    margin-top: 40px;
    margin-bottom: 20px;
  }

  p {
    max-width: 600px;
    font-family: $font-family;
    font-weight: 600;
    color: var(--color-white);
  }
}
</style>
