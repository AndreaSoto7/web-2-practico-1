const { Op } = require('sequelize');
const { checkUser, isAdmin } = require('../middleware/check-user');

module.exports = (app, db) => {
    const getToday = () => new Date().toISOString().split('T')[0];

    const loadCanchas = async (onlyActive = false) => db.cancha.findAll({
        where: onlyActive ? { estado: 'activa' } : undefined,
        include: [
            {
                model: db.tipoCancha,
                as: 'tipoCancha',
            },
        ],
        order: [['nombre', 'ASC']],
    });

    const parseHorarioPayload = (body) => ({
        cancha_id: Number.parseInt(body.cancha_id, 10),
        fecha: body.fecha ? body.fecha.trim() : '',
        hora_inicio: body.hora_inicio ? body.hora_inicio.trim() : '',
        hora_fin: body.hora_fin ? body.hora_fin.trim() : '',
        disponible: body.disponible === 'false' ? false : true,
    });

    const validateHorarioPayload = async (payload, currentId = null) => {
        if (!Number.isInteger(payload.cancha_id)) {
            return 'Debes seleccionar una cancha valida';
        }

        const cancha = await db.cancha.findByPk(payload.cancha_id);
        if (!cancha) {
            return 'La cancha seleccionada no existe';
        }

        if (!payload.fecha) {
            return 'La fecha es obligatoria';
        }

        if (!payload.hora_inicio || !payload.hora_fin) {
            return 'Debes indicar la hora de inicio y fin';
        }

        if (payload.hora_inicio >= payload.hora_fin) {
            return 'La hora de inicio debe ser menor a la hora de fin';
        }

        const where = {
            cancha_id: payload.cancha_id,
            fecha: payload.fecha,
            [Op.and]: [
                { hora_inicio: { [Op.lt]: payload.hora_fin } },
                { hora_fin: { [Op.gt]: payload.hora_inicio } },
            ],
        };

        if (currentId) {
            where.id = { [Op.ne]: currentId };
        }

        const overlappingHorario = await db.horario.findOne({ where });

        if (overlappingHorario) {
            return 'Ya existe un horario que se cruza con ese rango';
        }

        return null;
    };

    app.get('/horarios', checkUser, async (req, res) => {
        const fecha = req.query.fecha || getToday();
        const canchaId = req.query.cancha_id ? Number.parseInt(req.query.cancha_id, 10) : null;
        const isCurrentAdmin = req.session.user.rol === 'admin';

        const canchas = await loadCanchas(!isCurrentAdmin);
        const where = { fecha };

        if (Number.isInteger(canchaId)) {
            where.cancha_id = canchaId;
        }

        if (!isCurrentAdmin) {
            where.disponible = true;
        }

        const horarios = await db.horario.findAll({
            where,
            include: [
                {
                    model: db.cancha,
                    as: 'cancha',
                    include: [
                        {
                            model: db.tipoCancha,
                            as: 'tipoCancha',
                        },
                    ],
                },
            ],
            order: [
                [{ model: db.cancha, as: 'cancha' }, 'nombre', 'ASC'],
                ['hora_inicio', 'ASC'],
            ],
        });

        res.render('horarios/index', {
            horarios,
            canchas,
            filters: {
                fecha,
                cancha_id: Number.isInteger(canchaId) ? canchaId : '',
            },
            isAdmin: isCurrentAdmin,
            currentUser: req.session.user,
            success: req.query.success || null,
            error: req.query.error || null,
        });
    });

    app.get('/horarios/nuevo', checkUser, isAdmin, async (req, res) => {
        const canchas = await loadCanchas();

        res.render('horarios/form', {
            horario: {
                cancha_id: '',
                fecha: getToday(),
                hora_inicio: '',
                hora_fin: '',
                disponible: true,
            },
            canchas,
            error: null,
            formAction: '/horarios',
            title: 'Nuevo horario',
            submitLabel: 'Crear horario',
            currentUser: req.session.user,
        });
    });

    app.post('/horarios', checkUser, isAdmin, async (req, res) => {
        const horarioPayload = parseHorarioPayload(req.body);
        const canchas = await loadCanchas();
        const validationError = await validateHorarioPayload(horarioPayload);

        if (validationError) {
            return res.render('horarios/form', {
                horario: horarioPayload,
                canchas,
                error: validationError,
                formAction: '/horarios',
                title: 'Nuevo horario',
                submitLabel: 'Crear horario',
                currentUser: req.session.user,
            });
        }

        await db.horario.create(horarioPayload);
        return res.redirect(`/horarios?fecha=${horarioPayload.fecha}&success=Horario creado correctamente`);
    });

    app.post('/horarios/:id/eliminar', checkUser, isAdmin, async (req, res) => {
        const horario = await db.horario.findByPk(req.params.id, {
            include: [
                {
                    model: db.reserva,
                    as: 'reservas',
                },
            ],
        });

        if (!horario) {
            return res.redirect('/horarios?error=El horario solicitado no existe');
        }

        const hasActiveReservations = horario.reservas.some((reserva) => reserva.estado === 'confirmada');
        if (hasActiveReservations) {
            return res.redirect(`/horarios?fecha=${horario.fecha}&error=No puedes eliminar un horario con reservas confirmadas`);
        }

        await horario.destroy();
        return res.redirect(`/horarios?fecha=${horario.fecha}&success=Horario eliminado correctamente`);
    });
};
