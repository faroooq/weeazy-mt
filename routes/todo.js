const express = require("express");
const crypto = require("crypto");
const path = require("path");
const router = express.Router();
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const GridFsStorage = require("multer-gridfs-storage");
const mongoURI = process.env.dbURI || "mongodb://localhost:27017/weeazy_tracker";
const multer = require("multer");
const Todo = require("../models/todo");
const TodoHistory = require("../models/todo-history");
const Comment = require("../models/comment");
const checkAuth = require("../middleware/check-auth");
const authorize = require("../middleware/authorization");

// INIT GFS
let gfs;
mongoose.connection.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
});
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const fileInfo = {
        filename: file.originalname,
        bucketName: "uploads",
      };
      resolve(fileInfo);
    });
  },
});
const upload = multer(
  {
    storage: storage,
    limits: { fieldSize: 8 * 1024 * 1024 }
  },
);


//new todo
router.post("/", upload.array("files"), checkAuth, authorize("all"), (req, res) => {
  const files = [];
  for (let file of req.files) {
    files.push(file.id);
  }
  const todo = new Todo({
    description: req.body.description,
    raisedBy: req.userData.userId,
    project: req.body.project,
    team: req.body.team,
    assignedTo: req.body.assignedTo.split(","),
    type: req.body.type,
    photo: req.body.photo,
    priority: req.body.priority,
  });
  todo
    .save()
    .then((todo) => {
      res.status(201).json({ message: "Todo created successfully", todo: todo });
    })
    .catch((error) => {
      res.status(500).json({ error });
      console.log(error);
    });
});

module.exports = router;
