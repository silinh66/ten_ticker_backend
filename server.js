var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mysql = require("mysql");
var cors = require("cors");

//dev

var whitelist = [
  "https://ten-ticker-cms-dev.herokuapp.com",
  "http://ten-ticker-cms-dev.herokuapp.com",
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

// app.use(cors(corsOptions));

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

var db_config = {
  host: "us-cdbr-east-03.cleardb.com",
  user: "bc74e7c7dc5b9e",
  password: "f04abeb4",
  database: "heroku_47bd66779dcda20",
};

var dbTenTicker;

//dev
// var dbTenTicker = mysql.createConnection({
//   host: "us-cdbr-east-03.cleardb.com",
//   user: "bc74e7c7dc5b9e",
//   password: "f04abeb4",
//   database: "heroku_47bd66779dcda20",
// });

//product
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
  //dev
  // var dbTenTicker = mysql.createConnection({
  //   host: "us-cdbr-east-03.cleardb.com",
  //   user: "bc74e7c7dc5b9e",
  //   password: "f04abeb4",
  //   database: "heroku_47bd66779dcda20",
  // });

  //product

  // dbTenTicker = mysql.createConnection({
  //   host: "us-cdbr-east-03.cleardb.com",
  //   user: "b2b329e77fd088",
  //   password: "57100c49",
  //   database: "heroku_6d453306171d11b",
  // });
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
    "INSERT INTO data VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
  console.log("data", data);
  if (!data_id || !data) {
    return res
      .status(400)
      .send({ error: data, message: "Please provide data and data_id" });
  }
  dbTenTicker.query(
    "UPDATE data SET id = ?, content_code = ?, writer_code = ?, full_title =?, content_raw = ?, writer_name=?,  content_status=?,  content_final = ?, content_note = ?, content_date = ?, composer_code = ?, composer_name = ?, audio_date = ?, link_audio = ?, audio_status = ? ,audio_note = ?, writer_nick =?, composer_nick = ?, editor_name=?,  video_date=?,  footage = ?, editor_code = ?, link_video = ?, video_status = ?, video_note = ?, link_youtube = ?, public_date = ?, is_first_public = ?, is_first_content_final =?, is_first_audio = ?, is_first_video = ?, add_composer_date = ?, add_ve_date = ?, confirm_content_date = ?, confirm_audio_date = ?  WHERE id = ?",
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
app.get("/tenticker/:id", function (req, res) {
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
  console.log("req.body", req.body);
  let activity_id = req.body.activity_id;
  console.log("activity_id", activity_id);
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

module.exports = app;
