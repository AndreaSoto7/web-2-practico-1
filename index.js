const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const db = require('./models');
const session = require('express-session');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));

//app.use(express.json());

app.use(session({
    secret: 'esta es la clave de encriptación de la sesión y puede ser cualquier texto',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.userId = req.session.user ? req.session.user.id : null;
    res.locals.userEmail = req.session.user ? req.session.user.email : null;
    next();
});

require('./controllers')(app, db);


db.sequelize.sync({
    
}).then(() => {
    console.log("db resync");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
