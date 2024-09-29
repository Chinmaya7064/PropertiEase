if(process.env.NODE_ENV != "production") {
    require("dotenv").config(); 
}

// console.log(process.env.SECRET);

const express = require("express")
const app = express()
const mongoose = require("mongoose")
const path = require("path")
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate")
const expressError = require("./utils/expressError.js")
const session = require("express-session")
const MongoStore = require('connect-mongo');
const flash = require("connect-flash")
const passport = require("passport")
const LocalStratergy = require("passport-local")
const User = require("./models/user.js")


//Routers
const listingRouter = require("./routes/listing.js")
const reviewRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")

//mongoDB Atlas connection 
const dbUrl = process.env.ATLASDB_URL

//Databas connection
main().then(()=> {
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
})

async function main() {
    await mongoose.connect(dbUrl)
}


app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.urlencoded({extended: true}))
app.use(methodOverride("_method"))
app.engine('ejs', ejsMate)
app.use(express.static(path.join(__dirname, "/public")))

//Mongo session store
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
})

store.on("error", () => {
    console.log("Error in Mongo Session Store", err)
})

//cookie session
const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    },
};



//Home route
// app.get("/", (req, res) => {
//     res.send('Hi, I am root');
// })     



//passport authentication
app.use(session(sessionOptions))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStratergy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

//flash message
app.use((req, res, next) => {
    res.locals.success =  req.flash("success")
    res.locals.error =  req.flash("error" )
    res.locals.currUser = req.user;
    next();
})



//routes
app.use("/listings", listingRouter)
app.use("/listings/:id/reviews", reviewRouter)
app.use("/", userRouter)



app.all("*", (req, res, next) => {
    next(new expressError(404, "Page not found!"))
})

//handling Error
app.use((err, req, res, next) => {
    let {statusCode = 500, message="Something went wrong!"} = err;
    res.status(statusCode).render('error.ejs', {message})
    // res.status(statusCode).send(message)
})


app.listen(80, () => {
    console.log("server is listening on port 80")
})