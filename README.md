# Node_JS_BackEnd
![image](https://user-images.githubusercontent.com/31213158/191555406-805b5802-4911-4804-ae6c-1074ad84c7d7.png)

Swift IOS App 프론트앤드를 위한 Node.js API Server  
내부적으로 Mongo DB에 의존하고 있습니다. (DB서버는 NAS에서 돌아가고 있는 상태)

# Installations
현재 복잡한 node_modules 는 제거된 상태입니다.  
로컬에서 해당 서버를 사용해보고 싶으면 아래와 같이 코드를 입력합니다.

```
cd Node_JS_BackEnd-main #압축 푼 폴더 이름으로 이동

npm i # dependency 

nodemon index.ts #nodemon 으로 TS 컴파일 해서 즉시 실행 (권장)

ts-node index.ts #위 nodemon으로 작동하지 않는다면 이 코드로 실행
```
