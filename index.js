const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
var cors = require('cors')
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())

//Variables del entorno
dotenv.config({ path: './env/.env' });

//Setear cookies
//app.use(cookieParser());

//llamar router
app.use('/', require('./routes/router'));

app.listen(9000, () => {
    console.log("Server runing 9000");
})