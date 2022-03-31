const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Team = require("../models/team");
const async = require("async");
const checkAuth = require("../middleware/check-auth");
const authorize = require("../middleware/authorization");
const bcrypt = require("bcrypt");

router.get("/", checkAuth, authorize("project manager", "admin"), (req, res, next) => {
  const searchQuery = req.query.searchQuery;
  const excludedIds = req.query.excludedIds;
  const unassigned = req.query.unassigned;
  let query = {};
  let limit = 100;
  if (searchQuery) {
    const regex = new RegExp(searchQuery);
    const splittedSearchQuery = searchQuery.split(" ");
    const firstPart = new RegExp(splittedSearchQuery[0]);
    const secondPart = new RegExp(splittedSearchQuery[1]);
    query = {
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { firstName: firstPart, lastName: secondPart },
        { firstName: secondPart, lastName: firstPart },
      ],
      _id: { $ne: excludedIds },
    };
    limit = 0;
  }
  if (unassigned === "true") {
    query["team"] = null;
  }
  User.find(query, "_id firstName lastName email role")
    .limit(limit)
    .then((employees) => {
      if (employees) {
        res.status(201).json(employees);
      } else {
        res.status(500).json({ message: "No employees have been found" });
      }
    });
});

router.patch("/", checkAuth, authorize("project manager", "admin"), (req, res, next) => {
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

router.patch("/:id", checkAuth, async (req, res, next) => {
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
