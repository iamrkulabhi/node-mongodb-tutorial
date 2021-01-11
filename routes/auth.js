const express = require("express")
const { body } = require("express-validator")
const bcrypt = require("bcryptjs")

const authCtrl = require("../controllers/auth")
const userModel = require("../models/user")
const guestMiddleware = require("../middlewares/is-guest")
const authMiddleware = require("../middlewares/is-auth")

const router = express.Router()

router.get('/login', guestMiddleware, authCtrl.getLogin)

router.post('/login', guestMiddleware,
[
    body("email")
    .isEmail()
    .withMessage("Please enter valid email")
    .custom((value, {req}) => {
        return userModel.findOne({email: value})
        .then(user => {
            if(!user) {
                return Promise.reject("User is not found with this email")
            }
        }) 
    }),
    body("password")
    .isLength({min: 5})
    .withMessage("Password should be length og 5 charecters")
    .custom((value, {req}) => {
        return userModel.findOne({email: req.body.email})
        .then(user => {
            if(user && !bcrypt.compareSync(value, user.password)) {
                return Promise.reject("Invalid password")
            }
        })
    })
],
authCtrl.postLogin)

router.get('/signup', guestMiddleware, authCtrl.getSignup)

router.post('/signup', guestMiddleware,
[
    body("name").isLength({min: 3}).withMessage("Please enter valid name"),
    body("email").isEmail().withMessage("Please enter valid email")
    .custom((value, {req}) => {
        return userModel.findOne({email: value})
        .then(user => {
            if (user) {
                return Promise.reject('User already exist with is email')
            }
        })
    }),
    body(
        "password",
        "Password should be of length 5 charecter"
        ).isLength({min: 5}),
    body(
        "confirm_password",
        "Password should be of length 5 charecter"
        )
        .isLength({min: 5})
        .custom((value, {req}) => {
            if(value !== req.body.password){
                throw new Error("Confirm Password have to be matched")
            }
            return true;
        })
],
authCtrl.postSignup)

router.get('/forget-password', guestMiddleware, authCtrl.getForgetPassword)

router.post('/forget-password',
[
    body("email")
    .isEmail()
    .withMessage("Please enter valid email")
    .custom((value, {req}) => {
        return userModel.findOne({email: value})
        .then(user => {
            if(!user) {
                return Promise.reject("User is not found with this email")
            }
        }) 
    })
],
authCtrl.postForgetPassword)

router.get('/reset-password/:token', guestMiddleware, authCtrl.getResetPassword)

router.post('/reset-password', guestMiddleware,
[
    body(
        "password",
        "Password should be of length 5 charecter"
        ).isLength({min: 5}),
    body(
        "confirm_password",
        "Password should be of length 5 charecter"
        )
        .isLength({min: 5})
        .custom((value, {req}) => {
            if(value !== req.body.password){
                throw new Error("Confirm Password have to be matched")
            }
            return true;
        })
],
authCtrl.postResetPassword)

router.post('/logout', authMiddleware, authCtrl.postLogout)

module.exports = router