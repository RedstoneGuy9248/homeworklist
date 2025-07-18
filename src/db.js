const mariadb = require("mariadb");
const pool = mariadb.createPool({
    host: "db",
    port: 3306,
    user: "root",
    password: process.env.DBPASSWD,
    database: process.env.DBNAME,
    connectionLimit: 5
});
module.exports = pool;