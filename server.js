const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');

const app = express();
app.use(cors());

// ejs 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.')); // .은 경로

const config = {
  user: 'SYSTEM',
  password: 'test1234',
  connectString: 'localhost:1521/xe'
};

// Oracle 데이터베이스와 연결을 유지하기 위한 전역 변수
let connection;

// 데이터베이스 연결 설정
async function initializeDatabase() {
  try {
    connection = await oracledb.getConnection(config);
    console.log('Successfully connected to Oracle database');
  } catch (err) {
    console.error('Error connecting to Oracle database', err);
  }
}

initializeDatabase();

// 엔드포인트
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/board/list', async (req, res) => {
  const { category, theme, pageSize, offset } = req.query;
  let query = "";
  let query3 = "";
  if (category == 1) {
    query = `SELECT N.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') AS CDATE FROM TBL_NOTICE N`;
    query3 = `SELECT COUNT(*) FROM TBL_NOTICE`;
  } else if (category == 2) {
    query = `SELECT Q.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') AS CDATE FROM TBL_QNA Q`;
    query3 = `SELECT COUNT(*) FROM TBL_QNA`;
  } else if (category == 3) {
    query = `SELECT S.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') AS CDATE FROM TBL_STORELIST S`;
    query3 = `SELECT COUNT(*) FROM TBL_STORELIST`;
  }
  
  let query2 = "";
  if (theme != 'null' && category == 3) {
    query2 = ` WHERE KIND = '${theme}'`;
  }

  try {
    const result = await connection.execute(query + query2 + ` ORDER BY CDATETIME OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROW ONLY`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    const count = await connection.execute(query3);
    
    // 리턴
    res.json({
        result : "success",
        boardList : rows,
        count : count.rows[0][0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/board/add', async (req, res) => {
  const { kind, title, contents, userId } = req.query;

  try {
    await connection.execute(
      `INSERT INTO TBL_BOARD VALUES ` 
      + `(B_SEQ.NEXTVAL, '${title}', '${contents}', '${userId}', 0, 0, ${kind}, SYSDATE, SYSDATE)`,
      [],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing delete', error);
    res.status(500).send('Error executing delete');
  }
});

app.get('/board/info', async (req, res) => {
  const { boardNo } = req.query;
  let query = "TBL_NOTICE";
  if (boardNo.includes("S")) {
    query = "TBL_STORELIST";
  } else if (boardNo.includes("Q")) {
    query = "TBL_QNA";
  }
  try {
    const result = await connection.execute(
      `SELECT * FROM ` + query + ` WHERE BOARDNO = '${boardNo}'`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    const dates = await connection.execute(`SELECT TO_CHAR(RES_DATE, 'YYYY-MM-DD') AS CDATE FROM TBL_RES_DATE R 
      INNER JOIN TBL_STORELIST S ON R.BOARDNO = S.BOARDNO WHERE S.BOARDNO = '${boardNo}' ORDER BY RES_DATE`);
    const dateResult = dates.rows.map(row => row[0])
    res.json({
        result : "success",
        info : rows[0],
        availableDates: dateResult
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/user/join', async (req, res) => {
  const { id, pwd, name, birth, nickName, addr, phone, email, gender, status } = req.query;
  let query = `INSERT INTO TBL_USER VALUES ('${id}', '${pwd}', '${name}', '${birth}', '${nickName}', 'null', '${addr}', '${phone}', '${email}', '${gender}', '${status}', SYSDATE, SYSDATE)`;
  try {
    await connection.execute(
      query,
      [],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing delete', error);
    res.status(500).send('Error executing delete');
  }
});

app.get('/user/check', async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await connection.execute(
      `SELECT * FROM TBL_USER WHERE USERID = '${userId}'`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/user/login', async (req, res) => {
  const { userId, userPwd } = req.query;
  try {
    const result = await connection.execute(
      `SELECT * FROM TBL_USER WHERE USERID = '${userId}' AND PASSWORD = '${userPwd}'`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/user/info', async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await connection.execute(
      `SELECT * FROM TBL_USER WHERE USERID = '${userId}'`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/api/notice', async (req, res) => {

    try {
        // TBL_NOTICE에서 최신 한 줄 가져오기
        const result = await connection.execute(`SELECT TITLE, CONTENTS FROM TBL_NOTICE 
             WHERE ROWNUM = 1 ORDER BY CDATETIME DESC`);

        // 결과 보내기
        if (result.rows.length > 0) {
            res.json({ 
                title: result.rows[0][0],     // TITLE
                contents: result.rows[0][1]   // CONTENTS
            });
        } else {
            res.json({ title: "공지사항 없음", contents: "" });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send("DB Error");
    } 
});

app.get('/reservation', async (req, res) => {
  const { sessionId, storeId, resDate, resTime, resPerson, boardNo } = req.query;
  try {
    await connection.execute(
      `INSERT INTO TBL_RESERVATION VALUES(RES_SEQ.NEXTVAL, :sessionId, :storeId, :resDate, :resTime, :resPerson, SYSDATE)`,
      [sessionId, storeId, resDate, resTime, resPerson],
      { autoCommit: true }
    );

    await connection.execute(`UPDATE TBL_STORELIST SET P_CNT = P_CNT - ${resPerson} WHERE BOARDNO = '${boardNo}' AND P_CNT >= ${resPerson}`);
    res.json({
        success: true
    });
  } catch (error) {
    console.error('Error executing delete', error);
    res.status(500).send('Error executing delete');
  }
});


// 서버 시작
app.listen(3009, () => {
  console.log('Server is running on port 3009');
});
