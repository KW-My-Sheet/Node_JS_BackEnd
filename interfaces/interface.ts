// 토큰을 제외한 순수 데이터
interface IDataSet {
  room_num: number; //자리 몇번 예약했는지 ex) 4
  sheet_num: number; //몇번째 열람실인지 ex) 1
}

// reserve에서 body로 들어오는 값
interface IReserve extends IDataSet {
  token: string; //유저별 고유 토큰 ex) [a-z0-9]:[a-z0-9]
}

interface IReserves {
  token: string;
  data: IDataSet[];
}

// interface IReserve {
//   token: string; //유저별 고유 토큰 ex) [a-z0-9]:[a-z0-9]
//   room_num: number;
//   sheet_num: number;
// }

//   광운대학교 도서관 API 값
interface IKWLS {
  use: Array<number>;
  not_use: Array<number>;
  room: {
    start: number;
    end: number;
  };
}

export { IReserve, IReserves, IKWLS };
