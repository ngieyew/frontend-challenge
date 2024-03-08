// DO NOT MODIFY THIS FILE
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const fs = require("fs");
const multer = require("multer");

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw({ type: "text/plain", limit: "10mb" }));

const upload = multer({ storage: multer.memoryStorage() });

let haikuHistory = [
  "Unknown topics bloom, \n Like flowers in dense fog— \n Hidden, out of reach.",
  "Words not meant to fly, \n Like leaves in a quiet stream— \n Drift away, untouched.",
  "Thirty-two muscles, \n Whisper of leaves in the wind— \n Cat's ears dance softly.",
  "Morning dew asks, soft: \n Coffee's warmth or tea's calm light? \n Day's first silent choice.",
  "Brief as a raindrop, \n War's shadow, morning mist— \n Zanzibar's swift peace.",
  "Questions for the past, \n Dinner under timeless stars— \n Whispers through the ages.",
];

const generateHaiku = () => {
  const randomIndex = Math.floor(Math.random() * haikuHistory.length);

  return {
    text: haikuHistory[randomIndex],
  };
};

app.get("/api/ping", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/update", (req, res) => {
  haikuHistory.push(req.body.text);
  res.status(200).json({ status: "success" });
});

app.get("/api/history", (req, res) => {
  res.status(200).json(haikuHistory);
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  if (req.file.mimetype === "text/plain") {
    const fileContent = req.file.buffer.toString("utf-8");
    haikuHistory.push(fileContent);

    res.status(200).json({ status: "success" });
  } else {
    res.status(400).send("Unsupported file type");
  }
});

app.get("/api/converse", (req, res) => {
  if (Math.random() < 0.5) {
    return res.status(500).send("Server error");
  }

  const sendResponse = () => {
    const chatData = generateHaiku(req.body.userMessage);
    res.json(chatData);
  };

  if (Math.random() < 0.5) {
    setTimeout(sendResponse, 5000);
  } else {
    sendResponse();
  }
});

console.log("App is listening on port " + port);

app.listen(port, () => {
  console.log("App is listening on port " + port);
});
