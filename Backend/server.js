const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const tokenRouter = require("./routes/token.routes.js");
const transactionRouter = require("./routes/transaction.routes.js");
const liquidityPoolRouter = require("./routes/liquiditypool.routes.js");
const userRouter = require("./routes/user.routes.js");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send("hello");
});

app.use("/api/token", tokenRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/liquidityPool", liquidityPoolRouter);
app.use("/api/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});

