const { checkUser, isAdmin } = require('../middleware/check-user');

module.exports = (app, db) => {
    const getReservationEndDate = (horario) => new Date(`${horario.fecha}T${horario.hora_fin}`);

    const reservaInclude = [
        {
            model: db.usuario,
            as: 'usuario',
        },
        {
            model: db.horario,
            as: 'horario',
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
        },
    ];

    const updateHorarioAvailability = async (horarioId) => {
        const horario = await db.horario.findByPk(horarioId, {
            include: [
                {
                    model: db.reserva,
                    as: 'reservas',
                },
            ],
        });

        if (!horario) {
            return null;
        }

        const hasConfirmedReservation = horario.reservas.some((reserva) => reserva.estado === 'confirmada');
        await horario.update({ disponible: !hasConfirmedReservation });
        return horario;
    };

    app.get('/reservas', checkUser, async (req, res) => {
        const isCurrentAdmin = req.session.user.rol === 'admin';
        const where = {};

        if (!isCurrentAdmin) {
            where.usuario_id = req.session.user.id;
        }

        const reservas = await db.reserva.findAll({
            where,
            include: reservaInclude,
            order: [
                ['createdAt', 'DESC'],
            ],
        });

        res.render('reservas/index', {
            reservas,
            isAdmin: isCurrentAdmin,
            reviewableReservationIds: !isCurrentAdmin
                ? (await Promise.all(reservas.map(async (reserva) => {
                    if (reserva.estado !== 'confirmada' || getReservationEndDate(reserva.horario) >= new Date()) {
                        return null;
                    }

                    const existingReview = await db.resena.findOne({
                        where: {
                            usuario_id: req.session.user.id,
                            cancha_id: reserva.horario.cancha.id,
                        },
                    });

                    return existingReview ? null : reserva.id;
                }))).filter(Boolean)
                : [],
            currentUser: req.session.user,
            success: req.query.success || null,
            error: req.query.error || null,
        });
    });

    app.post('/reservas', checkUser, async (req, res) => {
        if (req.session.user.rol !== 'cliente') {
            return res.redirect('/reservas?error=Solo los clientes pueden crear reservas');
        }

        const horarioId = Number.parseInt(req.body.horario_id, 10);

        if (!Number.isInteger(horarioId)) {
            return res.redirect('/horarios?error=El horario seleccionado no es valido');
        }

        const horario = await db.horario.findByPk(horarioId, {
            include: [
                {
                    model: db.cancha,
                    as: 'cancha',
                },
                {
                    model: db.reserva,
                    as: 'reservas',
                },
            ],
        });

        if (!horario) {
            return res.redirect('/horarios?error=El horario seleccionado no existe');
        }

        if (!horario.disponible || horario.cancha.estado !== 'activa') {
            return res.redirect(`/horarios?fecha=${horario.fecha}&error=El horario ya no esta disponible`);
        }

        const hasConfirmedReservation = horario.reservas.some((reserva) => reserva.estado === 'confirmada');
        if (hasConfirmedReservation) {
            await updateHorarioAvailability(horario.id);
            return res.redirect(`/horarios?fecha=${horario.fecha}&error=El horario ya fue reservado`);
        }

        await db.reserva.create({
            usuario_id: req.session.user.id,
            horario_id: horario.id,
            estado: 'confirmada',
        });

        await horario.update({ disponible: false });
        return res.redirect('/reservas?success=Reserva creada correctamente');
    });

    app.post('/reservas/:id/cancelar', checkUser, async (req, res) => {
        const isCurrentAdmin = req.session.user.rol === 'admin';
        const reserva = await db.reserva.findByPk(req.params.id, {
            include: reservaInclude,
        });

        if (!reserva) {
            return res.redirect('/reservas?error=La reserva solicitada no existe');
        }

        if (!isCurrentAdmin && reserva.usuario_id !== req.session.user.id) {
            return res.redirect('/reservas?error=No tienes permiso para cancelar esta reserva');
        }

        if (reserva.estado === 'cancelada') {
            return res.redirect('/reservas?error=La reserva ya estaba cancelada');
        }

        await reserva.update({ estado: 'cancelada' });
        await updateHorarioAvailability(reserva.horario_id);
        return res.redirect('/reservas?success=Reserva cancelada correctamente');
    });

    app.post('/reservas/:id/estado', checkUser, isAdmin, async (req, res) => {
        const nuevoEstado = req.body.estado;

        if (!['confirmada', 'cancelada'].includes(nuevoEstado)) {
            return res.redirect('/reservas?error=El estado seleccionado no es valido');
        }

        const reserva = await db.reserva.findByPk(req.params.id, {
            include: reservaInclude,
        });

        if (!reserva) {
            return res.redirect('/reservas?error=La reserva solicitada no existe');
        }

        if (nuevoEstado === 'confirmada') {
            const confirmedReserva = await db.reserva.findOne({
                where: {
                    horario_id: reserva.horario_id,
                    estado: 'confirmada',
                },
            });

            if (confirmedReserva && confirmedReserva.id !== reserva.id) {
                return res.redirect('/reservas?error=Ese horario ya tiene una reserva confirmada');
            }
        }

        await reserva.update({ estado: nuevoEstado });
        await updateHorarioAvailability(reserva.horario_id);
        return res.redirect('/reservas?success=Estado de reserva actualizado correctamente');
    });
};
