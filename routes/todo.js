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

//all todos
router.get("/", checkAuth, authorize("all"), (req, res, next) => {
  const project = req.query.project;
  const todoOwned = req.query.todoOwned;
  const role = req.query.role;
  const status = req.query.status;
  const priority = req.query.priority;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  if (project) {
    const noteId = req.query.noteId;
    let query = {};
    query = project && noteId ? { project, noteId } : project ? { project } : noteId ? { noteId } : {};
    // Pulling todos by status.
    if (status) {
      query["status"] = status;
    }
    if (priority) {
      query["priority"] = priority;
    }
    if (startDate !== 'Invalid Date' && endDate !== 'Invalid Date') {
      query["createdOn"] = {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      };
    }
    let totalTodos = []
    Todo.find(query)
      // .sort({ priority: 'asc' })
      // Selecting only few columns to avoid latency
      .select("_id status priority type description createdOn updatedOn noteId photo position enableEdit")
      .populate("raisedBy", "_id firstName lastName email role")
      .populate("team", "_id name")
      .populate("assignedTo", "_id firstName lastName email role")
      .then((todos) => {
        if (todos) {
          let openTodoCount = 0;
          let pendingTodoCount = 0;
          let resolvedTodoCount = 0;
          let closedTodoCount = 0;
          for (let i = 0; i < todos.length; i++) {
            for (let j = 0; j < todos[i].assignedTo.length; j++) {
              // Displaying todos only to the raisedBy or assignedTo member or if admin.
              // This condition will restrict to see other team members todos.
              if (
                todos[i].assignedTo[j].email.toString() === todoOwned.toString() ||
                todos[i].raisedBy.email.toString() === todoOwned.toString() ||
                role === "admin") {
                totalTodos.push(todos[i]);
                if (todos[i].status === 'OPEN') {
                  openTodoCount++;
                } else if (todos[i].status === 'PENDING') {
                  pendingTodoCount++;
                } else if (todos[i].status === 'RESOLVED') {
                  resolvedTodoCount++;
                } else if (todos[i].status === 'CLOSED') {
                  closedTodoCount++;
                }
                break;
              }
            }
          }
          res.status(200).json(
            {
              'openTodoCount': openTodoCount, 'pendingTodoCount': pendingTodoCount,
              'resolvedTodoCount': resolvedTodoCount, 'closedTodoCount': closedTodoCount,
              totalTodos
            }
          );
        } else {
          res.status(404).json({ message: "Todos not found." });
        }
      });
  } else {
    res.status(404).json({ message: "You are not assigned to any organization to view todos." });
  }
});


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
    assignedTo: req.body.assignedTo,
    type: req.body.type,
    photo: req.body.photo,
    priority: req.body.priority,
    position: req.body.position,
    column: req.body.column,
    enableEdit: req.body.enableEdit
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

//update todo
router.patch("/:id", checkAuth, authorize("admin", "suadmin", "member"), (req, res, next) => {
  const id = req.params.id;
  const userId = req.userData.userId;
  const changes = req.body.changes;
  // WE WILL ENBALE HISTORY UPON CLIENT REQUIREMENT
  // const todoHistory = [];
  const updateQuery = {};
  for (let change of changes) {
    updateQuery[change.attribute] = change.attribute === "assignedTo" || change.attribute === "team" ? change.id : change.newValue;
    // WE WILL ENBALE HISTORY UPON CLIENT REQUIREMENT
    // todoHistory.push(new TodoHistory({ changedBy: userId, attribute: change.attribute, oldValue: change.oldValue, newValue: change.newValue }));
  }
  Todo.findOneAndUpdate({ noteId: id }, updateQuery)
    // WE WILL ENBALE HISTORY UPON CLIENT REQUIREMENT  
    // .then((updatedTodo) => {
    //   if (updatedTodo) {
    //     return TodoHistory.insertMany(todoHistory);
    //   } else {
    //     res.status(404).json({ message: "Todo with this id cannot be found." });
    //   }
    // })
    // .then((todoHistory) => {
    //   if (todoHistory) return Todo.findOneAndUpdate({ noteId: id }, { $push: { history: todoHistory } });
    // })
    .then((updatedTodo) => {
      if (updatedTodo) res.status(201).json({ message: "Todo updated successfully." });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error });
    });
});

// delete todo
router.delete("/:id", checkAuth, authorize("admin", "suadmin", "member"), (req, res, next) => {
  const id = req.params.id;
  Todo.findByIdAndDelete(id)
    .then((respose) => {
      res.status(200).json({ message: "Todo deleted successfully." });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error });
    });
});

module.exports = router;
