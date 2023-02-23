const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
    require("../models/User")
const User = mongoose.model("users")
const bcrypt = require("bcryptjs")
const passport = require("passport")
    require("../config/auth")(passport)

router.get("/", (req, res, next) =>{
    const title = "Login"
    res.render("users/index", {title})
})

router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/admin",
        failureRedirect: "/users",
        failureFlash: true
    })(req, res, next)
})

router.get("/logout", (req, res) => {
    req.logout()
    req.flash("success_msg", "Sessão finalizada com sucesso")
    res.redirect("/")
})


module.exports = router