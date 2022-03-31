const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Grid = require("gridfs-stream");
const GridFsStorage = require("multer-gridfs-storage");
const multer = require("multer");

//Routes import
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/ticket");
const userRoutes = require("./routes/user");
const projectRoutes = require("./routes/project");
const teamRoutes = require("./routes/team");

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  next();
});

//connect to mongo
const mongoURI = "mongodb://localhost:27017/bug_tracker";
mongoose
  .connect(mongoURI, { useUnifiedTopology: true, useCreateIndex: true, useNewUrlParser: true, useFindAndModify: false })
  .then(() => console.log("Mongo connected"))
  .catch((err) => {
    console.log(`DB Connection Error: ${err.message}`);
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server started on port  ${PORT}`));

process.on("SIGINT", () => {
  console.log("Bye bye!");
  process.exit();
});
