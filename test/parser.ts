import axios from "axios";
import * as cheerio from "cheerio";

(async function () {
  const room_num = 1;
  const result = await axios.get(
    `http://mobileid.kw.ac.kr/seatweb/roomview5.asp?room_no=${room_num}`
  );

  const $ = cheerio.load(result.data); // cheerio.load( ) 메서드의 인자로 request( url )의 실행 결과 데이터인 body를 넘겨준다.
  //그러면 이제 jQuery 셀렉터를 사용하여 HTML 요소에 접근할 수 있다. (JS는 참고로 변수 이름에 $를 사용하는 것이 허용된다.)

  // 현재 HTML 페이지에서 id가 Layer로 시작하는 모든 태그 가져오자
  const layer = $("div[id^=Layer]");
  const range = { start: 1, end: layer.length }; //현재 열람실에 있는 좌석의 개수

  // 기존과 똑같은 인터페이스 제공
  const use = [];
  const unused = [];

  for (let i = 0; i < layer.length; i++) {
    // console.log(layer[i]);
    // layer[i] 에서 td의 bgcolor 가져오기
    const isUsed: boolean =
      $(layer[i]).find("td").attr("bgcolor") === "red" ? true : false;
    // console.log(i + 1, isUsed);
    if (isUsed) use.push(i + 1);
    else unused.push(i + 1);
  }

  const response = {
    room: range,
    use: use,
    not_use: unused,
  };

  console.log(response);
})();

// FETCH GET EXAMPLE
fetch("http://localhost:9999/api/inquire?room_num=1", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.log(err));

// FETCH POST EXAMPLE
fetch("http://localhost:9999/api/reserve", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    token: "abc",
    room_num: 1,
    sheet_num: 1,
  }),
})
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
