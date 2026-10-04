require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

/* =====================================================
   CORS
===================================================== */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

app.use(
  cors({
    origin: function (origin, callback) {

      // Allow requests without an origin
      // such as curl/Postman
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS: Origin ${origin} not allowed`
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);

/* =====================================================
   BODY PARSER
===================================================== */

app.use(
  express.json({
    limit: "2mb"
  })
);

/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {
  res.json({
    name: "SlidesMakerIARE API",
    status: "running"
  });
});

/* =====================================================
   AUTH ROUTES
===================================================== */

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

/* =====================================================
   PRESENTATION ROUTES
===================================================== */

app.use(
  "/api/presentations",
  require("./routes/presentationRoutes")
);

/* =====================================================
   PPT ROUTES
===================================================== */

app.use(
  "/api/ppt",
  require("./routes/pptRoutes")
);

/* =====================================================
   GENERATED POWERPOINT FILES
===================================================== */

app.use(
  "/generated",
  express.static(
    path.join(__dirname, "generated")
  )
);

/* =====================================================
   SERVER
===================================================== */

const port =
  process.env.PORT || 5000;

app.listen(
  port,
  "0.0.0.0",
  () => {
    console.log(
      `SlidesMakerIARE API: http://localhost:${port}`
    );
  }
);