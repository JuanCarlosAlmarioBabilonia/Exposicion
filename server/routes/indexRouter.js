const version = require("express").Router();
const layout = require("../views/indexView")

version.use(layout)

module.exports = version