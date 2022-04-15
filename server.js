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
const ticketRoutes = require("./routes/ticket");
const userRoutes = require("./routes/user");
const projectRoutes = require("./routes/project");
const teamRoutes = require("./routes/team");

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

const dbURI = process.env.dbURI || "mongodb://localhost:27017/bug_tracker";

mongoose
  .connect(dbURI, { useUnifiedTopology: true, useCreateIndex: true, useNewUrlParser: true, useFindAndModify: false })
  .then(() => console.log("Mongo connected"))
  .catch((err) => {
    console.log(`DB Connection Error: ${err.message}`);
  });

// let corsOptions = {
//   // origin: "*"
//   origin: ['https://www.weeazy.org', process.env.WEEAZY_UI_REMOTE_URL]
// };
// app.use(cors(corsOptions));
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server started on port  ${PORT}`));

process.on("SIGINT", () => {
  console.log("Bye bye!");
  process.exit();
});
