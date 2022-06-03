require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const Grid = require("gridfs-stream");
const GridFsStorage = require("multer-gridfs-storage");
const multer = require("multer");
const compression = require('compression');
const cors = require("cors");
//Routes import
const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contact");
const ticketRoutes = require("./routes/ticket");
const userRoutes = require("./routes/user");
const projectRoutes = require("./routes/project");
const teamRoutes = require("./routes/team");

const app = express();

app.set('port', (process.env.PORT || 4000));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://open.weeazy.org");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

let corsOptions = {
  // origin: "*"
  origin: ['https://open.weeazy.org', process.env.WEEAZY_UI_REMOTE_URL]
};
app.use(cors(corsOptions));

const dbURI = process.env.dbURI || "mongodb://localhost:27017/bug_tracker";

mongoose
  .connect(dbURI, { useUnifiedTopology: true, useCreateIndex: true, useNewUrlParser: true, useFindAndModify: false })
  .then(() => console.log("Mongo connected"))
  .catch((err) => {
    console.log(`DB Connection Error: ${err.message}`);
  });

app.use(compression());

// parse requests of content-type - application/json
app.use(express.json());  /* bodyParser.json() is deprecated */

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));   /* bodyParser.urlencoded() is deprecated */

app.use(cookieParser());

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/contact", contactRoutes);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Deployment in Progress.. Please try in 5 min." });
});

app.use(function (req, res, next) {
  //if the request is not html then move along
  var accept = req.accepts('html', 'json', 'xml');
  if (accept !== 'html') {
    return next();
  }
  // if the request has a '.' assume that it's for a file, move along
  var ext = path.extname(req.path);
  if (ext !== '') {
    return next();
  }
  // fs.createReadStream(staticRoot + 'browser/index.html').pipe(res);
});

// set port, listen for requests
app.listen(app.get('port'), () => {
  console.log(`Server is running on port.`, app.get('port'));
});

process.on("SIGINT", () => {
  console.log("Bye bye!");
  process.exit();
});
