const { sequelize } = require('../config/db.config');

const usuario = require('./usuario.model')(sequelize);
const tipoCancha = require('./tipoCancha.model')(sequelize);
const cancha = require('./cancha.model')(sequelize);
const horario = require('./horario.model')(sequelize);
const reserva = require('./reserva.model')(sequelize);
const resena = require('./resena.model')(sequelize);

tipoCancha.hasMany(cancha, {
    foreignKey: 'tipoCanchaId',
    sourceKey: 'id',
    as: 'canchas',
    onDelete: 'CASCADE',
});

cancha.belongsTo(tipoCancha, {
    foreignKey: 'tipoCanchaId',
    targetKey: 'id',
    as: 'tipoCancha',
});

cancha.hasMany(horario, {
    foreignKey: 'canchaId',
    sourceKey: 'id',
    as: 'horarios',
    onDelete: 'CASCADE',
});

horario.belongsTo(cancha, {
    foreignKey: 'canchaId',
    targetKey: 'id',
    as: 'cancha',
});

usuario.hasMany(reserva, {
    foreignKey: 'usuarioId',
    sourceKey: 'id',
    as: 'reservas',
    onDelete: 'CASCADE',
});

reserva.belongsTo(usuario, {
    foreignKey: 'usuarioId',
    targetKey: 'id',
    as: 'usuario',
});

cancha.hasMany(reserva, {
    foreignKey: 'canchaId',
    sourceKey: 'id',
    as: 'reservas',
    onDelete: 'CASCADE',
});

reserva.belongsTo(cancha, {
    foreignKey: 'canchaId',
    targetKey: 'id',
    as: 'cancha',
});

horario.hasMany(reserva, {
    foreignKey: 'horarioId',
    sourceKey: 'id',
    as: 'reservas',
    onDelete: 'CASCADE',
});

reserva.belongsTo(horario, {
    foreignKey: 'horarioId',
    targetKey: 'id',
    as: 'horario',
});

usuario.hasMany(resena, {
    foreignKey: 'usuarioId',
    sourceKey: 'id',
    as: 'resenas',
    onDelete: 'CASCADE',
});

resena.belongsTo(usuario, {
    foreignKey: 'usuarioId',
    targetKey: 'id',
    as: 'usuario',
});

cancha.hasMany(resena, {
    foreignKey: 'canchaId',
    sourceKey: 'id',
    as: 'resenas',
    onDelete: 'CASCADE',
});

resena.belongsTo(cancha, {
    foreignKey: 'canchaId',
    targetKey: 'id',
    as: 'cancha',
});


module.exports = {
    usuario,
    tipoCancha,
    cancha,
    horario,
    reserva,
    resena,
    sequelize,
};