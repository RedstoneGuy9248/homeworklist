const express = require("express");
const app = express();
const pool = require("./db.js");
const dbApiRoute = require("./routes/dbApi.js")(pool);
const expressLayouts = require("express-ejs-layouts");

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static("static"))

app.use("/api/v1/db", dbApiRoute);

app.get("/", (req, res) => {
    let limit; let page; let id;
    if (req.query.limit) {limit = parseInt(req.query.limit)} else {limit = "";}
    if (req.query.page) {page = parseInt(req.query.page)} else {page = "";}
    if (req.query.id) {id = parseInt(req.query.id)} else {id = "";}
    res.render("index", {limit, page, id})
});
app.get("/edit/:id", (req, res) => {
    res.render("edit", {id: req.params.id});
});

app.get("/edit", (req, res) => {
    res.redirect("/");
});

app.get("/insert", (req, res) => {res.redirect("/insert.html")});
app.get("/filter", (req, res) => {
    if (req.query.limit) {limit = parseInt(req.query.limit)} else {limit = "10";}
    if (req.query.page) {page = parseInt(req.query.page)} else {page = "1";}
    if (req.query.id) {id = parseInt(req.query.id)} else {id = "";}
    res.render("filter", {limit, page, id});
});
// LISTEN
app.listen(5000, () => {console.log("http://localhost:5000")})