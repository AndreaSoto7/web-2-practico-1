const { sequelize } = require('../config/db.config');

const usuario = require('./usuario.model')(sequelize);
const tipoCancha = require('./tipoCancha.model')(sequelize);
const cancha = require('./cancha.model')(sequelize);
const horario = require('./horario.model')(sequelize);
const reserva = require('./reserva.model')(sequelize);
const resena = require('./resena.model')(sequelize);

tipoCancha.hasMany(cancha, {
    foreignKey: 'tipo_id',
    sourceKey: 'id',
    as: 'canchas',
    onDelete: 'CASCADE',
});
cancha.belongsTo(tipoCancha, {
    foreignKey: 'tipo_id',
    targetKey: 'id',
    as: 'tipoCancha',
});

cancha.hasMany(horario, {
    foreignKey: 'cancha_id',
    sourceKey: 'id',
    as: 'horarios',
    onDelete: 'CASCADE',
});
horario.belongsTo(cancha, {
    foreignKey: 'cancha_id',
    targetKey: 'id',
    as: 'cancha',
});

usuario.hasMany(reserva, {
    foreignKey: 'usuario_id',
    sourceKey: 'id',
    as: 'reservas',
    onDelete: 'CASCADE',
});
reserva.belongsTo(usuario, {
    foreignKey: 'usuario_id',
    targetKey: 'id',
    as: 'usuario',
});

horario.hasMany(reserva, {
    foreignKey: 'horario_id',
    sourceKey: 'id',
    as: 'reservas',
    onDelete: 'CASCADE',
});
reserva.belongsTo(horario, {
    foreignKey: 'horario_id',
    targetKey: 'id',
    as: 'horario',
});

usuario.hasMany(resena, {
    foreignKey: 'usuario_id',
    sourceKey: 'id',
    as: 'resenas',
    onDelete: 'CASCADE',
});
resena.belongsTo(usuario, {
    foreignKey: 'usuario_id',
    targetKey: 'id',
    as: 'usuario',
});

cancha.hasMany(resena, {
    foreignKey: 'cancha_id',
    sourceKey: 'id',
    as: 'resenas',
    onDelete: 'CASCADE',
});
resena.belongsTo(cancha, {
    foreignKey: 'cancha_id',
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