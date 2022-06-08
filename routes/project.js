const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const authorize = require("../middleware/authorization");
const mongoose = require("mongoose");
const Project = require("../models/project");
const Team = require("../models/team");
const Ticket = require("../models/ticket");
const Employee = require("../models/user");
const async = require("async");

// Find Single Project for new signup
router.get("/:id/find", (req, res, next) => {
  const id = req.params.id;
  let project = {};
  Project.findOne({ code: id })
    .then((foundProject) => {
      if (foundProject) {
        project = foundProject;
        res.status(200).json(true);
      } else {
        res.status(201).json(false);
      }
    })
  // .catch((err) => res.status(404).json(false));
});

// Find Single Project
router.get("/:id", checkAuth, authorize("admin", "suadmin"), (req, res, next) => {
  const id = req.params.id;
  let project = {};
  Project.findById(id)
    .populate({ path: "teams", populate: { path: "employees", select: "_id firstName lastName role email" } })
    .then((foundProject) => {
      if (foundProject) {
        project = foundProject;
        return Ticket.find({ project });
      } else {
        res.status(404).json({ message: "Project not found" });
      }
    })
    .then((tickets) => {
      res.status(200).json({ project, tickets });
    });
});

// Find employees by project
router.get("/:id/employees", checkAuth, authorize("admin", "suadmin"), (req, res, next) => {
  const id = req.params.id;
  Team.find({ project: id })
    .populate("employees", "-password")
    .then((teams) => {
      let employees = teams.flatMap((team) => team.employees.map((employee) => ({ ...employee.toObject(), teamName: team.name })));
      res.status(200).json({ employees, teams });
    });
});

// Find all projects
router.get("/", checkAuth, authorize("suadmin"), (req, res, next) => {
  Project.find().then((projects) => {
    if (projects) {
      res.status(201).json(projects);
    } else {
      res.status(404).json({ message: "Projects not found" });
    }
  });
});

// Find Tickets by Project
router.get("/:id/statistics", checkAuth, authorize("suadmin", "admin", "member"), (req, res, next) => {
  const id = req.params.id;
  Ticket.aggregate([
    {
      $facet: {
        categorizedByStatus: [
          { $match: { project: mongoose.Types.ObjectId(id) } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
        categorizedByType: [
          { $match: { project: mongoose.Types.ObjectId(id) } },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
            },
          },
        ],
        categorizedByPriority: [
          { $match: { project: mongoose.Types.ObjectId(id) } },
          {
            $group: {
              _id: "$priority",
              count: { $sum: 1 },
            },
          },
        ],
        categorizedByTeam: [
          { $match: { project: mongoose.Types.ObjectId(id) } },
          {
            $group: {
              _id: "$team",
              count: { $sum: 1 },
            },
          },
        ],
        categorizedByDateOpen: [
          { $match: { project: mongoose.Types.ObjectId(id), status: "OPEN" } },
          {
            $group: {
              _id: { day: { $dayOfMonth: "$createdOn" }, month: { $month: "$createdOn" } },
              count: { $sum: 1 },
            },
          },

          { $sort: { "_id.month": 1, "_id.day": 1 } },
        ],
        categorizedByDateClosed: [
          { $match: { project: mongoose.Types.ObjectId(id), status: "CLOSED" } },
          {
            $group: {
              _id: { day: { $dayOfMonth: "$createdOn" }, month: { $month: "$createdOn" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.month": 1 } },
        ],
      },
    },
  ])
    .then((statistics) => {
      return Team.populate(statistics, { path: "categorizedByTeam._id", select: "name" });
    })
    .then((statistics) => {
      if (statistics) res.status(201).json(statistics[0]);
      else res.status(404).json({ message: "Unable to obtain statistics" });
    })
    .catch((err) => res.status(500).json(err));
});

// Find Tickets by Member
router.get("/:id/:memberId/statistics", checkAuth, authorize("suadmin", "admin", "member"), (req, res, next) => {
  const id = req.params.id;
  const memberId = req.params.memberId;
  Ticket.aggregate([
    {
      $facet: {
        categorizedByStatus: [
          {
            $match: {
              $or: [
                {
                  raisedBy: mongoose.Types.ObjectId(memberId)
                },
                {
                  assignedTo: mongoose.Types.ObjectId(memberId)
                }
              ]
            }
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
        categorizedByType: [
          {
            $match: {
              $or: [
                {
                  raisedBy: mongoose.Types.ObjectId(memberId)
                },
                {
                  assignedTo: mongoose.Types.ObjectId(memberId)
                }
              ]
            }
          },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
            },
          },
        ],
        categorizedByPriority: [
          {
            $match: {
              $or: [
                {
                  raisedBy: mongoose.Types.ObjectId(memberId)
                },
                {
                  assignedTo: mongoose.Types.ObjectId(memberId)
                }
              ]
            }
          },
          {
            $group: {
              _id: "$priority",
              count: { $sum: 1 },
            },
          },
        ],
        categorizedByTeam: [
          {
            $match: {
              $or: [
                {
                  raisedBy: mongoose.Types.ObjectId(memberId)
                },
                {
                  assignedTo: mongoose.Types.ObjectId(memberId)
                }
              ]
            }
          },
          {
            $group: {
              _id: "$team",
              count: { $sum: 1 },
            },
          },
        ],
        categorizedByDateOpen: [
          {
            $match: {
              $or: [
                {
                  raisedBy: mongoose.Types.ObjectId(memberId)
                },
                {
                  assignedTo: mongoose.Types.ObjectId(memberId)
                }
              ], status: "OPEN"
            }
          },
          {
            $group: {
              _id: { day: { $dayOfMonth: "$createdOn" }, assignedTo: mongoose.Types.ObjectId(memberId), month: { $month: "$createdOn" } },
              count: { $sum: 1 },
            },
          },

          { $sort: { "_id.month": 1, "_id.day": 1 } },
        ],
        categorizedByDateClosed: [
          {
            $match: {
              $or: [
                {
                  raisedBy: mongoose.Types.ObjectId(memberId)
                },
                {
                  assignedTo: mongoose.Types.ObjectId(memberId)
                }
              ], status: "CLOSED"
            }
          },
          {
            $group: {
              _id: { day: { $dayOfMonth: "$createdOn" }, month: { $month: "$createdOn" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.month": 1 } },
        ],
      },
    },
  ])
    .then((statistics) => {
      return Team.populate(statistics, { path: "categorizedByTeam._id", select: "name" });
    })
    .then((statistics) => {
      if (statistics) res.status(201).json(statistics[0]);
      else res.status(404).json({ message: "Unable to obtain statistics" });
    })
    .catch((err) => res.status(500).json(err));
});

// New Project
router.post("/", checkAuth, authorize("suadmin", "admin"), (req, res, next) => {
  const teams = [];
  for (let team of req.body.project.teams) {
    teams.push(new Team(team));
  }
  const project = new Project({
    title: req.body.project.title,
    code: req.body.project.code,
    description: req.body.project.description,
    teams,
  });
  project
    .save()
    .then((savedProject) => {
      if (req.body.project.teams.length) {
        for (let team of teams) {
          team.project = project._id;
        }
        return Team.insertMany(teams);
      } else {
        res.status(201).json({ message: "Project created successfully.", project: project });
      }
    })
    .then((insertedTeams) => {
      if (insertedTeams) {
        async.eachSeries(
          insertedTeams,
          (team, done) => {
            Employee.updateMany({ _id: { $in: team.employees } }, { team: team._id }).exec();
            done();
          },
          (error) => {
            if (error) throw error;
          }
        );
        const employees = [];
        for (let i = 0; i < req.body.project.teams.length; i++) {
          employees.push(...req.body.project.teams[i].employees);
        }
        if (employees) {
          return employees;
        } else {
          res.status(201).json({ message: "Project and teams created successfully.", project: project });
        }
      }
    })
    .then((employees) => {
      if (employees) {
        async.eachSeries(
          employees,
          (employee, done) => {
            Employee.findByIdAndUpdate(employee._id, { role: employee.role }).exec();
            done();
          },
          (error) => {
            if (error) throw error;
          }
        );
        res.status(201).json({ message: "Project and teams created successfully, employees updated successfully.", project: project });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "Something went wrong.", error });
      console.log(error);
    });
});

// Delete Project
router.delete("/:id", checkAuth, authorize("suadmin", "admin"), (req, res, next) => {
  const id = req.params.id;
  let project;
  Project.findByIdAndDelete(id)
    .then((deletedProject) => {
      res.status(200).json({ message: "Project removed successfully." });
    })
});

module.exports = router;
