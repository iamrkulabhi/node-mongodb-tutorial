const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { validationResult } = require("express-validator")

const userModel = require("../models/user")
const mailer = require("../utils/mail")

const salt = bcrypt.genSaltSync(12)

exports.getLogin = (req, res, next) => {
    let errorMsg = req.flash('error')
    if(errorMsg.length > 0) {
        errorMsg = errorMsg[0]
    } else {
        errorMsg = null
    }
    res.render('auth/login', {
        title: 'Login',
        actionUrl: '/login',
        errorMsg: errorMsg,
        oldValues: { name: '', email: ''},
        validationErrors: []
    })
}

exports.postLogin = (req, res, next) => {
    const _email = req.body.email
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        //console.log(errors.array())
        return res.status(422).render('auth/login', {
            title: 'Login',
            actionUrl: '/login',
            errorMsg: errors.array()[0].msg,
            oldValues: { email: _email},
            validationErrors: errors.array()
        })
    }

    userModel.findOne({email: _email})
    .then(user => {
        req.session.loggedIn = true
        req.session.user = user
        req.session.save(err => {
            res.redirect("/admin")
        })
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

exports.getSignup = (req, res, next) => {
    let errorMsg = req.flash('error')
    if(errorMsg.length > 0) {
        errorMsg = errorMsg[0]
    } else {
        errorMsg = null
    }

    res.render('auth/signup', {
        title: 'Sign Up',
        actionUrl: '/signup',
        errorMsg: errorMsg,
        oldValues: { name: '', email: ''},
        validationErrors: []
    })
}

exports.postSignup = (req, res, next) => {
    const _name = req.body.name
    const _email = req.body.email
    const _password = req.body.password

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        //console.log(errors.array())
        return res.status(422).render('auth/signup', {
            title: 'Sign Up',
            actionUrl: '/signup',
            errorMsg: errors.array()[0].msg,
            oldValues: { name: _name, email: _email},
            validationErrors: errors.array()
        })
    }
    const hash = bcrypt.hashSync(_password, salt)
    const newUser = new userModel({
        name: _name,
        email: _email,
        password: hash
    })
    newUser.save()
    .then(result => {
        res.redirect('/login')
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        }
        res.redirect("/login")
    })
}

exports.getForgetPassword = (req, res, next) => {
    let errorMsg = req.flash('error')
    if(errorMsg.length > 0) {
        errorMsg = errorMsg[0]
    } else {
        errorMsg = null
    }

    res.render('auth/forget-password', {
        title: 'Forget Password',
        actionUrl: '/forget-password',
        errorMsg: errorMsg,
        oldValues: { email: ''},
        validationErrors: []
    })
}

exports.postForgetPassword = (req, res, next) => {
    const _email = req.body.email
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        //console.log(errors.array())
        return res.status(422).render('auth/forget-password', {
            title: 'Forget Password',
            actionUrl: '/forget-password',
            errorMsg: errors.array()[0].msg,
            oldValues: { email: _email},
            validationErrors: errors.array()
        })
    }

    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            req.flash('error', 'Something wrong, please try again')
            return res.redirect("/forget-password")
        }
        const token = buffer.toString('hex')
        userModel.findOne({email: req.body.email})
        .then(user => {
            user.token = token
            user.tokenExpire = Date.now()+3600000
            return user.save()
        })
        .then(result => {
            //res.redirect("/login")
            const emailOption = {
                to: [req.body.email],
                from: 'rahul.kulabhi@codeclouds.in',
                subject: 'Forget password request',
                html: `<h3>Want to Reset password?</h3><p>To reset password <a href="https://node-mongo-tutorial.herokuapp.com/reset-password/${token}">click here</a> to proceed.</p>`
            }
            mailer.sendMail(emailOption, (err, data) => {
                if (err) {
                    console.log(err)
                    req.flash('error', 'Something wrong while sending verification email')
                    return res.redirect("/forget-password")
                }
                console.log(data)
                res.redirect("/login")
            })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        })
    })
}

exports.getResetPassword = (req, res, next) => {
    const token = req.params.token
    //console.log(token)
    
    userModel.findOne({
        token: token,
        tokenExpire: {$gt: Date.now()}
    })
    .then(user => {
        if(!user){
            req.flash('error', `${token} is not valid`)
            return res.redirect("/forget-password/")
        }
        let errorMsg = req.flash('error')
        if(errorMsg.length > 0) {
            errorMsg = errorMsg[0]
        } else {
            errorMsg = null
        }
    
        res.render('auth/reset-password', {
            title: 'Reset Password',
            actionUrl: '/reset-password',
            errorMsg: errorMsg,
            userId: user._id,
            token: token,
            oldValues: {},
            validationErrors: []
        })
    })
}

exports.postResetPassword = (req, res, next) => {
    const userId = req.body.userId
    const token = req.body.token
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        //console.log(errors.array())
        return res.status(422).render('auth/reset-password', {
            title: 'Reset Password',
            actionUrl: '/reset-password',
            errorMsg: errors.array()[0].msg,
            userId: userId,
            token: token,
            oldValues: {},
            validationErrors: []
        })
    }

    userModel.findOne({
        token: token,
        tokenExpire: {$gt: Date.now()},
        _id: userId
    })
    .then(user => {
        if (!user) {
            req.flash('error', 'Something wrong, please try again')
            return res.redirect("/reset-password/" + token)
        }
        const hash = bcrypt.hashSync(req.body.password, salt)
        user.password = hash
        user.token = ''
        return user.save()
    })
    .then(result => {
        res.redirect("/login")
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

