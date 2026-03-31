const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const db = require('./models');
const session = require('express-session');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));


app.use(session({
    secret: 'esta es la clave de encriptación de la sesión y puede ser cualquier texto'
}));

require('./controllers')(app, db);


db.sequelize.sync({
    
}).then(() => {
    console.log("db resync");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})