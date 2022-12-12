const swagger_autogen = require("swagger-autogen")({ openapi: "3.0.0" });

const options = {
  info: {
    title: "KWLS API Document",
    description: `광운대학교 도서관 알림 API 문서입니다.`,
  },
  servers: [
    {
      url: "http://localhost:9999",
    },
  ],
  schemes: ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      in: "header",
      bearerFormat: "JWT",
    },
  },
};
const output_file = "./swagger-output.json";
const endpoint_file = ["../index.ts"];
console.log(output_file);
console.log(endpoint_file);

swagger_autogen(output_file, endpoint_file, options);
