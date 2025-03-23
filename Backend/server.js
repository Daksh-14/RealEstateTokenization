const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const tokenRouter = require("./routes/token.routes.js");
const transactionRouter = require("./routes/transaction.routes.js");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});

app.use("/api/token",tokenRouter);
app.use("/api/transaction",transactionRouter);

