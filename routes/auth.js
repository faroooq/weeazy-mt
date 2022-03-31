const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    const user = new User({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hash,
    });
    user
      .save()
      .then((result) => {
        res.status(201).json({ message: "User created successfully", result: result });
      })
      .catch((error) => {
        res.status(500).json({ error });
        console.log(error);
      });
  });
});

router.post("/login", (req, res, next) => {
  let fetchedUser;
  User.findOne({ email: req.body.email })
    .populate({ path: "team", select: "_id name project", populate: { path: "project", select: "_id title" } })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ message: "Authentication failed" });
      }
      fetchedUser = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then((result) => {
      if (!result) {
        return res.status(401).json({ message: "Authentication failed" });
      }
      const token = jwt.sign(
        {
          email: fetchedUser.email,
          firstName: fetchedUser.firstName,
          userId: fetchedUser._id,
          role: fetchedUser.role,
          projectId: fetchedUser.team.project._id,
        },
        "Super secret message only for development: Seals are like dogs but underwater dogs.",
        { expiresIn: "1h" }
      );
      res.status(200).json({ token, expiresIn: 3600, user: fetchedUser });
    })
    .catch((error) => {
      return res.status(401).json({ message: "Authentication failed", error });
    });
});

module.exports = router;
