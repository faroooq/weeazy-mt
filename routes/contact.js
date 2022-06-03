const express = require("express");
const router = express.Router();
const Contact = require("../models/contact");

router.post("/", (req, res) => {
    const contact = new Contact({
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        type: req.body.type,
        desc: req.body.desc
    });
    contact
        .save()
        .then((result) => {
            res.status(201).json({ message: "Contact saved successfully", result: result });
        })
        .catch((error) => {
            res.status(500).json({ error });
            console.log(error);
        });
});

module.exports = router;
