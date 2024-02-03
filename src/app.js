const express = require('express');
const homeController = require('./controllers/homeController');
const configViewEngine = require('./config/viewEngine');
const path = require('path');

const app = express();

const bodyP=require("body-parser");
const port = 8080;

app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, 'src', 'public')));

configViewEngine(app);

app.get('/', homeController.getHomePage);

app.get('/user/:idUser', homeController.getDetailUser);

app.post("/read-data", homeController.readData);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});