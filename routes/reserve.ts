import { agenda, push } from "..";
import { IReserve, IReserves, IKWLS } from "../interfaces/interface";
import express, { Request, Response } from "express";
import { Job } from "agenda";
import axios from "axios";
import { inquire } from "./inquire";

const router = express.Router();

// 데이터 유효성 검사
function validate_data(token: string, room_num: number, sheet_num: number) {
  if (!room_num || !sheet_num || !token) {
    throw new Error("잘못된 요청입니다.");
  }
  if (room_num < 1 || room_num > 4) {
    throw new Error("자유 열람실은 1~3 열람실까지만 존재합니다.");
  }

  if (room_num == 1 && (sheet_num < 1 || sheet_num > 122)) {
    throw new Error("1열람실은 1~122번 좌석까지 존재합니다. (총 122자리)");
  }

  if (room_num == 2 && (sheet_num < 1 || sheet_num > 211)) {
    throw new Error("2열람실은 1~211번 좌석까지 존재합니다. (총 211자리)");
  }

  if (room_num == 3 && (sheet_num < 1 || sheet_num > 165)) {
    throw new Error("3열람실은 1~165번 좌석까지 존재합니다. (총 165자리)");
  }
}

// agenda 스케줄링 콜백 함수 (실제 예약 스케줄링 도는 함수)
async function schedule_fn(job: Job) {
  const reserves: IReserves = job.attrs.data as IReserves; //타입 표명 (형 변환)
  const token = reserves.token;
  const data = reserves.data;

  console.log("스케줄링 시작");
  console.log(job.attrs.data);

  try {
    for (let i = 0; i < data.length; i++) {
      // i 번째 예약 작업 스케줄링 수행 출력
      console.log(`${i + 1}번째 예약 스케줄링 수행 중...`);

      const room_num = data[i].room_num;
      const sheet_num: any = data[i].sheet_num;

      const result: IKWLS = await inquire(room_num.toString());
      const use = result.use; //사용중인 좌석
      const not_use = result.not_use; //사용중이지 않은 좌석

      console.log("use");
      console.log(use);

      console.log("not_use");
      console.log(not_use);

      // not-use 요소에 sheet_num이 존재하는지 확인
      const isCanReserve = not_use.includes(sheet_num);
      if (isCanReserve) {
        await push.messaging().send({
          notification: {
            title: "KW 마이시트",
            body: `제 ${room_num}열람실 ${sheet_num}번 자리가 비었습니다. 서둘러 예약하세요 !`,
          },
          token,
        });

        console.log("자리가 남음 예약 가능!!");
        // await agenda.disable({ name: token }); //작업 비활성화 (계속 알람가는것 방지)
        await agenda.cancel({ name: token }); //작업 끝나면 db에서 삭제함
        console.log("예약 작업 끝");
      } else {
        console.log("현재 자리가 없음 기다리는중임..");
      }
    }
  } catch (err: any) {
    // 오류 발생시 db에서 삭제함
    console.log(`오류가 발생했습니다. DB에서 삭제합니다. token : ${token}`);
    console.log(err);
    await agenda.cancel({ name: token });

    await push.messaging().send({
      notification: {
        title: "광운대학교 시스템",
        body: `오류가 발생하여 예약작업이 정상적으로 이루어지지 않았습니다.`,
      },
      token,
    });

    console.log(err);
    throw new Error(err);
  }
}

// 예약 작업에 사용하는 함수 (단일, 다중 예약 모두 사용 가능.)
async function reserve_job(req: Request, res: Response, reserves: IReserves) {
  // 다중 예약 작업인 경우
  const data_cnt = reserves.data.length;
  if (data_cnt > 1) {
    console.log("다중 예약 요청이 들어왔습니다...");
  } else {
    // 단일 예약 작업 인 경우
    console.log("단일 예약 요청이 들어왔습니다...");
  }

  console.log(reserves);

  // 들어온 데이터 갯수만큼 반복
  // [{room_num, sheet_num}, {room_num, sheet_num}, ...]

  // console.log("작업을 예약중 입니다...");

  try {
    const token = reserves.token;

    // 들어온 값 유효성 확인 (열람실 최대 좌석 정보는 아래 링크에서 확인)
    // http://mobileid.kw.ac.kr/seatweb/domian5.asp
    for (let i = 0; i < data_cnt; i++) {
      const room_num = reserves.data[i].room_num;
      const sheet_num = reserves.data[i].sheet_num;
      validate_data(token, room_num, sheet_num);
    }

    const schedule_name = token;

    // 예약 작업 정의
    agenda.define(schedule_name, schedule_fn);

    console.log("작업을 예약중 입니다...");

    // 기존에 예약된 작업 위에 자꾸 작업 등록시 데이터가 중복되어서 문제가 발생하는걸 확인함. (아래는 해결 코드)
    // jobs에 token으로 시작하는 작업이 있는지 확인
    const jobs = await agenda.jobs({ name: token });
    if (jobs.length > 0) {
      // jobs가 존재하면 예약 작업을 삭제함
      await agenda.cancel({ name: token });
    }

    // 스케줄링 예약 수행 (도서관 데이터 감시의 경우 10초에 한번씩 진행하도록 수정)
    // 1분이 반응단위는 너무 느렸음.
    await agenda.every("10 seconds", schedule_name, reserves);

    res.send({ isSuccess: true }); //응답으로 Json 형태로 보내기
  } catch (e) {
    // 오류 발생시 예매 실패
    console.log(e);
    res.status(400).send({ isSuccess: false, err: e }); //오류 반환
  }
}

// 자리 예약 함수 (단일)
router.post("/reserve", async (req: Request, res: Response) => {
  const body: IReserve = req.body;

  // body가 비었거나, token이 없거나 room_num이 없거나 sheet_num이 없으면
  if (!body || !body.token || !body.room_num || !body.sheet_num) {
    return res
      .status(400)
      .send({ isSuccess: false, err: "잘못된 요청입니다." });
  }
  // IReserve type을 IReserves 타입으로 변환
  const reserves_data: IReserves = {
    token: body.token,
    data: [{ room_num: body.room_num, sheet_num: body.sheet_num }],
  };
  reserve_job(req, res, reserves_data);
});

// 자리 예약 함수 (멀티)
router.post("/reserves", async (req: Request, res: Response) => {
  const body: IReserves = req.body;

  // body가 비었거나 token이 없거나 data가 없거나 data안의 내용이 비었으면
  if (!body || !body.token || !body.data || body.data.length == 0) {
    return res
      .status(400)
      .send({ isSuccess: false, err: "잘못된 요청입니다." });
  }

  // body.data 안에 데이터가 존재하면 for문을 돌리면서 room_num, sheet_num이 있는지 검사한다
  for (let i = 0; i < body.data.length; i++) {
    if (!body.data[i].room_num || !body.data[i].sheet_num) {
      return res
        .status(400)
        .send({ isSuccess: false, err: "잘못된 요청입니다." });
    }
  }

  reserve_job(req, res, body);
});

// 예약 정보 가져오기
router.get("/reserve", async (req: Request, res: Response) => {
  try {
    // query string 파싱하기
    const token = req.query.token as string;
    console.log(`예약 정보 가져오기 요청 : ${token}`);
    const jobs = await agenda.jobs({ name: token });

    if (jobs[0]?.attrs) {
      const result: object = jobs[0].attrs;
      console.log(result);
      return res.send(result); //db 정보를 전송
    } else {
      console.log("해당 토큰에 대한 예약 정보를 찾지 못했습니다.");
      return res
        .status(404) //못찾으면 못찾았다고 반환
        .send({ err: "해당 토큰에 대한 예약 정보를 찾지 못했습니다." });
    }
  } catch (err: any) {
    console.log(err);
    res.status(400).send({ err: err });
  }
});

export default router;
