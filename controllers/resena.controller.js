const { checkUser } = require('../middleware/check-user');

module.exports = (app, db) => {
    const getReservationEndDate = (horario) => new Date(`${horario.fecha}T${horario.hora_fin}`);

    const hasPastConfirmedReservation = async (usuarioId, canchaId) => {
        const reservas = await db.reserva.findAll({
            where: {
                usuario_id: usuarioId,
                estado: 'confirmada',
            },
            include: [
                {
                    model: db.horario,
                    as: 'horario',
                    where: { cancha_id: canchaId },
                },
            ],
        });

        return reservas.some((reserva) => getReservationEndDate(reserva.horario) < new Date());
    };

    const canCreateReview = async (usuarioId, canchaId) => {
        const hasReservation = await hasPastConfirmedReservation(usuarioId, canchaId);
        if (!hasReservation) {
            return {
                allowed: false,
                error: 'Solo puedes reseñar una cancha cuando ya paso una reserva confirmada tuya',
            };
        }

        const existingReview = await db.resena.findOne({
            where: {
                usuario_id: usuarioId,
                cancha_id: canchaId,
            },
        });

        if (existingReview) {
            return {
                allowed: false,
                error: 'Ya dejaste una reseña para esta cancha',
            };
        }

        return { allowed: true };
    };

    app.get('/resenas', checkUser, async (req, res) => {
        const resenas = await db.resena.findAll({
            include: [
                {
                    model: db.usuario,
                    as: 'usuario',
                },
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
            order: [['createdAt', 'DESC']],
        });

        res.render('resenas/index', {
            resenas,
            currentUser: req.session.user,
            success: req.query.success || null,
            error: req.query.error || null,
        });
    });

    app.get('/resenas/nueva/:canchaId', checkUser, async (req, res) => {
        if (req.session.user.rol !== 'cliente') {
            return res.redirect('/resenas?error=Solo los clientes pueden dejar reseñas');
        }

        const canchaId = Number.parseInt(req.params.canchaId, 10);
        const cancha = await db.cancha.findByPk(canchaId, {
            include: [
                {
                    model: db.tipoCancha,
                    as: 'tipoCancha',
                },
            ],
        });

        if (!cancha) {
            return res.redirect('/resenas?error=La cancha seleccionada no existe');
        }

        const permission = await canCreateReview(req.session.user.id, cancha.id);
        if (!permission.allowed) {
            return res.redirect(`/reservas?error=${permission.error}`);
        }

        res.render('resenas/form', {
            cancha,
            resena: {
                calificacion: '',
                comentario: '',
            },
            error: null,
            formAction: `/resenas/${cancha.id}`,
            currentUser: req.session.user,
        });
    });

    app.post('/resenas/:canchaId', checkUser, async (req, res) => {
        if (req.session.user.rol !== 'cliente') {
            return res.redirect('/resenas?error=Solo los clientes pueden dejar reseñas');
        }

        const canchaId = Number.parseInt(req.params.canchaId, 10);
        const cancha = await db.cancha.findByPk(canchaId, {
            include: [
                {
                    model: db.tipoCancha,
                    as: 'tipoCancha',
                },
            ],
        });

        if (!cancha) {
            return res.redirect('/resenas?error=La cancha seleccionada no existe');
        }

        const calificacion = Number.parseInt(req.body.calificacion, 10);
        const comentario = req.body.comentario ? req.body.comentario.trim() : '';

        if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
            return res.render('resenas/form', {
                cancha,
                resena: {
                    calificacion: req.body.calificacion || '',
                    comentario,
                },
                error: 'La calificacion debe estar entre 1 y 5',
                formAction: `/resenas/${cancha.id}`,
                currentUser: req.session.user,
            });
        }

        const permission = await canCreateReview(req.session.user.id, cancha.id);
        if (!permission.allowed) {
            return res.redirect(`/reservas?error=${permission.error}`);
        }

        await db.resena.create({
            usuario_id: req.session.user.id,
            cancha_id: cancha.id,
            calificacion,
            comentario,
        });

        return res.redirect('/resenas?success=Reseña creada correctamente');
    });
};
