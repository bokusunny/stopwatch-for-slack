const express = require("express");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

const authentication = () => {
  return (req, res, next) => {
    const err = "error";
    req.body.token === process.env.TOKEN ? next() : next(err);
  };
};

const commands = { top: "/ti", start: "/ti start", stop: "/ti stop" };

app.post(process.env.URL, authentication(), async (req, res) => {
  const values = [req.body.user_id];
  switch (req.body.text) {
    case "start":
      const query =
        "INSERT INTO logs(user_id) VALUES ($1) RETURNING created_at";
      try {
        const client = await pool.connect();
        const result = await client.query(query, values);
        res.json({
          text: "Gotcha! The stopwatch was started."
        });
      } catch (err) {
        res.json({
          text: "Application Error! Please Contact @Yuta_Tsurusaki"
        });
      }
      break;
    case "stop":
      const querySelect = "SELECT created_at FROM logs WHERE user_id = ($1)";
      try {
        const client = await pool.connect();
        const result = await client.query(querySelect, values);
        const startTime = Date.parse(result.rows.pop().created_at);
        const currentTime = Date.now();
        const elapsedMin = Math.floor((currentTime - startTime) / 60000);
        res.json({
          text: "Good Job!",
          attachments: [
            {
              text: `${elapsedMin}min`
            }
          ]
        });
        const queryDelete = "DELETE FROM logs WHERE user_id = ($1)";
        client.query(queryDelete, values);
      } catch (err) {
        res.json({
          text:
            "Sorry, we dont have your records. You can start the stopwatch with the following command.",
          attachments: [
            {
              text: commands.top
            }
          ]
        });
      }
      break;
    default:
      res.json({
        text: "Hi!",
        attachments: [
          {
            fields: [
              {
                title: commands.top,
                value: "Show help (this message)"
              },
              {
                title: commands.start,
                value: "Start Stopwatch"
              },
              {
                title: commands.stop,
                value: "Stop Stopwatch"
              }
            ]
          }
        ]
      });
  }
});

app.listen(port);
