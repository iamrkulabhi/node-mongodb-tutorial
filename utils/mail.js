const nodemailer = require("nodemailer")
const sgTransport = require("nodemailer-sendgrid-transport")


const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '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';

const options = {
    auth: {
        api_key: SENDGRID_API_KEY
    }
}

module.exports = nodemailer.createTransport(sgTransport(options));

