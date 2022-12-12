import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import path from "path";
import firebase from "firebase-admin";
import Agenda from "agenda";
import { MongoClient } from "mongodb";
import swagger_ui from "swagger-ui-express";

const asyncify = require("express-asyncify");

const access_path = path.resolve(
  __dirname,
  "./private/wawa-15cab-firebase-adminsdk-pds2l-8a791f92f8.json"
); //json private key 경로

//firebase admin 초기화
const push = firebase.initializeApp({
  credential: firebase.credential.cert(access_path),
});

// mongoDB 연결 설정
const mongo_id = "YOUR_ID";
const mongo_pw = encodeURIComponent("YOUR_PW");
const mongo_ip = "YOUR_IP";
const mongo_port = "YOUR_PORT";
const mongo_dbname = "YOUR_DB_NAME";
const mongo_connection = `mongodb://${mongo_id}:${mongo_pw}@${mongo_ip}:${mongo_port}/${mongo_dbname}?authSource=admin`;

const agenda = new Agenda({ db: { address: mongo_connection } }); //Agenda MongoDB 접속

export { agenda, push }; //다른 라우터에서 사용할 수 있도록 모듈로 반환

async function get_all_jobs() {
  try {
    let client = await MongoClient.connect(mongo_connection);
    let db = client.db("kwls");
    let agendaJobs = db.collection("agendaJobs");
    let all_jobs = agendaJobs.find({}).toArray();
    return all_jobs; //==resolve(data)
  } catch (err: any) {
    throw new Error(err); //== reject(err)
  }
}

// Agenda 스케줄링 시작
(async function () {
  await agenda.start();
})();

//express에서 async, await 사용하기 위해 사용
const app = asyncify(express());
const port = 9999;

// cookie, body parser 사용
app.use(bodyParser.json());
app.use(cookieParser());

import reserver_router from "./routes/reserve";
import { router as inquire_router } from "./routes/inquire";

// 예약 기능 라우터
app.use("/api", reserver_router);

// 조회 기능 라우터
app.use("/api", inquire_router);

const swagger_file = require("./swagger/swagger-main.json");

//Swagger
app.use(
  "/",
  swagger_ui.serve,
  swagger_ui.setup(swagger_file, { explorer: true })
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
