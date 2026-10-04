const express = require("express");

const router = express.Router();

const {
  generatePPT
} = require("../controllers/pptController");

router.post("/generate", generatePPT);

module.exports = router;