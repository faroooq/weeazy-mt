const mongoose = require("mongoose");
const checkAuth = require("../middleware/check-auth");
const authorize = require("../middleware/authorization");
const Team = require("../models/team");
const Ticket = require("../models/ticket");
const Project = require("../models/project");
const Employee = require("../models/user");
const async = require("async");
const express = require("express");
const router = express.Router();

router.get("/", checkAuth, authorize("admin", "suadmin", "member"), (req, res, next) => {
  const projectId = req.query.projectId;
  if (projectId === undefined) {
    res.status(500).json({ message: "You are not assigned to any organization. Please contact your admin." });
    return;
  }
  let query = projectId ? { project: projectId } : {};
  let teams;
  Team.find(query)
    .then((foundTeams) => {
      if (foundTeams) {
        teams = foundTeams.map((t) => t.toObject());
        return Ticket.aggregate([
          { $match: { team: { $in: teams.map((team) => new mongoose.Types.ObjectId(team._id)) } } },
          {
            $group: {
              _id: { team: "$team", status: "$status" },
              count: { $sum: 1 },
            },
          },
        ]);
      }
    })
    .then((results) => {
      for (let team of teams) {
        team.employees = team.employees.length;
        for (let result of results) {
          if (team._id.toString() === result._id.team.toString()) {
            if (result._id.status === "OPEN"
              || result._id.status === "PENDING"
              || result._id.status === "RESOLVED")
              team.openTickets = result.count;
            if (result._id.status === "CLOSED") team.closedTickets = result.count;
          }
        }
      }
      res.status(200).json(teams);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: "An error has occurred.", error });
    });
});

router.post("/", checkAuth, authorize("admin", "suadmin"), (req, res, next) => {
  const team = new Team({ name: req.body.teamName, project: req.body.projectId });
  team
    .save()
    .then((team) => {
      return Project.findByIdAndUpdate(team.project, { $push: { teams: team } });
    })
    .then((projectUpdated) => {
      res.status(200).json(team);
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

router.delete("/:id", checkAuth, authorize("admin", "suadmin"), (req, res, next) => {
  const id = req.params.id;
  let team;
  Team.findByIdAndDelete(id)
    .then((deletedTeam) => {
      if (deletedTeam) {
        team = deletedTeam;
        return Employee.updateMany({ _id: { $in: deletedTeam.employees } }, { $unset: { team: "" } });
      } else {
        res.status(404).json({ message: "Team not found" });
      }
    })
    .then((update) => {
      return Project.findByIdAndUpdate(team.project, { $pull: { teams: team._id } });
    })
    .then((project) => {
      res.status(200).json({ message: "Team removed successfully." });
    });
});

router.get("/:id/employees", checkAuth, authorize("all"), (req, res, next) => {
  const teamId = req.params.id;
  Employee.find({ team: teamId }, "_id firstName lastName email")
    .then((employees) => {
      if (employees) {
        res.status(201).json(employees);
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "An error has occurred.", error });
    });
});

router.patch("/:id", checkAuth, authorize("admin", "suadmin"), async (req, res, next) => {
  const id = req.params.id;
  const updateQuery = req.body.updateQuery;
  // if (req.userData.userId === id) {
  if (updateQuery.password) updateQuery.password = await bcrypt.hash(updateQuery.password, 10);
  Team.findByIdAndUpdate(id, { name: updateQuery.name }).then((updatedUser) => {
    if (updatedUser) res.status(200).json(updatedUser);
    else res.status(404).json({ message: "Team not found" });
  });
  // } else {
  //   res.status(401).json({ message: "You are not authorized to edit this team." });
  // }
});

module.exports = router;
