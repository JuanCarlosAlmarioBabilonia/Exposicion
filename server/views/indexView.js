const layout = require("express").Router()
const {join} = require("path")
const cookieParser = require("cookie-parser")


layout.get("/", cookieParser(), (req, res) =>{
    res.sendFile(join(__dirname, "../../src/index.html"))
})

module.exports = layout
