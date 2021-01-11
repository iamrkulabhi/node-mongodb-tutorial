const userModel = require("../models/user")
const profileModel = require("../models/profile")

exports.getBlank = (req, res, next) => {
    
    userModel.findOne({_id: req.user._id}).populate('profile')
    .then(user => {
        res.render("dashboard", {
            title: 'Dashboard',
            loggedInUser: user
        })
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

exports.getProfile = (req, res, next) => {
    let successMsg = req.flash('success')
    if(successMsg.length > 0) {
        successMsg = successMsg[0]
    } else {
        successMsg = null
    }
    let errorMsg = req.flash('error')
    if(errorMsg.length > 0) {
        errorMsg = errorMsg[0]
    } else {
        errorMsg = null
    }
    //console.log(req.user)
    userModel.findOne({_id: req.user._id}).populate('profile')
    .then(user => {
        res.render("profile", {
            title: 'Profile',
            actionUrl: "/admin/profile",
            loggedInUser: user,
            errorMsg: errorMsg,
            successMsg: successMsg
        })
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

exports.updateProfile = (req, res, next) => {
    //console.log(req.body)
    const _userId = req.user._id;
    const _name = req.body.name;
    const _gender = req.body.gender;
    const _dob = req.body.dob;

    let _imageUrl = ''
    if(req.errorOnImageUpload === false) {
        _imageUrl = "/" + req.file.path
    }else if(req.errorOnImageUpload === true){
        req.flash('error', 'Something wrong while uploading image')
        return res.redirect("/admin/profile")
    }
    //console.log(_imageUrl, req.errorOnImageUpload)

    userModel.findOne({_id: _userId})
    .then(user => {
        //console.log(user.profile)
        if(!user.profile) { // if user have no profile
            const newProfile = new profileModel({
                gender: _gender,
                dob: _dob,
                imageUrl: _imageUrl
            })
            newProfile.save((err, profile) => {
                if(err){
                    req.flash('error', 'Something wrong while creating profile')
                    return res.redirect("/admin/profile")
                }
                //console.log(profile)
                user.profile = profile
                return user.save()
            })
        }
        const profileId = user.profile
        profileModel.findById(profileId)
        .then(profile => {
            //console.log(profile, _gender, _dob)
            profile.gender = _gender
            profile.dob = _dob
            if(_imageUrl != '')
                profile.imageUrl = _imageUrl
            return profile.save()
        })
    })
    .then(result => {
        req.flash('success', 'Profile updated!')
        res.redirect("/admin/profile")
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}


