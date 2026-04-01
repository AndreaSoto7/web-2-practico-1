module.exports = (app, db) => {
    require('./auth.controller')(app, db);
    require('./cancha.controller')(app, db);
    require('./horario.controller')(app, db);
    require('./reserva.controller')(app, db);
    require('./resena.controller')(app, db);
    require('./tipoCancha.controller')(app, db);
};