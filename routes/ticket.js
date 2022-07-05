const express = require("express");
const crypto = require("crypto");
const path = require("path");
const router = express.Router();
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const GridFsStorage = require("multer-gridfs-storage");
const mongoURI = process.env.dbURI || "mongodb://localhost:27017/weeazy_tracker";
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
const upload = multer(
  {
    storage: storage,
    limits: { fieldSize: 8 * 1024 * 1024 }
  },
);

//ROUTES
//all tickets
router.get("/", checkAuth, authorize("all"), (req, res, next) => {
  const project = req.query.project;
  const ticketOwned = req.query.ticketOwned;
  const role = req.query.role;
  const status = req.query.status;
  const priority = req.query.priority;
  const type = req.query.type;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  if (project) {
    const number = req.query.number;
    let query = {};
    query = project && number ? { project, number } : project ? { project } : number ? { number } : {};
    // Pulling tickets by status.
    if (status) {
      query["status"] = status;
    }
    if (priority) {
      query["priority"] = priority;
    }
    if (type) {
      query["type"] = type;
    }
    if (startDate !== 'Invalid Date' && endDate !== 'Invalid Date') {
      query["createdOn"] = {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      };
    }
    let totalTickets = []
    Ticket.find(query)
      .sort({ updatedOn: 'desc' })
      // Selecting only few columns to avoid latency
      .select("_id status priority type tags title createdOn updatedOn number photoUrl")
      .populate("raisedBy", "_id firstName lastName email role")
      .populate("team", "_id name")
      .populate("assignedTo", "_id firstName lastName email role")
      .then((tickets) => {
        if (tickets) {
          let openTicketCount = 0;
          let pendingTicketCount = 0;
          let resolvedTicketCount = 0;
          let closedTicketCount = 0;
          for (let i = 0; i < tickets.length; i++) {
            for (let j = 0; j < tickets[i].assignedTo.length; j++) {
              // Displaying tickets only to the raisedBy or assignedTo member or if admin.
              // This condition will restrict to see other team members tickets.
              if (
                tickets[i].assignedTo[j].email.toString() === ticketOwned.toString() ||
                tickets[i].raisedBy.email.toString() === ticketOwned.toString() ||
                role === "admin") {
                totalTickets.push(tickets[i]);
                if (tickets[i].status === 'OPEN') {
                  openTicketCount++;
                } else if (tickets[i].status === 'PENDING') {
                  pendingTicketCount++;
                } else if (tickets[i].status === 'RESOLVED') {
                  resolvedTicketCount++;
                } else if (tickets[i].status === 'CLOSED') {
                  closedTicketCount++;
                }
                break;
              }
            }
          }
          res.status(200).json(
            {
              'openTicketCount': openTicketCount, 'pendingTicketCount': pendingTicketCount,
              'resolvedTicketCount': resolvedTicketCount, 'closedTicketCount': closedTicketCount,
              totalTickets
            }
          );
        } else {
          res.status(404).json({ message: "Tickets not found." });
        }
      });
  } else {
    res.status(404).json({ message: "You are not assigned to any organization to view tickets." });
  }
});

//ticket by id
router.get("/:id", checkAuth, authorize("all"), (req, res, next) => {
  const id = req.params.id;
  const ticketOwned = req.query.ticketOwned;
  const role = req.query.role;
  let ticket = {};
  Ticket.findOne({ number: id })
    .populate("raisedBy", "_id firstName lastName email  photoUrl role")
    .populate({ path: "comments", populate: { path: "author", select: "firstName lastName email _id createdOn updatedOn" } })
    .populate("team", "_id name")
    .populate("assignedTo", "_id firstName lastName email  photoUrl role")
    .populate({ path: "history", populate: { path: "changedBy", select: " firstName lastName" } })
    .then((foundTicket) => {
      if (foundTicket) {
        for (let i = 0; i < foundTicket.assignedTo.length; i++) {
          if (
            foundTicket.assignedTo[i].email.toString() === ticketOwned.toString() ||
            foundTicket.raisedBy.email.toString() === ticketOwned.toString() ||
            role === "admin") {
            ticket = foundTicket;
            return gfs.find({ _id: { $in: ticket.files } }).toArray();
          }
        }
      } else {
        throw new Error("Ticket not found.");
      }
    })
    .then((files) => {
      if (files) {
        ticket = ticket.toObject();
        ticket.files = files;
        res.status(200).json(ticket);
      } else {
        throw new Error("Ticket not found.");
      }
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
        attribute: "Comment",
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
    assignedTo: req.body.assignedTo.split(","),
    type: req.body.type,
    tags: req.body.tags,
    photoUrl: req.body.photoUrl,
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
router.patch("/:id", upload.array("files"), checkAuth, authorize("admin", "suadmin", "member"), (req, res, next) => {
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

// delete ticket
router.delete("/:id", checkAuth, authorize("admin", "suadmin", "member"), (req, res, next) => {
  const id = req.params.id;
  Ticket.findByIdAndDelete(id)
    .then((respose) => {
      res.status(200).json({ message: "Ticket deleted successfully." });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error });
    });
});

module.exports = router;
