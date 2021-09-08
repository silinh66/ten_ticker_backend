var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mysql = require("mysql");
var cors = require("cors");
// var authYoutube = require("./test");

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
// const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require("util");

var cron = require("node-cron");
const { default: axios } = require("axios");
const { map, includes, get, isEmpty } = require("lodash");
const moment = require("moment");
const KEY = "AIzaSyCVcmoOusyx6ZsSrAHag5DJ-ohVQ3YyDVQ";
const fixUserColumn = {
  id: 0,
  name: 1,
  status: 2,
  type: 3,
  userName: 4,
  password: 5,
  admin: 6,
  cm: 7,
  cw: 8,
  am: 9,
  ac: 10,
  vm: 11,
  ve: 12,
  other: 13,
  tenTickers: 14,
  tenMovie: 15,
  tenAsia: 16,
  tenTun: 17,
  tenAnime: 18,
  tlsq: 19,
  tenKpop: 20,
  entertainment: 21,
  kaTun: 22,
  beginDate: 23,
  cms: 24,
  nickname: 25,
  dob: 26,
  email: 27,
  phone: 28,
  bank: 29,
  bankNumber: 30,
  bankNote: 31,
  note: 32,
  luongCung: 33,
  donGiaScrip2k: 34,
  donGiaScrip1k: 35,
  donGiaAudio: 36,
  donGiaVideo2k: 37,
  donGiaVideo1k: 38,
};

const scope = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
  "https://www.googleapis.com/auth/youtubepartner",
];

var monthNow = +moment().subtract(1, "months").format("MM");
var monthNowString = moment().subtract(1, "months").format("YYYYMM");
var yearNow = +moment().format("YYYY");

console.log("monthNow", monthNow);
console.log("monthNowString", monthNowString);
console.log("yearNow", yearNow);

var oAuth2Client, authUrl, callApi;

fs.readFile("oauth-client-creds.json", (err, content) => {
  if (err) {
    return console.log("Cannot load client secret file:", err);
  }
  // Authorize a client with credentials, then make API call.
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scope,
    prompt: "consent",
  });
});

function YouTubeGetID(url) {
  var ID = "";
  url = url
    .replace(/(>|<)/gi, "")
    .split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
  if (url[2] !== undefined) {
    ID = url[2].split(/[^0-9a-z_\-]/i);
    ID = ID[0];
  } else {
    ID = url;
  }
  return ID;
}

const getChannelId = async (auth) => {
  var getChannelIdResponse = [];
  const youtubeChannelId = google.youtube({ version: "v3", auth });
  await youtubeChannelId.channels
    .list({
      part: "snippet,contentDetails,statistics",
      mine: "true",
    })
    .then((response) => {
      console.log("response in getChannelId", response.data.items[0]);
      getChannelIdResponse = response.data.items[0].id;
    })
    .catch((error) => console.log("The API returned an error: ", error));
  return getChannelIdResponse;
};

callApi = async (auth, videoIds) => {
  // console.log("videoIds", videoIds);
  var yapiResponse = [];
  if (videoIds.length > 0) {
    const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });
    for (let i = 0; i < videoIds.length; i++) {
      await youtubeAnalytics.reports
        .query({
          startDate: "2021-06-01",
          endDate: "2021-06-30",
          ids: "channel==MINE",
          filters: `video==${videoIds[i]}`,
          // dimensions: 'ageGroup,gender',
          metrics:
            "estimatedRevenue,views,comments,likes,dislikes,estimatedMinutesWatched,averageViewDuration,annotationClickThroughRate,subscribersGained,subscribersLost,redViews,shares,averageViewPercentage",
        })
        .then(async (response) => {
          yapiResponse = [...yapiResponse, response.data.rows];
        })
        .catch((error) => console.log("The API returned an error: ", error));
    }
  } else {
    const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });
    await youtubeAnalytics.reports
      .query({
        startDate: "2021-06-01",
        endDate: "2021-06-30",
        ids: "channel==MINE",
        // filters: "video==tZ1TgcwRb_0",
        // dimensions: 'ageGroup,gender',
        metrics:
          "estimatedRevenue,views,comments,likes,dislikes,estimatedMinutesWatched,averageViewDuration,annotationClickThroughRate,subscribersGained,subscribersLost,redViews,shares,averageViewPercentage",
      })
      .then(async (response) => {
        // console.log("estimatedRevenue", response.data.rows[0][0]);
        // console.log("views", response.data.rows[0][1]);
        // console.log("comments", response.data.rows[0][2]);
        // console.log("likes", response.data.rows[0][3]);
        // console.log("dislikes", response.data.rows[0][4]);
        // console.log("estimatedMinutesWatched", response.data.rows[0][5]);
        // console.log("averageViewDuration", response.data.rows[0][6]);
        yapiResponse = response.data.rows;
      })
      .catch((error) => console.log("The API returned an error: ", error));
  }
  // console.log("yapiResponse", yapiResponse);
  return yapiResponse;
};

var isProduct = false;

//dev

var whitelist = [
  "https://ten-ticker-cms-dev.herokuapp.com",
  "http://ten-ticker-cms-dev.herokuapp.com",
  "http://cms.tentickers.net",
  "https://cms.tentickers.net",
];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(isProduct ? corsOptions : { origin: "http://localhost:3001" }));

//local
// app.use(cors({ origin: "http://localhost:3001" }));

//product
// app.use(cors({ origin: "https://ten-ticker-cms.herokuapp.com" }));

app.use(bodyParser.json({ type: "application/json" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.all("*", function (req, res, next) {
  /**
   * Response settings
   * @type {Object}
   */
  var responseSettings = {
    AccessControlAllowOrigin: req.headers.origin,
    AccessControlAllowHeaders:
      "Content-Type,X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name",
    AccessControlAllowMethods: "POST, GET, PUT, DELETE, OPTIONS",
    AccessControlAllowCredentials: true,
  };

  /**
   * Headers
   */
  res.header(
    "Access-Control-Allow-Credentials",
    responseSettings.AccessControlAllowCredentials
  );
  res.header(
    "Access-Control-Allow-Origin",
    responseSettings.AccessControlAllowOrigin
  );
  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"]
      ? req.headers["access-control-request-headers"]
      : "x-requested-with"
  );
  res.header(
    "Access-Control-Allow-Methods",
    req.headers["access-control-request-method"]
      ? req.headers["access-control-request-method"]
      : responseSettings.AccessControlAllowMethods
  );

  if ("OPTIONS" == req.method) {
    res.send(200);
  } else {
    next();
  }
});

app.get("/", function (req, res) {
  return res.send({ error: false, message: "hello Linh Ken" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log("Node app is running on port 3000");
});

//product cPanel db_config
var db_config = isProduct
  ? {
      host: "localhost",
      // user: "zcegdeab_ten_ticker",
      user: "zcegdeab_linhken_ten_ticker",
      password: "silinh66*",
      // password: "D8XW!d[Lkm$p",

      database: "zcegdeab_ten_ticker",
    }
  : {
      // host: "us-cdbr-east-03.cleardb.com",
      // user: "bc74e7c7dc5b9e",
      // password: "f04abeb4",
      // database: "heroku_47bd66779dcda20",

      //local
      host: "localhost",
      user: "root",
      password: "123456",
      database: "ten_ticker",
    };

//dev heroku db_config
// var db_config = {
//   host: "us-cdbr-east-03.cleardb.com",
//   user: "bc74e7c7dc5b9e",
//   password: "f04abeb4",
//   database: "heroku_47bd66779dcda20",
// };

var dbTenTicker;

//dev heroku
// var dbTenTicker = mysql.createConnection({
//   host: "us-cdbr-east-03.cleardb.com",
//   user: "bc74e7c7dc5b9e",
//   password: "f04abeb4",
//   database: "heroku_47bd66779dcda20",
// });

//product heroku
// var dbTenTicker = mysql.createConnection({
//   host: "us-cdbr-east-03.cleardb.com",
//   user: "b2b329e77fd088",
//   password: "57100c49",
//   database: "heroku_6d453306171d11b",
// });

//local
// var dbTenTicker = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "123456",
//   database: "ten_ticker",
// });
function handleDisconnect() {
  dbTenTicker = mysql.createConnection(db_config);
  console.log("restart");
  dbTenTicker.connect(function (err) {
    console.log("Connection OK");
    if (err) {
      console.log("error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000);
    }
  });

  dbTenTicker.on("error", function (err) {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else {
      // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}

handleDisconnect();

/*------------------DATA---------------------*/
// Retrieve all data
app.get("/tenticker", function (req, res) {
  dbTenTicker.query("SELECT * FROM data", function (error, results, fields) {
    if (error) throw error;
    return res.send({ error: false, data: results, message: "data list." });
  });
});

// Retrieve data with id
app.get("/tenticker/:id", function (req, res) {
  let data_id = req.params.id;
  if (!data_id) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data_id" });
  }
  dbTenTicker.query(
    "SELECT * FROM data where id=?",
    data_id,
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results[0],
        message: "data list.",
      });
    }
  );
});

// Add a new data
app.post("/tenticker/add", function (req, res) {
  let data = req.body.data;
  // console.log("data", data);
  if (!data) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data" });
  }
  dbTenTicker.query(
    "INSERT INTO data VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [...data],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "New data has been created successfully.",
      });
    }
  );
});

//  Update data with id
app.put("/tenticker", function (req, res) {
  let data_id = req.body.data_id;
  let data = req.body.data;
  // console.log("data_id", data_id);
  // console.log("data", data[22]);
  if (!data_id || !data) {
    return res
      .status(400)
      .send({ error: data, message: "Please provide data and data_id" });
  }
  dbTenTicker.query(
    "UPDATE data SET id = ?, content_code = ?, writer_code = ?, full_title =?, content_raw = ?, writer_name=?,  content_status=?,  content_final = ?, content_note = ?, content_date = ?, composer_code = ?, composer_name = ?, audio_date = ?, link_audio = ?, audio_status = ? ,audio_note = ?, writer_nick =?, composer_nick = ?, editor_name=?,  video_date=?,  footage = ?, editor_code = ?, link_video = ?, video_status = ?, video_note = ?, link_youtube = ?, public_date = ?, is_first_public = ?, is_first_content_final =?, is_first_audio = ?, is_first_video = ?, add_composer_date = ?, add_ve_date = ?, confirm_content_date = ?, confirm_audio_date = ?, salary_index = ?, is_new = ?  WHERE id = ?",
    [...data, data_id],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "data has been updated successfully.",
      });
    }
  );
});

//  Delete data
app.delete("/tenticker", function (req, res) {
  // console.log("req.body", req.body);
  let data_id = req.body.data_id;
  // console.log("data_id", data_id);
  if (!data_id) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data_id" });
  }
  dbTenTicker.query(
    "DELETE FROM data WHERE id in (?)",
    [data_id],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "Data has been delete successfully.",
      });
    }
  );
});

//Delete all data
app.delete("/tenticker/all", function (req, res) {
  dbTenTicker.query("TRUNCATE TABLE data", function (error, results, field) {
    if (error) throw error;
    return res.send({
      error: false,
      data: results,
      message: "Delete all data successfully",
    });
  });
});

/*------------------ACTIVITY---------------------*/

// Retrieve all activity
app.get("/activity", function (req, res) {
  dbTenTicker.query(
    "SELECT * FROM activity",
    function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: "data list." });
    }
  );
});

// Retrieve acitivity with id
app.get("/activity/:id", function (req, res) {
  let activity_id = req.params.id;
  if (!activity_id) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide activity_id" });
  }
  dbTenTicker.query(
    "SELECT * FROM activity where id=?",
    activity_id,
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results[0],
        message: "data list.",
      });
    }
  );
});

// Add a new activity
app.post("/activity/add", function (req, res) {
  let activity = req.body.data;
  console.log("activity", activity);
  if (!activity) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide activity" });
  }
  dbTenTicker.query(
    "INSERT INTO activity VALUES (?, ?, ?, ?)",
    [...activity],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "New activity has been created successfully.",
      });
    }
  );
});

//  Update activity with id
app.put("/activity", function (req, res) {
  let activity_id = req.body.activity_id;
  let activity = req.body.data;
  console.log("activity_id", activity_id);
  console.log("activity", activity);
  if (!activity_id || !activity) {
    return res.status(400).send({
      error: data,
      message: "Please provide activity and activity_id",
    });
  }
  dbTenTicker.query(
    "UPDATE activity SET id = ?, activity_date = ?,  activity = ?, user_name WHERE id = ?",
    [...activity, activity_id],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "activity has been updated successfully.",
      });
    }
  );
});

//  Delete activity
app.delete("/activity", function (req, res) {
  console.log("req.body", req.body);
  let activity_time = req.body.activity_time;
  console.log("activity_time", activity_time);
  if (!activity_time) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide activity_time" });
  }
  dbTenTicker.query(
    "DELETE FROM activity WHERE activity_date > ? AND activity_date < ?",
    // "DELETE FROM activity WHERE id in (?)",
    [...activity_time],
    function (error, results, fields) {
      console.log("delete success");
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "Data has been delete successfully.",
      });
    }
  );
});

app.delete("/activity/check", function (req, res) {
  let activity_id = req.body.activity_id;
  if (!activity_id) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide activity_id" });
  }
  dbTenTicker.query(
    "DELETE FROM activity WHERE id in (?)",
    [activity_id],
    function (error, results, fields) {
      console.log("delete success");
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "Data has been delete successfully.",
      });
    }
  );
});

/*------------------SALARY---------------------*/
// Retrieve all salary
app.post("/salary", function (req, res) {
  let month = req.body.month;
  let year = req.body.year;
  console.log("month", month);
  console.log("year", year);
  dbTenTicker.query(
    "SELECT * FROM salary WHERE thang = ? && nam = ?",
    [month, year],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: "salary list." });
    }
  );
});

// // Retrieve salary with id
// app.get("/salary/:id", function (req, res) {
//   let salary = req.params.id;
//   if (!salary_id) {
//     return res
//       .status(400)
//       .send({ error: true, message: "Please provide salary_id" });
//   }
//   dbTenTicker.query(
//     "SELECT * FROM salary where id=?",
//     salary_id,
//     function (error, results, fields) {
//       if (error) throw error;
//       return res.send({
//         error: false,
//         data: results[0],
//         message: "salary list.",
//       });
//     }
//   );
// });

// Add a new salary
app.post("/salary/add", function (req, res) {
  let salary = req.body.salary;
  console.log("salary", salary);
  if (!salary) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide salary" });
  }
  dbTenTicker.query(
    "INSERT INTO salary VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [...salary],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "New salary has been created successfully.",
      });
    }
  );
});

//  Update salary with id
// app.put("/salary", function (req, res) {
//   let salary_id = req.body.salary_id;
//   let salary = req.body.data;
//   console.log("salary_id", salary_id);
//   console.log("salary", salary);
//   if (!salary_id || !salary) {
//     return res.status(400).send({
//       error: data,
//       message: "Please provide salary and salary_id",
//     });
//   }
//   dbTenTicker.query(
//     "UPDATE salary_temp SET id = ?, thuong = ?, phat = ?, note_khac = ?  WHERE id = ?",
//     [...salary, salary_id],
//     function (error, results, fields) {
//       if (error) throw error;
//       return res.send({
//         error: false,
//         data: results,
//         message: "salary has been updated successfully.",
//       });
//     }
//   );
// });

//Delete all salary in month
app.delete("/salary/check", function (req, res) {
  console.log("req.body", req.body);
  let thang = req.body.thang;
  let nam = req.body.nam;
  console.log("thang", thang);
  console.log("nam", nam);
  if (!thang) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide thang" });
  }
  dbTenTicker.query(
    "DELETE FROM salary WHERE thang = ? && nam = ?",
    [thang, nam],
    function (error, results, fields) {
      console.log("delete salary success");
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "salary has been delete successfully.",
      });
    }
  );
});

/*------------------SALARY_TEMP---------------------*/

// Retrieve all salary_temp
app.post("/salary_temp", function (req, res) {
  let month = req.body.month;
  let year = req.body.year;
  console.log("month", month);
  console.log("year", year);
  dbTenTicker.query(
    "SELECT * FROM salary_temp WHERE thang = ? && nam = ?",
    [month, year],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: "salary list." });
    }
  );
});

// Add a new salary
app.post("/salary_temp/add", function (req, res) {
  let salary = req.body.salary;
  console.log("salary", salary);
  if (!salary) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide salary" });
  }
  dbTenTicker.query(
    "INSERT INTO salary_temp VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [...salary],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "New salary has been created successfully.",
      });
    }
  );
});

//Delete all salary_temp in month
app.delete("/salary_temp/check", function (req, res) {
  console.log("req.body", req.body);
  let thang = req.body.thang;
  let nam = req.body.nam;
  console.log("thang", thang);
  console.log("nam", nam);
  if (!thang) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide thang" });
  }
  dbTenTicker.query(
    "DELETE FROM salary_temp WHERE thang = ? && nam = ?",
    [thang, nam],
    function (error, results, fields) {
      console.log("delete salary success");
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "salary has been delete successfully.",
      });
    }
  );
});

/*------------------REPORT---------------------*/
// Retrieve all data report cw
app.get("/reportCW", function (req, res) {
  // console.log("req", req.query.monthYear);
  let month_year = req.query.monthYear;
  if (!month_year) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide monthYear" });
  }
  dbTenTicker.query(
    "SELECT * FROM report_cw where month_year = ? ORDER BY id ASC",
    month_year,
    function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: "data list." });
    }
  );
});

// Retrieve all data report ac
app.get("/reportAC", function (req, res) {
  // console.log("req", req.query.monthYear);
  let month_year = req.query.monthYear;
  if (!month_year) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide monthYear" });
  }
  dbTenTicker.query(
    "SELECT * FROM report_ac where month_year = ? ORDER BY id ASC",
    month_year,
    function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: "data list." });
    }
  );
});

// Retrieve all data report ve
app.get("/reportVE", function (req, res) {
  // console.log("req", req.query.monthYear);
  let month_year = req.query.monthYear;
  if (!month_year) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide monthYear" });
  }
  dbTenTicker.query(
    "SELECT * FROM report_ve where month_year = ? ORDER BY id ASC",
    month_year,
    function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: "data list." });
    }
  );
});

/*------------------YOUTUBE API---------------------*/

//Get link authen
app.get("/authen", function (req, res) {
  return res.send({ error: false, data: authUrl, message: "data list." });
});

app.get("/getToken", function (req, res) {
  let code = req.query.code;
  console.log("code", code);

  oAuth2Client.getToken(code, async (err, token) => {
    console.log("token", token);
    // oAuth2Client.setCredentials(token);
    // const result = await callApi(oAuth2Client);
    // console.log("resulttttttt", result);
    return res.send({ error: false, data: token, message: "data list." });
  });
});

app.post("/yapi", async function (req, res) {
  let token = req.body.token;
  let videoIds = req.body.videoIds;
  console.log("token", token);

  oAuth2Client.setCredentials(token);
  const result = await callApi(oAuth2Client, videoIds);
  console.log("resulttttttt", result);

  return res.send({ error: false, data: result, message: "data list." });
});

app.post("/getChannelId", async function (req, res) {
  let token = req.body.token;
  console.log("token getChannelId", token);

  oAuth2Client.setCredentials(token);
  const result = await getChannelId(oAuth2Client);
  console.log("result getChannelId", result);
  return res.send({ error: false, data: result, message: "getChannelId" });
});

/*------------------SCHEDULE REPORT ---------------------*/

//Schedule CW Report

var taskCW = cron.schedule(
  "*/2 * * * *",
  // "*/720 * * * *",
  () => {
    dbTenTicker.query(
      "DELETE FROM report_cw WHERE month_year = ?",
      [monthNowString],
      function (error, results, fields) {
        axios
          .get(
            "https://sheets.googleapis.com/v4/spreadsheets/1NZjfyE4uNQCNBwZfE2joyTuibWab-R5TK5N7R5LPpIA/values:batchGet?ranges=Sheet2&majorDimension=ROWS&key=AIzaSyByXzekuWCb4pI-ZTD7yEAGVYV0224Mc6Q"
          )
          .then((res) => {
            const data = res.data.valueRanges[0].values;
            const filterData = data.filter((item, index) => {
              return item[fixUserColumn.cw] === "1" && index !== 0;
            });
            const mapData = filterData.map((item, index) => {
              return {
                id: item[fixUserColumn.id],
                name: item[fixUserColumn.name],
                status: item[fixUserColumn.status],
                type: item[fixUserColumn.type],
                cms: item[fixUserColumn.cms],
              };
            });
            dbTenTicker.query(
              "SELECT * FROM data",
              function (error, results, fields) {
                if (error) throw error;
                const mapDataSource = map(mapData, async (item, index) => {
                  let countContent2k = 0,
                    countContent1k = 0,
                    viewCount = 0;

                  for (let i = 0; i < results.length; i++) {
                    if (
                      includes(results[i].writer_name, item.cms) &&
                      +moment(results[i].public_date).format("MM") ===
                        monthNow &&
                      +moment(results[i].public_date).format("YYYY") === yearNow
                    ) {
                      // console.log("linkYoutube", results[i].link_youtube);
                      const video_id = YouTubeGetID(results[i].link_youtube);

                      const payload = {
                        baseURL: "https://www.googleapis.com/youtube/v3/videos",
                        params: {
                          part: "statistics",
                          key: KEY,
                          id: video_id,
                        },
                      };

                      const youtube = axios.create(payload);
                      if (results[i].salary_index === 10) {
                        countContent2k++;
                      } else if (results[i].salary_index === 5) {
                        countContent1k++;
                      }
                      const response = await youtube.get("/");
                      viewCount += !!get(
                        response,
                        "data.items[0].statistics.viewCount"
                      )
                        ? +get(response, "data.items[0].statistics.viewCount")
                        : 0;
                    }
                  }
                  return {
                    san_luong_content_2k: countContent2k,
                    san_luong_content_1k: countContent1k,
                    tong_san_luong_content: countContent2k + countContent1k,
                    views_count: !!viewCount ? viewCount : 0,
                    views_per_content:
                      countContent2k + countContent1k === 0
                        ? 0
                        : !!viewCount
                        ? viewCount / (countContent2k + countContent1k)
                        : 0,
                    ...item,
                  };
                });
                for (let i = 0; i < mapDataSource.length; i++) {
                  let id,
                    name,
                    status,
                    type,
                    san_luong_content_2k,
                    san_luong_content_1k,
                    tong_san_luong_content,
                    views_count,
                    views_per_content;
                  mapDataSource[i]
                    .then((result) => {
                      id = result.id;
                      name = result.name;
                      status = result.status;
                      type = result.type;
                      san_luong_content_2k = result.san_luong_content_2k;
                      san_luong_content_1k = result.san_luong_content_1k;
                      tong_san_luong_content = result.tong_san_luong_content;
                      views_count = result.views_count;
                      views_per_content = result.views_per_content;

                      const dataReportCW = [
                        id,
                        name,
                        status,
                        type,
                        san_luong_content_2k,
                        san_luong_content_1k,
                        tong_san_luong_content,
                        views_count,
                        views_per_content,
                        monthNowString,
                      ];
                      if (error) throw error;
                      dbTenTicker.query(
                        "INSERT INTO report_cw VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [...dataReportCW],
                        function (error, results, fields) {
                          if (error) throw error;
                          console.log("insert success report cw", results);
                        }
                      );
                    })
                    .catch((e) => {
                      console.log("error", e);
                    });
                  console.log("id", mapDataSource[i].id);
                }
              }
            );
          });
      }
    );
  },
  {
    scheduled: false,
  }
);

//Schedule VE Report

var taskVE = cron.schedule(
  "*/2 * * * *",
  // "*/720 * * * *",
  () => {
    dbTenTicker.query(
      "DELETE FROM report_ve WHERE month_year = ?",
      [monthNowString],
      function (error, results, fields) {
        axios
          .get(
            "https://sheets.googleapis.com/v4/spreadsheets/1NZjfyE4uNQCNBwZfE2joyTuibWab-R5TK5N7R5LPpIA/values:batchGet?ranges=Sheet2&majorDimension=ROWS&key=AIzaSyByXzekuWCb4pI-ZTD7yEAGVYV0224Mc6Q"
          )
          .then((res) => {
            const data = res.data.valueRanges[0].values;
            const filterData = data.filter((item, index) => {
              return item[fixUserColumn.ve] === "1" && index !== 0;
            });
            const mapData = filterData.map((item, index) => {
              return {
                id: item[fixUserColumn.id],
                name: item[fixUserColumn.name],
                status: item[fixUserColumn.status],
                type: item[fixUserColumn.type],
                cms: item[fixUserColumn.cms],
              };
            });
            dbTenTicker.query(
              "SELECT * FROM data",
              function (error, results, fields) {
                if (error) throw error;
                const mapDataSource = map(mapData, async (item, index) => {
                  let countVideo2k = 0,
                    countVideo1k = 0,
                    viewCount = 0;

                  for (let i = 0; i < results.length; i++) {
                    if (
                      includes(results[i].editor_name, item.cms) &&
                      +moment(results[i].public_date).format("MM") ===
                        monthNow &&
                      +moment(results[i].public_date).format("YYYY") === yearNow
                    ) {
                      // console.log("linkYoutube", results[i].link_youtube);
                      const video_id = YouTubeGetID(results[i].link_youtube);

                      const payload = {
                        baseURL: "https://www.googleapis.com/youtube/v3/videos",
                        params: {
                          part: "statistics",
                          key: KEY,
                          id: video_id,
                        },
                      };

                      const youtube = axios.create(payload);
                      if (results[i].salary_index === 10) {
                        countVideo2k++;
                      } else if (results[i].salary_index === 5) {
                        countVideo1k++;
                      }
                      const response = await youtube.get("/");
                      viewCount += !!get(
                        response,
                        "data.items[0].statistics.viewCount"
                      )
                        ? +get(response, "data.items[0].statistics.viewCount")
                        : 0;
                    }
                  }
                  return {
                    san_luong_video_2k: countVideo2k,
                    san_luong_video_1k: countVideo1k,
                    tong_san_luong_video: countVideo2k + countVideo1k,
                    views_count: !!viewCount ? viewCount : 0,
                    views_per_video:
                      countVideo2k + countVideo1k === 0
                        ? 0
                        : !!viewCount
                        ? viewCount / (countVideo2k + countVideo1k)
                        : 0,
                    ...item,
                  };
                });
                for (let i = 0; i < mapDataSource.length; i++) {
                  let id,
                    name,
                    status,
                    type,
                    san_luong_video_2k,
                    san_luong_video_1k,
                    tong_san_luong_video,
                    views_count,
                    views_per_video;
                  mapDataSource[i]
                    .then((result) => {
                      id = result.id;
                      name = result.name;
                      status = result.status;
                      type = result.type;
                      san_luong_video_2k = result.san_luong_video_2k;
                      san_luong_video_1k = result.san_luong_video_1k;
                      tong_san_luong_video = result.tong_san_luong_video;
                      views_count = result.views_count;
                      views_per_video = result.views_per_video;

                      const dataReportVE = [
                        id,
                        name,
                        status,
                        type,
                        san_luong_video_2k,
                        san_luong_video_1k,
                        tong_san_luong_video,
                        views_count,
                        views_per_video,
                        monthNowString,
                      ];
                      if (error) throw error;
                      dbTenTicker.query(
                        "INSERT INTO report_ve VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [...dataReportVE],
                        function (error, results, fields) {
                          if (error) throw error;
                          console.log("insert success report ve", results);
                        }
                      );
                    })
                    .catch((e) => {
                      console.log("error", e);
                    });
                  console.log("id", mapDataSource[i].id);
                }
              }
            );
          });
      }
    );
  },
  {
    scheduled: false,
  }
);

//Schedule AC Report

var taskAC = cron.schedule(
  "*/2 * * * *",
  // "*/720 * * * *",
  () => {
    dbTenTicker.query(
      "DELETE FROM report_ac WHERE month_year = ?",
      [monthNowString],
      function (error, results, fields) {
        axios
          .get(
            "https://sheets.googleapis.com/v4/spreadsheets/1NZjfyE4uNQCNBwZfE2joyTuibWab-R5TK5N7R5LPpIA/values:batchGet?ranges=Sheet2&majorDimension=ROWS&key=AIzaSyByXzekuWCb4pI-ZTD7yEAGVYV0224Mc6Q"
          )
          .then((res) => {
            const data = res.data.valueRanges[0].values;
            const filterData = data.filter((item, index) => {
              return item[fixUserColumn.ac] === "1" && index !== 0;
            });
            const mapData = filterData.map((item, index) => {
              return {
                id: item[fixUserColumn.id],
                name: item[fixUserColumn.name],
                status: item[fixUserColumn.status],
                type: item[fixUserColumn.type],
                cms: item[fixUserColumn.cms],
              };
            });
            dbTenTicker.query(
              "SELECT * FROM data",
              function (error, results, fields) {
                if (error) throw error;
                const mapDataSource = map(mapData, async (item, index) => {
                  let countAudio = 0,
                    viewCount = 0;

                  for (let i = 0; i < results.length; i++) {
                    if (
                      includes(results[i].composer_name, item.cms) &&
                      +moment(results[i].public_date).format("MM") ===
                        monthNow &&
                      +moment(results[i].public_date).format("YYYY") === yearNow
                    ) {
                      // console.log("linkYoutube", results[i].link_youtube);
                      const video_id = YouTubeGetID(results[i].link_youtube);

                      const payload = {
                        baseURL: "https://www.googleapis.com/youtube/v3/videos",
                        params: {
                          part: "statistics",
                          key: KEY,
                          id: video_id,
                        },
                      };

                      const youtube = axios.create(payload);
                      countAudio++;
                      const response = await youtube.get("/");
                      viewCount += !!get(
                        response,
                        "data.items[0].statistics.viewCount"
                      )
                        ? +get(response, "data.items[0].statistics.viewCount")
                        : 0;
                    }
                  }
                  return {
                    count_audio: countAudio,
                    views_count: !!viewCount ? viewCount : 0,
                    views_per_audio:
                      countAudio === 0
                        ? 0
                        : !!viewCount
                        ? viewCount / countAudio
                        : 0,
                    ...item,
                  };
                });
                for (let i = 0; i < mapDataSource.length; i++) {
                  let id,
                    name,
                    status,
                    type,
                    count_audio,
                    views_count,
                    views_per_audio;
                  mapDataSource[i]
                    .then((result) => {
                      id = result.id;
                      name = result.name;
                      status = result.status;
                      type = result.type;
                      count_audio = result.count_audio;
                      views_count = result.views_count;
                      views_per_audio = result.views_per_audio;

                      const dataReportAC = [
                        id,
                        name,
                        status,
                        type,
                        count_audio,
                        views_count,
                        views_per_audio,
                        monthNowString,
                      ];
                      if (error) throw error;
                      dbTenTicker.query(
                        "INSERT INTO report_ac VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [...dataReportAC],
                        function (error, results, fields) {
                          if (error) throw error;
                          console.log("insert success report ac", results);
                        }
                      );
                    })
                    .catch((e) => {
                      console.log("error", e);
                    });
                  console.log("id", mapDataSource[i].id);
                }
              }
            );
          });
      }
    );
  },
  {
    scheduled: false,
  }
);

//Schedule AC Report

// var taskMapView = cron.schedule(
//   "*/1 * * * * *",
//   // "*/720 * * * *",
//   () => {
//     dbTenTicker.query(
//       "TRUNCATE TABLE dataMapView",
//       function (error, results, field) {
//         if (error) throw error;
//         dbTenTicker.query(
//           "SELECT * FROM data",
//           function (error, results, fields) {
//             if (error) throw error;
//             // console.log("results", results);

//             const mapDataSource = map(results, async (item, index) => {
//               let viewCount = 0;
//               // console.log("item", item.link_youtube);
//               if (!isEmpty(item.link_youtube)) {
//                 const video_id = YouTubeGetID(item.link_youtube);
//                 // console.log("video_id", video_id);
//                 if (video_id.length !== 11) {
//                   viewCount = 0;
//                 } else {
//                   const payload = {
//                     baseURL: "https://www.googleapis.com/youtube/v3/videos",
//                     params: {
//                       part: "statistics",
//                       key: KEY,
//                       id: video_id,
//                     },
//                   };

//                   const youtube = axios.create(payload);
//                   const response = await youtube.get("/");
//                   viewCount = !!get(
//                     response,
//                     "data.items[0].statistics.viewCount"
//                   )
//                     ? +get(response, "data.items[0].statistics.viewCount")
//                     : 0;
//                 }
//               } else {
//                 viewCount = 0;
//               }
//               return {
//                 ...item,
//                 viewCount,
//               };
//             });
//             for (let i = 0; i < mapDataSource.length; i++) {
//               mapDataSource[i]
//                 .then((result) => {
//                   // console.log("result", result);
//                   const dataMapView = [
//                     result.id,
//                     result.content_code,
//                     result.writer_code,
//                     result.full_title,
//                     result.content_raw,
//                     result.writer_name,
//                     result.content_status,
//                     result.content_final,
//                     result.content_note,
//                     result.content_date,
//                     result.composer_code,
//                     result.composer_name,
//                     result.audio_date,
//                     result.link_audio,
//                     result.audio_status,
//                     result.audio_note,
//                     result.writer_nick,
//                     result.composer_nick,
//                     result.editor_name,
//                     result.video_date,
//                     result.editor_code,
//                     result.link_video,
//                     result.content_code,
//                     result.video_status,
//                     result.video_note,
//                     result.link_youtube,
//                     result.public_date,
//                     result.is_first_public,
//                     result.is_first_content_final,
//                     result.is_first_audio,
//                     result.is_first_video,
//                     result.add_composer_date,
//                     result.add_ve_date,
//                     result.confirm_content_date,
//                     result.confirm_audio_date,
//                     result.salary_index,
//                     result.is_new,
//                     result.viewCount,
//                   ];
//                   dbTenTicker.query(
//                     "INSERT INTO dataMapView VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
//                     [...dataMapView],
//                     function (error, results, fields) {
//                       if (error) throw error;
//                       console.log("Insert success");
//                     }
//                   );
//                 })
//                 .catch((e) => {
//                   console.log("error", e);
//                 });
//             }
//           }
//         );
//       }
//     );
//   },
//   {
//     scheduled: false,
//   }
// );

// taskMapView.start();

if (!isProduct) {
  console.log("run report");
  taskCW.start();
  taskVE.start();
  taskAC.start();
}

module.exports = app;
