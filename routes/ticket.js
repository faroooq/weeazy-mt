const express = require("express");
const crypto = require("crypto");
const path = require("path");
const router = express.Router();
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const GridFsStorage = require("multer-gridfs-storage");
const mongoURI = "mongodb://localhost:27017/bug_tracker";
const multer = require("multer");
const Ticket = require("../models/ticket");
const TicketHistory = require("../models/ticket-history");
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
const upload = multer({ storage: storage });

//ROUTES

//all tickets
router.get("/", checkAuth, authorize("all"), (req, res, next) => {
  const project = req.query.projectId;
  const number = req.query.number;
  let query = project && number ? { project, number } : project ? { project } : number ? { number } : {};
  Ticket.find(query).then((tickets) => {
    if (tickets) {
      res.status(200).json(tickets);
    } else {
      res.status(404).json({ message: "Tickets not found." });
    }
  });
});

//ticket by id
router.get("/:id", checkAuth, authorize("all"), (req, res, next) => {
  const id = req.params.id;
  let ticket = {};
  Ticket.findOne({ number: id })
    .populate("raisedBy", "_id firstName lastName email")
    .populate({ path: "comments", populate: { path: "author", select: "firstName lastName email _id createdOn" } })
    .populate("team", "_id name")
    .populate("assignedTo", "_id firstName lastName email")
    .populate({ path: "history", populate: { path: "changedBy", select: " firstName lastName" } })
    .then((foundTicket) => {
      if (foundTicket) {
        ticket = foundTicket;
        return gfs.find({ _id: { $in: ticket.files } }).toArray();
      } else {
        throw new Error("Ticket not found.");
      }
    })
    .then((files) => {
      if (files) {
        ticket = ticket.toObject();
        ticket.files = files;
      }
      res.status(200).json(ticket);
    })
    .catch((error) => {
      console.log(error);
      res.status(404).json({ message: error.message });
    });
});

//new comment
router.post("/:id/comments", checkAuth, authorize("all"), (req, res, next) => {
  const ticketId = req.params.id;
  const content = req.body.comment;
  const userId = req.userData.userId;
  let ticketHistory;
  let comment = new Comment({
    author: userId,
    content,
  });
  comment
    .save()
    .then((comment) => {
      ticketHistory = new TicketHistory({
        changedBy: userId,
        attribute: "newComment",
        newValue: comment.content,
      });
      return ticketHistory.save();
    })
    .then((ticketHistory) => {
      return Ticket.updateOne({ number: ticketId }, { $push: { comments: comment, history: ticketHistory } });
    })
    .then((update) => {
      return comment.populate({ path: "author", select: "firstName lastName email _id createdOn" }).execPopulate();
    })
    .then((comment) => {
      return ticketHistory.populate({ path: "changedBy", select: "firstName lastName" }).execPopulate();
    })
    .then((ticketHistory) => {
      res.status(201).json({ message: "Ticket added successfully.", comment, ticketHistory });
    })
    .catch((error) => {
      res.status(500).json({ error });
      console.log(error);
    });
});

//download file
router.get("/:id/files/:fileId", checkAuth, authorize("all"), (req, res, next) => {
  const fileId = req.params.fileId;
  gfs.find({ _id: mongoose.Types.ObjectId(fileId) }).toArray((err, files) => {
    let file = files[0];
    if (err) {
      return res.status(404).json(err);
    } else if (!file) {
      return res.status(404).json({ error: "File was not found in the database" });
    }
    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition", `attachment; filename="${file.filename}"`);
    let downloadStream = gfs.openDownloadStreamByName(file.filename);
    downloadStream.on("error", (err) => res.end());
    downloadStream.pipe(res);
  });
});

//new ticket
router.post("/", upload.array("files"), checkAuth, authorize("all"), (req, res) => {
  const files = [];
  for (let file of req.files) {
    files.push(file.id);
  }
  const ticket = new Ticket({
    title: req.body.title,
    description: req.body.description,
    files,
    raisedBy: req.userData.userId,
    project: req.body.project,
    team: req.body.team,
    assignedTo: req.body.assignedTo,
    type: req.body.type,
    priority: req.body.priority,
  });

  ticket
    .save()
    .then((ticket) => {
      res.status(201).json({ message: "Ticket created successfully", ticket: ticket });
    })
    .catch((error) => {
      res.status(500).json({ error });
      console.log(error);
    });
});

//update ticket
router.patch("/:id", checkAuth, authorize("all"), (req, res, next) => {
  const id = req.params.id;
  const uderId = req.userData.userId;
  const changes = req.body.changes;
  const ticketHistory = [];
  const updateQuery = {};
  for (let change of changes) {
    updateQuery[change.attribute] = change.attribute === "assignedTo" || change.attribute === "team" ? change.id : change.newValue;
    ticketHistory.push(new TicketHistory({ changedBy: uderId, attribute: change.attribute, oldValue: change.oldValue, newValue: change.newValue }));
  }
  Ticket.findOneAndUpdate({ number: id }, updateQuery)
    .then((updatedTicket) => {
      if (updatedTicket) {
        return TicketHistory.insertMany(ticketHistory);
      } else {
        res.status(404).json({ message: "Ticket with this id cannot be found." });
      }
    })
    .then((ticketHistory) => {
      if (ticketHistory) return Ticket.findOneAndUpdate({ number: id }, { $push: { history: ticketHistory } });
    })
    .then((updatedTicket) => {
      if (updatedTicket) res.status(201).json({ message: "Ticket updated successfully." });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error });
    });
});

module.exports = router;
