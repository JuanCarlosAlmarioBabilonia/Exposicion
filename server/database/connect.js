const mongoose = require("mongoose");

class Database {
  constructor() {
    this.connection();
  }

  connection() {
    mongoose
      .connect(
        `${process.env.MONGO_PROTOCOL}${process.env.MONGO_USER}:${process.env.MONGO_PSW}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB_NAME}`,
      )
      .then(() => {
        console.log("Conectado correctamente a la base de datos");
      })
      .catch((err) => {
        console.error("Error al conectar a la base de datos:", err.message);
      });
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new Database();
    }
    return this.instance;
  }
}

module.exports = Database;
