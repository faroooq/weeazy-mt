const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Team = require("../models/team");
const async = require("async");
const checkAuth = require("../middleware/check-auth");
const authorize = require("../middleware/authorization");
const bcrypt = require("bcrypt");

// Get all Users
router.get("/", checkAuth, authorize("suadmin", "admin"), (req, res, next) => {
  const searchQuery = req.query.searchQuery;
  const excludedIds = req.query.excludedIds;
  const unassigned = req.query.unassigned;
  const projectCode = req.query.projectCode;
  let query = {};
  let limit = 100;
  // TODO: Below RegExp not working
  if (searchQuery) {
    // const regex = new RegExp(searchQuery);
    // const splittedSearchQuery = searchQuery.split(" ");
    // const firstPart = new RegExp(splittedSearchQuery[0]);
    // const secondPart = new RegExp(splittedSearchQuery[1]);
    query = {
      $or: [
        { firstName: searchQuery },
        { lastName: searchQuery },
        { email: searchQuery },
        // { firstName: firstPart, lastName: secondPart },
        // { firstName: secondPart, lastName: firstPart },
      ],
      // _id: { $ne: excludedIds },
    };
    // limit = 0;
  }
  // If we miss employees unfortunately from the members rows in UI, 
  // that means the employees are disconnected from teams.
  // Res: Comment this below if condition and assign to team and un-comment.
  if (unassigned === "true") {
    query["team"] = [];
  }
  if (projectCode) {
    query["code"] = projectCode;
  }
  User.find(query, "_id firstName lastName email role code")
    .limit(limit)
    .then((employees) => {
      if (employees) {
        res.status(201).json(employees);
      } else {
        res.status(500).json({ message: "No employees have been found" });
      }
    });
});

// Update Multiple User
router.patch("/", checkAuth, authorize("all"), (req, res, next) => {
  const employees = [];
  const updateQuery = req.body.update;
  const oldTeamsToUpdate = {};
  for (let employee of req.body.employees) {
    employees.push(employee._id);
    if ((updateQuery.team || updateQuery.$unset) && employee.team) {
      if (!oldTeamsToUpdate[employee.team]) oldTeamsToUpdate[employee.team] = [];
      oldTeamsToUpdate[employee.team].push(employee._id);
    }
  }
  User.updateMany({ _id: { $in: employees } }, updateQuery)
    .then((updatedEmployees) => {
      async.eachOfSeries(
        oldTeamsToUpdate,
        (employeesToMove, team, done) => {
          if (team !== "undefined" || updateQuery.$unset) Team.updateOne({ _id: team }, { $pull: { employees: { $in: employeesToMove } } }).exec();
          done();
        },
        (error) => {
          if (error) throw error;
        }
      );
      if (updateQuery.team) return Team.updateOne({ _id: updateQuery.team }, { $push: { employees: { $each: employees } } }).exec();
    })
    .then(() => {
      res.status(200).json({ message: "Employees updated successfully." });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// Update User
router.patch("/:id", checkAuth, authorize("all"), async (req, res, next) => {
  const id = req.params.id;
  const updateQuery = req.body.updateQuery;
  if (req.userData.userId === id) {
    if (updateQuery.password) updateQuery.password = await bcrypt.hash(updateQuery.password, 10);
    User.findByIdAndUpdate(id, updateQuery, { new: true }).then((updatedUser) => {
      if (updatedUser) res.status(200).json(updatedUser);
      else res.status(404).json({ message: "User not found" });
    });
  } else {
    res.status(401).json({ message: "You are not authorized to edit this user." });
  }
});
module.exports = router;
