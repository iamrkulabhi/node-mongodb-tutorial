const mongoose = require("mongoose")

const Schema = mongoose.Schema

const profileSchema = new Schema({
    gender: {
        type: String
    },
    imageUrl: {
        type: String
    },
    dob: {
        type: Date
    }
}, {timestamps: true})

module.exports = mongoose.model('Profile', profileSchema)

