import axios from "axios";
import * as cheerio from "cheerio";
import express, { Request, Response } from "express";
import { IKWLS } from "../interfaces/interface";

const router = express.Router();

async function inquire(room_num: string) {
  // 알아서 예외까지 체크함
  // 물론 처리는 하지 않고 밖에 던짐 (Java의 Throws)

  // 쿼리스트링의 값이 비어있거나 숫자가 아니라면
  if (!room_num || isNaN(Number(room_num))) {
    // 예외 던지기
    throw new Error("유효하지 않은 열람실 번호입니다");
  }

  // room_num의 값이 1과 3사이가 아니라이
  if (Number(room_num) < 1 || Number(room_num) > 3) {
    throw new Error("유효하지 않은 열람실 번호입니다");
  }

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

  const response: IKWLS = {
    room: range,
    use: use,
    not_use: unused,
  };
  return response;
}

// K-NET API가 폭발하여 직접 만든 API
router.get("/inquire", async (req: Request, res: Response) => {
  try {
    // 쿼리스트링의 값을 얻어온다
    const room_num = req.query.room_num as string;
    const response = await inquire(room_num);
    res.send(response);
  } catch (e: any) {
    console.log(e);
    // 에러가 발생하면 HTTP 에러 메시지를 보낸다
    res.status(400).send({ err: e.message });
  }
});

// 모든 열람실에서 사용중인 좌석 조회
router.get("/inquire/used", async (req: Request, res: Response) => {
  console.log("열람실 사용중인 좌석 조회 요청 감지");
  const val = await Promise.all([inquire("1"), inquire("2"), inquire("3")]);
  // console.log(val);

  const open1: IKWLS = val[0];
  const open2: IKWLS = val[1];
  const open3: IKWLS = val[2];

  const data = {
    open1_used: open1.use,
    open2_used: open2.use,
    open3_used: open3.use,
  };

  // console.log(data);
  console.log("데이터를 전송합니다...");
  res.send(data);
});

// 모든 열람실에서 미사용중인 좌석 조회
router.get("/inquire/unused", async (req: Request, res: Response) => {
  console.log("열람실 미사용중인 좌석 조회 요청 감지");

  const val = await Promise.all([inquire("1"), inquire("2"), inquire("3")]);

  const open1: IKWLS = val[0];
  const open2: IKWLS = val[1];
  const open3: IKWLS = val[2];

  const data = {
    open1_unused: open1.not_use,
    open2_unused: open2.not_use,
    open3_unused: open3.not_use,
  };

  // console.log(data);
  console.log("데이터를 전송합니다...");
  res.send(data);
});

// export default router;
export { router, inquire };
