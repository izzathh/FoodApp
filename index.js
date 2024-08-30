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
const { authenticationToken } = require("./middlewares/authCheck");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { initializeWebSocketServer } = require("./websocket");
const Admins = require('./models/admin.model');
const { firestore } = require('./firebase');
const { listenForFirebase } = require("./firebase/snapshots");
require('./services/constants')

app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true
}

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

initializeWebSocketServer(server);
app.use("/images/uploads/", express.static(__dirname + "/uploads/"));
app.use("/fonts/", express.static(__dirname + "/fonts/"));

app.use(express.json());

app.use(mongoSanitize({ dryRun: true }));

connectToDB();
listenForFirebase();

app.use((req, res, next) => {
  console.log(req.url);
  next();
});

app.get("/api/v1/home", (req, res) => {
  res.send("Hello 👋🏻, I am from food app backend!");
});

app.get('/api/data', async (req, res) => {
  const snapshot = await firestore.collection('order-delivery-status').get();
  const data = snapshot.docs.map(doc => doc.data());
  res.send(data);
});

app.get("/api/v1/admin-actions/check-auth", authenticationToken, async (req, res) => {
  const checkAdmin = await Admins.findById(req.user.id);
  if (!checkAdmin) return res.sendStatus(404);
  res.sendStatus(200);
});

app.use("/api/v1/user-actions", userRoutes);
app.use("/api/v1/user-actions", orderRoutes);

app.use("/api/v1/admin-actions", adminRoutes);
app.use("/api/v1/admin-actions", orderRoutes);
app.use("/api/v1/admin-actions", deliveryPeopleRoutes);

app.use("/api/v1/dp-actions", deliveryPeopleRoutes);

app.use(handleErrors);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});