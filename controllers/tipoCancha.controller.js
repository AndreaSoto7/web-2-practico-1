const { checkUser, isAdmin } = require('../middleware/check-user');

module.exports = (app, db) => {
    const parseTipoCanchaPayload = (body) => ({
        nombre: body.nombre ? body.nombre.trim() : '',
    });

    const validateTipoCanchaPayload = async (payload, currentId = null) => {
        if (!payload.nombre) {
            return 'El nombre es obligatorio';
        }

        const existingTipoCancha = await db.tipoCancha.findOne({
            where: { nombre: payload.nombre },
        });

        if (existingTipoCancha && existingTipoCancha.id !== currentId) {
            return 'Ya existe un tipo de cancha con ese nombre';
        }

        return null;
    };

    app.get('/tipos-cancha', checkUser, isAdmin, async (req, res) => {
        const tiposCancha = await db.tipoCancha.findAll({
            include: [
                {
                    model: db.cancha,
                    as: 'canchas',
                },
            ],
            order: [['nombre', 'ASC']],
        });

        res.render('tipos-cancha/index', {
            tiposCancha,
            currentUser: req.session.user,
            success: req.query.success || null,
            error: req.query.error || null,
        });
    });

    app.get('/tipos-cancha/nuevo', checkUser, isAdmin, (req, res) => {
        res.render('tipos-cancha/form', {
            tipoCancha: { nombre: '' },
            error: null,
            formAction: '/tipos-cancha',
            title: 'Nuevo tipo de cancha',
            submitLabel: 'Crear tipo de cancha',
            currentUser: req.session.user,
        });
    });

    app.post('/tipos-cancha', checkUser, isAdmin, async (req, res) => {
        const tipoCanchaPayload = parseTipoCanchaPayload(req.body);
        const validationError = await validateTipoCanchaPayload(tipoCanchaPayload);

        if (validationError) {
            return res.render('tipos-cancha/form', {
                tipoCancha: tipoCanchaPayload,
                error: validationError,
                formAction: '/tipos-cancha',
                title: 'Nuevo tipo de cancha',
                submitLabel: 'Crear tipo de cancha',
                currentUser: req.session.user,
            });
        }

        await db.tipoCancha.create(tipoCanchaPayload);
        return res.redirect('/tipos-cancha?success=Tipo de cancha creado correctamente');
    });

    app.get('/tipos-cancha/:id/editar', checkUser, isAdmin, async (req, res) => {
        const tipoCancha = await db.tipoCancha.findByPk(req.params.id);

        if (!tipoCancha) {
            return res.redirect('/tipos-cancha?error=El tipo de cancha solicitado no existe');
        }

        res.render('tipos-cancha/form', {
            tipoCancha,
            error: null,
            formAction: `/tipos-cancha/${tipoCancha.id}`,
            title: 'Editar tipo de cancha',
            submitLabel: 'Guardar cambios',
            currentUser: req.session.user,
        });
    });

    app.post('/tipos-cancha/:id', checkUser, isAdmin, async (req, res) => {
        const tipoCancha = await db.tipoCancha.findByPk(req.params.id);

        if (!tipoCancha) {
            return res.redirect('/tipos-cancha?error=El tipo de cancha solicitado no existe');
        }

        const tipoCanchaPayload = parseTipoCanchaPayload(req.body);
        const validationError = await validateTipoCanchaPayload(tipoCanchaPayload, tipoCancha.id);

        if (validationError) {
            return res.render('tipos-cancha/form', {
                tipoCancha: {
                    ...tipoCanchaPayload,
                    id: tipoCancha.id,
                },
                error: validationError,
                formAction: `/tipos-cancha/${tipoCancha.id}`,
                title: 'Editar tipo de cancha',
                submitLabel: 'Guardar cambios',
                currentUser: req.session.user,
            });
        }

        await tipoCancha.update(tipoCanchaPayload);
        return res.redirect('/tipos-cancha?success=Tipo de cancha actualizado correctamente');
    });

    app.post('/tipos-cancha/:id/eliminar', checkUser, isAdmin, async (req, res) => {
        const tipoCancha = await db.tipoCancha.findByPk(req.params.id, {
            include: [
                {
                    model: db.cancha,
                    as: 'canchas',
                },
            ],
        });

        if (!tipoCancha) {
            return res.redirect('/tipos-cancha?error=El tipo de cancha solicitado no existe');
        }

        if (tipoCancha.canchas.length > 0) {
            return res.redirect('/tipos-cancha?error=No puedes eliminar un tipo de cancha con canchas asociadas');
        }

        await tipoCancha.destroy();
        return res.redirect('/tipos-cancha?success=Tipo de cancha eliminado correctamente');
    });
};
