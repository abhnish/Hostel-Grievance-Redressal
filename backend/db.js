const Pool = require("pg").Pool;

const pool = new Pool({
  user: "abhnishkumar",
  password: "",
  host: "localhost",
  port: 5432,
  database: "municipal"
});

pool.on("error", (error, client) => {
  console.log(error);
});

module.exports = {
  pool
};
