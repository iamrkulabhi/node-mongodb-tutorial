const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const csrf = require("csurf")
const mongoose = require("mongoose")
const session = require("express-session")
const mongoDbStore = require("connect-mongodb-session")(session)
const flash = require("connect-flash")
const multer = require("multer")
const helmet = require("helmet")
const compression = require("compression")
const morgan = require("morgan")
const fs = require("fs")
const https = require("https")

const authRoutes = require("./routes/auth")
const adminRoutes = require("./routes/admin")
const userModel = require("./models/user")

const app = express()
const APP_PORT = process.env.PORT || 3000
const sessionSecret = process.env.SESSION_SECRET || 't388qpcwvw85vwv5s55yrgz7q1nxxwfu'
const username = process.env.dbusername || "rahulkulabhi"
const password = process.env.dbpassword || "p1tmOEO5vhIqVQ2e"
const database = process.env.dbname || "test"
const mongoURL = `mongodb+srv://${username}:${password}@cluster0.icvf0.mongodb.net/${database}?retryWrites=true&w=majority`
const APP_NAME = process.env.APP_NAME || 'MY APP'
const store = new mongoDbStore({
    uri: mongoURL,
    collection: 'sessions'
})
const fileStore = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    }
})
const imageFileFilter = (req, file, cb) => {
    if(
        file.mimetype == 'image/png' ||
        file.mimetype == 'image/jpg' ||
        file.mimetype == 'image/jpeg'
    ){
        req.errorOnImageUpload = false
        cb(null, true)
    } else {
        req.errorOnImageUpload = true
        cb(null, false)
    }
}

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})

// const privateKey = fs.readFileSync('server.key')
// const certificate = fs.readFileSync('server.cert')

// setting views
app.set('view engine', 'ejs')
app.set('views', 'views')

//define middlewares
app.use(helmet())
app.use(compression())
app.use(morgan('combined', {stream: accessLogStream}))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(multer({storage: fileStore, fileFilter: imageFileFilter}).single('image'))
app.use(express.static(path.join(__dirname, 'public')))
app.use('/upload', express.static(path.join(__dirname, 'upload')))
app.use(session({secret: sessionSecret, store: store, resave: false, saveUninitialized: false}))
app.use(flash())
app.use(csrf())
app.use((req, res, next) => {
    res.locals.isUserLoggedIn = req.session.loggedIn
    res.locals.csfrToken = req.csrfToken()
    res.locals.appName = APP_NAME
    next()
})
app.use((req, res, next) => {
    if (!req.session.user) {
        return next()
    }
    userModel.findById(req.session.user._id)
    .then(user => {
        if(!user) {
            return next()
        }
        req.user = user
        next()
    })
    .catch(err => {
        next(new Error(err))
    })
})

// define routers
app.use(authRoutes)
app.use('/admin', adminRoutes)

// exception and page-not-found handling
app.get("/500", (req, res, next) => {
    res.send("Something wrong.") // handle all exception
})
app.get((req, res, next) => { res.send("404 page") })
app.use((error, req, res, next) => {
    console.log(error) // printing all exception in log
    res.redirect("/500") // redirect to 500 page
})

mongoose.connect(mongoURL, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    app.listen(APP_PORT)
    // https.createServer({key: privateKey, cert: certificate}, app).listen(APP_PORT)
    // https://node-mongo-tutorial.herokuapp.com/login
})
.catch(err => {
    console.log(err) 
})


