var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mysql = require("mysql");
var cors = require("cors");

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
  console.log("data", data);
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
  console.log("data_id", data_id);
  console.log("data", data[22]);
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
  console.log("req.body", req.body);
  let data_id = req.body.data_id;
  console.log("data_id", data_id);
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
  console.log("month", month);
  dbTenTicker.query(
    "SELECT * FROM salary WHERE thang = ?",
    month,
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
    "INSERT INTO salary VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
  console.log("thang", thang);
  if (!thang) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide thang" });
  }
  dbTenTicker.query(
    "DELETE FROM salary WHERE thang = ?",
    thang,
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
  console.log("month", month);
  dbTenTicker.query(
    "SELECT * FROM salary_temp WHERE thang = ?",
    month,
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
    "INSERT INTO salary_temp VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
  console.log("thang", thang);
  if (!thang) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide thang" });
  }
  dbTenTicker.query(
    "DELETE FROM salary_temp WHERE thang = ?",
    thang,
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

module.exports = app;
