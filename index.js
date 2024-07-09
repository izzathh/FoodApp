require("dotenv").config();
const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const connectToDB = require("./db/db.connections");
const userRoutes = require("./routes/user.router");
const orderRoutes = require("./routes/orders.router");
const deliveryPeopleRoutes = require("./routes/deliveryPeople.router")
const adminRoutes = require("./routes/admin.router");
const handleErrors = require("./middlewares/handleErrors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const { initializeWebSocketServer } = require("./websocket");
const Admins = require('./models/admin.model')

initializeWebSocketServer(server);

app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
}

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

app.use("/images/uploads/", express.static(__dirname + "/uploads/"));
app.use("/fonts/", express.static(__dirname + "/fonts/"));

app.use(express.json());

app.use(mongoSanitize({ dryRun: true }));

connectToDB();

app.use((req, res, next) => {
  console.log(req.url);
  next();
});

app.post("/api/v1/home", (req, res) => {
  res.send("Hello 👋🏻, I am from MyStore backend!");
});

const authenticationToken = (req, res, next) => {
  const token = req.cookies['auth_token'];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('err:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

app.get("/admin-actions/check-auth", authenticationToken, async (req, res) => {
  const checkAdmin = await Admins.findById(req.user.id);
  if (!checkAdmin) return res.sendStatus(404);
  res.sendStatus(200);
});

app.use("/user-actions", userRoutes);
app.use("/user-actions", orderRoutes);

app.use("/admin-actions", adminRoutes);
app.use("/admin-actions", orderRoutes);

app.use("/dp-actions", deliveryPeopleRoutes);

app.use(handleErrors);

const PORT = process.env.PORT || 4000;


server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});