const Usuario = require('../models/Usuario');
const ReporteRapido = require('../models/Reporte_rapido');
const ReporteIncendio = require('../models/Reporte_incendios');
const Equipo = require('../models/Equipos');
const MiembroEquipo = require('../models/MiembroEquipo');
const Recurso = require('../models/Recurso');
const ComunariosApoyo = require('../models/ComunariosApoyo');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });
const axios = require("axios");
const { parse } = require("csv-parse/sync");
const nodemailer = require('nodemailer');
const NASA_API_KEY = process.env.NASA_API_KEY;
const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;
//Crear la funcion que me crea el Token
const crearToken = (usuario, palabrasecreta, expiresIn) => {
    const {id, nombre, apellido, ci, fecha_nacimiento, genero, telefono, email, tipo_de_sangre, nivel_de_entrenamiento, entidad_perteneciente, creado, rol, estado } = usuario;
    return jwt.sign({id, nombre, apellido, ci, fecha_nacimiento, genero, telefono, email, tipo_de_sangre, nivel_de_entrenamiento, entidad_perteneciente, creado, rol, estado}, palabrasecreta, {expiresIn});
}

const resolvers = {
    Query: {
        getalluser: async (_, __) => {
            try {
                const usuarios = await Usuario.find({})
                    .sort({ creado: -1 });

                return usuarios;
            } catch (error) {
                console.error('Error en obtenerUsuarios:', error);
                throw new Error('Error al obtener los usuarios: ' + error.message);
            }
        },
        obtenerUsuarios: async (_, __) => {
            try {

                const usuarios = await Usuario.find({})
                    .select('-password') // Excluir el campo password
                    .sort({ creado: -1 }); // Ordenar por fecha de creación descendente

                return usuarios;
            } catch (error) {
                console.error('Error en obtenerUsuarios:', error);
                throw new Error('Error al obtener los usuarios: ' + error.message);
            }
        },
        obtenerUsuario: async (_, {token})=>{
            return jwt.verify(token, process.env.PALABRA_SECRETA);
        },

        obtenerUsuariosPendientes: async (_, __, ctx) => {
            try {
                // Verificar autenticación y rol de admin
                if (ctx.usuario.rol !== 'admin') {
                    throw new Error('No autorizado - Solo administradores pueden ver usuarios pendientes');
                }

                const usuarios = await Usuario.find({ estadoCuenta: false })
                    .select('-password')
                    .sort({ creado: -1 });

                return usuarios;
            } catch (error) {
                console.error('Error en obtenerUsuariosPendientes:', error);
                throw new Error('Error al obtener usuarios pendientes: ' + error.message);
            }
        },

        obtenerUsuarioPorToken: async (_, __, ctx) => {
            try {
                // Verificar autenticación
                if (!ctx.usuario) {
                    throw new Error('No autorizado - Debes iniciar sesión');
                }

                const usuario = await Usuario.findById(ctx.usuario.id).select('-password');

                if (!usuario) {
                    throw new Error('Usuario no encontrado');
                }

                return usuario;
            } catch (error) {
                console.error('Error en obtenerUsuarioPorToken:', error);
                throw new Error('Error al obtener el usuario: ' + error.message);
            }
        },
        obtenerReportes: async () => {
            try {
                const reportes = await ReporteRapido.find({});
                return reportes;
            } catch (error) {
                console.log(error);
                throw new Error('Error al obtener los reportes');
            }
        },
        obtenerReporte: async (_, { id }) => {
            // Revisar si el reporte existe
            const reporte = await ReporteRapido.findById(id);
            if (!reporte) {
                throw new Error(`El reporte con ID: ${id} no existe`);
            }
            return reporte;
        },

        obtenerReportesIncendio: async () => {
            try {
                const reportes = await ReporteIncendio.find({}).populate('usuarioid');
                return reportes;
            } catch (error) {
                console.log(error);
                throw new Error('Error al obtener los reportes de incendio' + error);
            }
        },
        obtenerReporteIncendio: async (_, { id }) => {
            // Revisar si el reporte existe
            try {
                const reporte = await ReporteIncendio.findById(id).populate('usuarioid');
                if (!reporte) {
                    throw new Error(`El reporte de incendio con ID: ${id} no existe`);
                }
                return reporte;
            } catch (error) {
                console.log(error);
                throw new Error('Error al obtener el reporte de incendio');
            }
        },
        // Update the obtenerEquipos resolver in your resolvers.js file
        obtenerEquipos: async (_, __, ctx) => {
            try {
                // Verify authentication
                if (!ctx.usuario) {
                    throw new Error('No autorizado - Debes iniciar sesión');
                }

                // Get teams with populated leader data
                const equipos = await Equipo.find({}).populate('id_lider_equipo');

                // Get members for each team with proper ID handling
                const equiposConMiembros = await Promise.all(
                    equipos.map(async equipo => {
                        const miembros = await MiembroEquipo.find({ id_equipo: equipo._id })
                            .populate('id_usuario', 'id nombre apellido');

                        // Convert to plain object and manually map the _id to id field
                        const equipoPlain = equipo.toObject();

                        // Fix the missing id field
                        equipoPlain.id = equipoPlain._id.toString();

                        // Also fix the missing leader id
                        if (equipoPlain.id_lider_equipo) {
                            equipoPlain.id_lider_equipo.id = equipoPlain.id_lider_equipo._id.toString();
                        }

                        // Add members array
                        return {
                            ...equipoPlain,
                            miembros
                        };
                    })
                );

                return equiposConMiembros;
            } catch (error) {
                console.error('Error en obtenerEquipos:', error);
                throw new Error('Error al obtener los equipos');
            }
        },
        obtenerEquipo: async (_, { id }) => {
            try {
                const equipo = await Equipo.findById(id).populate('id_lider_equipo');
                if (!equipo) {
                    throw new Error(`El equipo con ID: ${id} no existe`);
                }
                return equipo;
            } catch (error) {
                console.error(error);
                throw new Error('Error al obtener el equipo');
            }
        },

        obtenerMiembrosEquipo: async (_, { id_equipo }) => {
            try {
                return await MiembroEquipo.find({ id_equipo })
                    .populate('id_usuario')
                    .populate('id_equipo');
            } catch (error) {
                console.error(error);
                throw new Error('Error al obtener los miembros del equipo');
            }
        },

        obtenerEquiposPorLider: async (_, { id_lider }) => {
            try {
                return await Equipo.find({ id_lider_equipo: id_lider })
                    .populate('id_lider_equipo');
            } catch (error) {
                console.error(error);
                throw new Error('Error al obtener los equipos del líder');
            }
        },
        focosDeCalor: async (_, { range = "today" }) => {
            let url;
            switch (range) {
                case "24h":
                    url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${NASA_API_KEY}/VIIRS_NOAA20_NRT/BOL/2`;
                    break;
                case "today":
                    url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${NASA_API_KEY}/VIIRS_NOAA20_NRT/BOL/1`;
                    break;
                case "7d":
                default:
                    url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${NASA_API_KEY}/VIIRS_NOAA20_NRT/BOL/7`;
            }

            const response = await axios.get(url, { headers: { Accept: "text/csv" } });

            const records = parse(response.data, {
                columns: true,
                skip_empty_lines: true,
            });

            return records.map((r) => ({
                country_id: r.country_id,
                latitude: parseFloat(r.latitude),
                longitude: parseFloat(r.longitude),
                bright_ti4: parseFloat(r.bright_ti4),
                scan: parseFloat(r.scan),
                track: parseFloat(r.track),
                acq_date: r.acq_date,
                acq_time: r.acq_time,
                satellite: r.satellite,
                instrument: r.instrument,
                confidence: r.confidence,
                version: r.version,
                bright_ti5: parseFloat(r.bright_ti5),
                frp: parseFloat(r.frp),
                daynight: r.daynight,
            }));
        },
        noticiasIncendios: async (_, { max = 3 }) => {
            try {
                const url = `${BASE_URL}/news?apikey=${API_KEY}&q=bolivia&country=bo&language=es&category=environment`;

                const response = await fetch(url);
                if (!response.ok) throw new Error(`Error en la petición: ${response.status}`);

                const data = await response.json();

                if (!data.results || data.results.length === 0) {
                    return [{
                        title: "No se encontraron noticias recientes sobre incendios.",
                        date: "N/A",
                        description: "Intenta más tarde o verifica la fuente externa.",
                        url: "#",
                        image: null
                    }];
                }

                return data.results
                    .filter(article => article.title && !article.title.includes('ONLY AVAILABLE IN PAID PLANS')&&
                        article.title.toLowerCase().includes("incendio") || article.title.toLowerCase().includes("chaqueo") || article.title.toLowerCase().includes("quema"))
                    .slice(0, max)
                    .map(article => ({
                        title: article.title,
                        date: new Date(article.pubDate).toLocaleDateString("es-BO", {
                            day: "numeric", month: "short", year: "numeric"
                        }),
                        description: article.description || "No hay descripción disponible.",
                        url: article.link,
                        image: article.image_url
                    }));
            } catch (error) {
                console.error("Error en noticiasIncendios:", error);
                return [{
                    title: "No se pudieron cargar las noticias.",
                    date: "N/A",
                    description: "Verifica tu conexión o intenta más tarde.",
                    url: "#",
                    image: null
                }];
            }
        },

        obtenerRecursos: async () => {
            try {
                const recursos = await Recurso.find({ estado_del_pedido: false }).populate('Equipoid');
                return recursos;
            } catch (error) {
                console.error("Error detallado:", error);
                throw new Error("Error al obtener recursos: " + error.message);
            }
        },

        obtenerRecursosCompletos: async () => {
            try {
                const recursos = await Recurso.find().populate('Equipoid');
                return recursos;
            } catch (error) {
                console.error("Error detallado:", error);
                throw new Error("Error al obtener recursos: " + error.message);
            }
        },

        obtenerRecursosPorEquipo: async (_, { Equipoid }) => {
            try {
                return await Recurso.find({ Equipoid }).populate('Equipoid');
            } catch (error) {
                console.error(error);
                throw new Error("Error al obtener recursos por equipo.");
            }
        },

        obtenerComunariosApoyo: async () => {
            try {
                return await ComunariosApoyo.find().populate('Equipoid');
            } catch (error) {
                console.error(error);
                throw new Error('Error al obtener los comunarios de apoyo');
            }
        },

        // En tu backend - resolver modificado
        obtenerComunariosApoyoPorEquipo: async (_, { Equipoid }) => {
            try {
                // Si no se provee Equipoid, devolver todos los comunarios con su equipo asociado
                if (!Equipoid) {
                    return await ComunariosApoyo.find({}).populate('Equipoid');
                }
                // Si se provee Equipoid, devolver solo los de ese equipo
                return await ComunariosApoyo.find({ Equipoid }).populate('Equipoid');
            } catch (error) {
                console.error(error);
                throw new Error('Error al obtener los comunarios de apoyo por equipo');
            }
        },
    },
    Mutation: {
        nuevoUsuario: async (_, { input }) => {
            const usuarioData = {
                nombre: input.nombre,
                apellido: input.apellido,
                email: input.email,
                ci: input.ci,
                telefono: input.telefono
            };
            console.log(usuarioData);

            const existeUsuario = await Usuario.findOne({ ci: usuarioData.ci });

            if (existeUsuario) throw new Error('Usuario Ya Existe');

            try {
                await fetch('http://34.9.138.238:2020/global_registro/alasC', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(usuarioData)
                });
            } catch (error) {
                console.error('Error al registrar en global_registro:', error);
                // Aquí no se hace throw para que siga el flujo normal
            }

            console.log(input);
            const { password } = input;
            input.estadoCuenta = true;

            // Hashear el password
            const salt = await bcrypt.genSalt(10);
            input.password = await bcrypt.hash(password, salt);

            try {
                const usuario = new Usuario(input);
                await usuario.save();
                return usuario;
            } catch (error) {
                console.log(error);
                throw new Error('Error al guardar el usuario');
            }
        },


        nuevoUsuarioGlobal:async(_,{input})=>{
            console.log(input);
            const {ci} = input;
            const existeUsuario = await Usuario.findOne({ci});
            if(existeUsuario){
                throw new Error("Usuario Ya Exsite")
            }

            input.estadoCuenta = false
            input.rol = "usuario";
            try {
                const usuario = new Usuario(input);
                await usuario.save();
                return usuario;
            }
            catch (error){
                console.log(error);
            }
        },

        activarCuentaUsuario: async (_, { id_usuario }, ctx) => {
            try {
                const usuario = await Usuario.findById(id_usuario);
                if (!usuario) {
                    throw new Error("Usuario no encontrado");
                }
                if (usuario.estadoCuenta) {
                    throw new Error("La cuenta ya está activada");
                }
                if (ctx.usuario.rol !== 'admin') {
                    throw new Error("No tienes las credenciales para editar este reporte de incendio");
                }
                const nuevaPassword = Math.random().toString(36).slice(-10);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

                usuario.estadoCuenta = true;
                usuario.password = hashedPassword;
                usuario.debeCambiarPassword = true;
                await usuario.save();

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.CORREO_APP,
                        pass: process.env.PASS_CORREO_APP,
                    }
                });

                const mensajeHTML = `
                    <p>Hola ${usuario.nombre}, tu cuenta ha sido activada.</p>
                    <p>Tu contraseña temporal es: <b>${nuevaPassword}</b></p>
                    <p>Debes cambiar esta contraseña al iniciar sesión.</p>
                `;

                await transporter.sendMail({
                    from: `"Alas Chiquitanas" <${process.env.CORREO_APP}>`,
                    to: usuario.email,
                    subject: "Tu cuenta ha sido activada",
                    html: mensajeHTML
                });

                return "Cuenta activada y contraseña enviada";
            } catch (error) {
                console.error("Error en activarCuentaUsuario:", error);
                throw new Error("No se pudo activar la cuenta");
            }
        },
        cambiarPasswordInicial: async (_, { nuevaContrasenia }, ctx) => {
            const usuario = await Usuario.findById(ctx.usuario.id);
            if (!usuario) throw new Error("Usuario no válido");

            const salt = await bcrypt.genSalt(10);
            usuario.password = await bcrypt.hash(nuevaContrasenia, salt);
            usuario.debeCambiarPassword = false;
            await usuario.save();

            return "Contraseña actualizada correctamente.";
        },

        autenticarUsuario: async(_,{input})=>{
            const {ci, password} = input;
            const existeUsuario = await Usuario.findOne({ci});
            if(!existeUsuario){
                throw new Error(`El Numero de carnet: ${ci} no existe`)
            }
            //debemos verificar el password correcto
            const passwordCorrecto = await bcrypt.compare(password, existeUsuario.password)
            if(!passwordCorrecto){
                throw new Error('La contraseña es incorrecta');
            }

            // crear el token
            return {
                token: crearToken(existeUsuario, process.env.PALABRA_SECRETA, 360000)
            }
        },
        actualizarUsuario: async (_, { id, input }, ctx) => {
            let usuario = await Usuario.findById(id);
            if (!usuario) {
                throw new Error(`El usuario con ese ID: ${id}, no existe.`);
            }

            if (usuario.id.toString() !== ctx.usuario.id) {
                throw new Error("No tienes las credenciales para editar este Usuario");
            }

            usuario = await Usuario.findOneAndUpdate({ _id: id }, input, { new: true });

            return usuario;
        },
        deleteUsuario: async (_, { id }, ctx) => {
            let usuario = await Usuario.findById(id);
            if (!usuario) {
                throw new Error(`El Usuario con ID: ${id} no existe.`);
            }

            if (usuario.id.toString() !== ctx.usuario.id) {
                throw new Error("No tienes las credenciales para eliminar este Usuario.");
            }

            await Usuario.findOneAndDelete({ _id: id });
            return 'Usuario eliminado correctamente';
        },

        solicitarRecuperacionContrasenia: async (_, { email }) => {
            try {
                const usuario = await Usuario.findOne({ email });
                if (!usuario) throw new Error("No existe una cuenta con ese correo.");

                const token = jwt.sign(
                    { id: usuario.id },
                    process.env.PALABRA_SECRETA,
                    { expiresIn: '15m' } // Token corto, 15 minutos
                );

                const url = `http://localhost:3000/Password/${token}`;

                const mensajeHTML = `
      <div style="font-family: Arial; color: #333;">
        <h2>Hola ${usuario.nombre}</h2>
        <p>Has solicitado restablecer tu contraseña en <b>Alas Chiquitanas</b>.</p>
        <p>Haz clic en el siguiente botón para continuar:</p>
        <a href="${url}" style="display:inline-block; padding:12px 20px; background:#e25822; color:white; text-decoration:none; border-radius:6px;">Restablecer contraseña</a>
        <p>Este enlace expirará en 15 minutos.</p>
      </div>
    `;

                const transporter = require("nodemailer").createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.CORREO_APP,
                        pass: process.env.PASS_CORREO_APP,
                    }
                });

                await transporter.sendMail({
                    from: `"Alas Chiquitanas" <${process.env.CORREO_APP}>`,
                    to: email,
                    subject: "Restablece tu contraseña",
                    html: mensajeHTML,
                });

                return "Correo enviado. Revisa tu bandeja de entrada.";
            } catch (error) {
                console.error("Error al enviar correo de recuperación:", error);
                throw new Error("No se pudo procesar la solicitud.");
            }
        },

        cambiarContrasenia: async (_, { token, nuevaContrasenia }) => {
            try {
                const decoded = jwt.verify(token, process.env.PALABRA_SECRETA);
                const usuario = await Usuario.findById(decoded.id);
                if (!usuario) throw new Error("Usuario no válido o token expirado.");

                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(nuevaContrasenia, salt);
                await usuario.save();

                return "Contraseña actualizada correctamente.";
            } catch (error) {
                console.error("Error al cambiar contraseña:", error);
                throw new Error("Token inválido o expirado.");
            }
        },

        crearReporte: async (_, { input }) => {
            try {
                // Preparar el objeto para el formato GeoJSON
                const { lat, lng, ...restoDatos } = input;

                const nuevoReporte = new ReporteRapido({
                    ...restoDatos,
                    ubicacion: {
                        type: 'Point',
                        coordinates: [lng, lat] // MongoDB usa [longitud, latitud]
                    }
                });

                // Guardar en la base de datos
                const resultado = await nuevoReporte.save();
                return resultado;
            } catch (error) {
                console.log(error);
                throw new Error('Error al crear el reporte de incidente');
            }
        },
        actualizarReporte: async (_, { id, input }) => {
            // Verificar que el reporte exista
            let reporte = await ReporteRapido.findById(id);
            if (!reporte) {
                throw new Error(`El reporte con ID: ${id} no existe`);
            }

            try {
                // Preparar el objeto para actualizar
                const { lat, lng, ...restoDatos } = input;
                const datosActualizados = {
                    ...restoDatos
                };

                // Solo actualizar coordenadas si se proporcionan
                if (lat !== undefined && lng !== undefined) {
                    datosActualizados.ubicacion = {
                        type: 'Point',
                        coordinates: [lng, lat]
                    };
                }

                // Actualizar y retornar el nuevo documento
                reporte = await ReporteRapido.findOneAndUpdate(
                    { _id: id },
                    datosActualizados,
                    { new: true }
                );

                return reporte;
            } catch (error) {
                console.log(error);
                throw new Error('Error al actualizar el reporte');
            }
        },
        eliminarReporte: async (_, { id }) => {
            // Verificar que el reporte exista
            const reporte = await ReporteRapido.findById(id);
            if (!reporte) {
                throw new Error(`El reporte con ID: ${id} no existe`);
            }

            try {
                await ReporteRapido.findOneAndDelete({ _id: id });
                return 'Reporte eliminado correctamente';
            } catch (error) {
                console.log(error);
                throw new Error('Error al eliminar el reporte');
            }
        },

        crearReporteIncendio: async (_, { input }, ctx) => {
            try {
                const { lat, lng, ...restoDatos } = input;

                // Crear el nuevo reporte con los datos recibidos
                const nuevoReporte = new ReporteIncendio({
                    ...restoDatos,
                    // Si tienes ubicación geográfica, la puedes agregar aquí
                    ubicacion: lat !== undefined && lng !== undefined ? {
                        type: 'Point',
                        coordinates: [lng, lat]
                    } : undefined,
                    usuarioid: ctx.usuario.id,
                    fechaCreacion: new Date()
                });

                // Guardar reporte en BD
                const reporteGuardado = await nuevoReporte.save();

                // Obtener todos los usuarios admin para notificar
                const admins = await Usuario.find({ rol: 'admin' }).select('email nombre');

                if (admins.length > 0) {
                    // Configurar nodemailer
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.CORREO_APP,
                            pass: process.env.PASS_CORREO_APP,
                        }
                    });

                    // Construir contenido HTML del correo con los datos del reporte
                    const reporteHtml = `
                        <h2>Nuevo reporte de incendio recibido</h2>
                        <p><strong>Reportado por el usuario:</strong> ${ctx.usuario.nombre}</p>
                        <p><strong>Nombre del incidente:</strong> ${reporteGuardado.nombreIncidente || 'No especificado'}</p>
                        <p><strong>Controlado:</strong> ${reporteGuardado.controlado ? 'Sí' : 'No'}</p>
                        <p><strong>Extensión:</strong> ${reporteGuardado.extension}</p>
                        <p><strong>Condiciones del clima:</strong> ${reporteGuardado.condicionesClima}</p>
                        <p><strong>Equipos en uso:</strong> ${reporteGuardado.equiposEnUso?.join(', ') || 'Ninguno'}</p>
                        <p><strong>Número de bomberos:</strong> ${reporteGuardado.numeroBomberos}</p>
                        <p><strong>Necesita más bomberos:</strong> ${reporteGuardado.necesitaMasBomberos ? 'Sí' : 'No'}</p>
                        <p><strong>Apoyo externo:</strong> ${reporteGuardado.apoyoExterno}</p>
                        <p><strong>Comentario adicional:</strong> ${reporteGuardado.comentarioAdicional || 'Ninguno'}</p>
                        <p><strong>Fecha de creación:</strong> ${reporteGuardado.fechaCreacion.toLocaleString()}</p>
                        ${lat !== undefined && lng !== undefined ? `<p><strong>Ubicación:</strong> <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank">Ver en mapa</a></p>` : ''}
                    `;

                    // Enviar correo a cada admin
                    for (const admin of admins) {
                        await transporter.sendMail({
                            from: `"Alas Chiquitanas" <${process.env.CORREO_APP}>`,
                            to: admin.email,
                            subject: `Nuevo reporte de incendio: ${reporteGuardado.nombreIncidente || 'Sin nombre'}`,
                            html: reporteHtml,
                        });
                    }
                }

                return reporteGuardado;

            } catch (error) {
                console.log(error);
                throw new Error('Error al crear el reporte de incendio');
            }
        },

        actualizarReporteIncendio: async (_, { id, input }, ctx) => {
            // Verificar que el reporte exista
            let reporte = await ReporteIncendio.findById(id);
            if (!reporte) {
                throw new Error(`El reporte de incendio con ID: ${id} no existe`);
            }

            // Verificar permisos (solo el usuario que creó el reporte o un admin puede actualizarlo)
            if (ctx.usuario && reporte.usuario.toString() !== ctx.usuario.id && ctx.usuario.rol !== 'admin') {
                throw new Error("No tienes las credenciales para editar este reporte de incendio");
            }

            try {
                // Preparar el objeto para actualizar
                const { lat, lng, usuario, ...restoDatos } = input;
                const datosActualizados = {
                    ...restoDatos
                };

                // Solo actualizar usuario si se proporciona y existe
                if (usuario) {
                    const existeUsuario = await Usuario.findById(usuario);
                    if (!existeUsuario) {
                        throw new Error(`El usuario con ID: ${usuario} no existe`);
                    }
                    datosActualizados.usuario = usuario;
                }

                // Actualizar y retornar el nuevo documento
                reporte = await ReporteIncendio.findOneAndUpdate(
                    { _id: id },
                    datosActualizados,
                    { new: true }
                ).populate('usuario');

                return reporte;
            } catch (error) {
                console.log(error);
                throw new Error('Error al actualizar el reporte de incendio');
            }
        },
        eliminarReporteIncendio: async (_, { id }, ctx) => {
            // Verificar que el reporte exista
            const reporte = await ReporteIncendio.findById(id);
            if (!reporte) {
                throw new Error(`El reporte de incendio con ID: ${id} no existe`);
            }

            // Verificar permisos (solo el usuario que creó el reporte o un admin puede eliminarlo)
            if (ctx.usuario && reporte.usuario.toString() !== ctx.usuario.id && ctx.usuario.rol !== 'admin') {
                throw new Error("No tienes las credenciales para eliminar este reporte de incendio");
            }

            try {
                await ReporteIncendio.findOneAndDelete({ _id: id });
                return 'Reporte de incendio eliminado correctamente';
            } catch (error) {
                console.log(error);
                throw new Error('Error al eliminar el reporte de incendio');
            }
        },

        crearEquipo: async (_, { input }, ctx) => {
            try {
                const { lat, lng, ...restoDatos } = input;

                // Verificar que el líder existe
                const lider = await Usuario.findById(restoDatos.id_lider_equipo);
                if (!lider) {
                    throw new Error('El líder especificado no existe');
                }

                // Crear el equipo
                const nuevoEquipo = new Equipo({
                    ...restoDatos,
                    ubicacion: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    }
                });

                const equipoCreado = await nuevoEquipo.save();

                return equipoCreado.populate('id_lider_equipo');
            } catch (error) {
                console.error(error);
                throw new Error('Error al crear el equipo');
            }
        },

        actualizarEquipo: async (_, { id, input }, ctx) => {
            try {
                // Verificar que el equipo existe
                let equipo = await Equipo.findById(id);
                if (!equipo) {
                    throw new Error(`El equipo con ID: ${id} no existe`);
                }

                // Verificar permisos (solo el líder o admin puede editar)
                if (ctx.usuario.id !== equipo.id_lider_equipo.toString() && ctx.usuario.rol !== 'admin') {
                    throw new Error('No tienes permiso para editar este equipo');
                }

                // Preparar datos para actualizar
                const { lat, lng, ...restoDatos } = input;
                const datosActualizados = { ...restoDatos };

                if (lat !== undefined && lng !== undefined) {
                    datosActualizados.ubicacion = {
                        type: 'Point',
                        coordinates: [lng, lat]
                    };
                }

                // Actualizar el equipo
                equipo = await Equipo.findByIdAndUpdate(
                    id,
                    datosActualizados,
                    { new: true }
                ).populate('id_lider_equipo');

                return equipo;
            } catch (error) {
                console.error(error);
                throw new Error('Error al actualizar el equipo');
            }
        },

        eliminarEquipo: async (_, { id }, ctx) => {
            try {
                // Verificar que el equipo existe
                const equipo = await Equipo.findById(id);
                if (!equipo) {
                    throw new Error(`El equipo con ID: ${id} no existe`);
                }

                // Verificar permisos (solo el líder o admin puede eliminar)
                if (ctx.usuario.id !== equipo.id_lider_equipo.toString() && ctx.usuario.rol !== 'admin') {
                    throw new Error('No tienes permiso para eliminar este equipo');
                }

                // Eliminar primero los miembros del equipo
                await MiembroEquipo.deleteMany({ id_equipo: id });

                // Luego eliminar el equipo
                await Equipo.findByIdAndDelete(id);

                return 'Equipo eliminado correctamente';
            } catch (error) {
                console.error(error);
                throw new Error('Error al eliminar el equipo');
            }
        },

        agregarMiembrosEquipo: async (_, { id_equipo, miembros, direccion }, ctx) => {
            try {
                const equipo = await Equipo.findById(id_equipo);
                if (!equipo) {
                    throw new Error('El equipo no existe');
                }

                if (ctx.usuario.rol !== 'admin') {
                    throw new Error('No tienes permiso para agregar miembros a este equipo');
                }

                // Filtrar miembros que ya están en el equipo
                const miembrosExistentes = await MiembroEquipo.find({
                    id_equipo,
                    id_usuario: { $in: miembros }
                });

                const miembrosExistentesIds = miembrosExistentes.map(m => m.id_usuario.toString());
                const miembrosNuevos = miembros.filter(id => !miembrosExistentesIds.includes(id));

                // Crear las relaciones
                const relacionesCreadas = await MiembroEquipo.insertMany(
                    miembrosNuevos.map(id_usuario => ({
                        id_usuario,
                        id_equipo
                    }))
                );

                await Equipo.findByIdAndUpdate(id_equipo, {
                    $inc: { cantidad_integrantes: miembrosNuevos.length }
                });

                const lng = equipo.ubicacion.coordinates[0];
                const lat = equipo.ubicacion.coordinates[1];

                // Configurar nodemailer
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.CORREO_APP,
                        pass: process.env.PASS_CORREO_APP,
                    }
                });

                // Si el equipo esta en mision, enviar correo a los miembros nuevos
                if (equipo.estado === 'en_mision' && miembrosNuevos.length > 0) {
                    // Obtener los datos de los usuarios nuevos para el correo
                    const usuariosNuevos = await Usuario.find({
                        _id: { $in: miembrosNuevos }
                    });

                    // Enviar correo a cada usuario nuevo
                    for (const usuario of usuariosNuevos) {
                        const mensajeHTML = `
                            <div style="font-family: Arial, sans-serif; color: #2c3e50;">
                                <h2 style="color:#e67e22;">Hola ${usuario.nombre},</h2>
                                <p>Has sido agregado al equipo <strong style="color:#2980b9;">${equipo.nombre_equipo}</strong> que se encuentra en misión.</p>
                                <p>Debes esperar la notificacion de recursos para ir a encontrarte con tu grupo y recoger los Recursos para ir a trabajar a la siguiente ubicacion:</p>
                                <p style="font-weight: bold; margin: 10px 0;">
                                    <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" 
                                    style="color:#e67e22; text-decoration:none; background:#fceae5; padding:8px 12px; border-radius:5px; display:inline-block;">
                                    Haz clik aqui para ver la ubicacion de tu Destino
                                    </a>
                                </p>
                                <p>Por favor, prepara todo para iniciar las labores correspondientes.</p>
                                <p>Saludos, <em>Alas Chiquitanas</em></p>
                            </div>
                        `;

                        await transporter.sendMail({
                            from: `"Alas Chiquitanas" <${process.env.CORREO_APP}>`,
                            to: usuario.email,
                            subject: `Asignación a equipo en misión: ${equipo.nombre_equipo}`,
                            html: mensajeHTML
                        });
                    }
                }

                // Enviar notificación especial al líder recordando que es líder
                const lider = await Usuario.findById(equipo.id_lider_equipo);
                if (lider) {
                    const mensajeLiderHTML = `
                        <div style="font-family: Arial, sans-serif; color: #2c3e50;">
                            <h2 style="color:#2980b9;">Hola ${lider.nombre},</h2>
                            <p>Felicidades, has sido asignado como <strong>líder</strong> del equipo <strong>${equipo.nombre_equipo}</strong>.</p>
                            <p>Podrás gestionar los miembros y actividades relacionadas a este equipo.</p>
                            <p>Espera la ubicacion de los recursos para recogerlos y encontrarte con tu equipo para ir a la mision que se encuentra en:</p>
                            <p style="font-weight: bold; margin: 10px 0;">
                                <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" 
                                style="color:#e67e22; text-decoration:none; background:#fceae5; padding:8px 12px; border-radius:5px; display:inline-block;">
                                Haz clik aqui para ver la ubicacion de tu Destino
                                </a>
                            </p>
                            <p>¡Gracias por tu compromiso!</p>
                            <p>Saludos, <em>Alas Chiquitanas</em></p>
                        </div>
                    `;

                    await transporter.sendMail({
                        from: `"Alas Chiquitanas" <${process.env.CORREO_APP}>`,
                        to: lider.email,
                        subject: `Eres líder del equipo: ${equipo.nombre_equipo}`,
                        html: mensajeLiderHTML
                    });
                }

                return {
                    count: relacionesCreadas.length,
                    miembros: await MiembroEquipo.find({ id_equipo }).populate('id_usuario')
                };
            } catch (error) {
                console.error(error);
                throw new Error('Error al agregar miembros al equipo');
            }
        },


        agregarMiembroEquipo: async (_, { input }, ctx) => {
            try {
                const { id_usuario, id_equipo } = input;

                // Verificar que el usuario y el equipo existen
                const usuario = await Usuario.findById(id_usuario);
                const equipo = await Equipo.findById(id_equipo);

                if (!usuario) throw new Error('El usuario no existe');
                if (!equipo) throw new Error('El equipo no existe');

                // Verificar permisos (solo el líder puede agregar miembros)
                if (ctx.usuario.rol !== 'admin') {
                    throw new Error('No tienes permiso para agregar miembros a este equipo');
                }

                // Verificar que el miembro no está ya en el equipo
                const existeMiembro = await MiembroEquipo.findOne({
                    id_usuario,
                    id_equipo
                });

                if (existeMiembro) {
                    throw new Error('Este usuario ya es miembro del equipo');
                }

                // Crear la relación
                const nuevoMiembro = new MiembroEquipo(input);
                await nuevoMiembro.save();

                // Actualizar contador de integrantes en el equipo
                await Equipo.findByIdAndUpdate(id_equipo, {
                    $inc: { cantidad_integrantes: 1 }
                });

                return nuevoMiembro.populate('id_usuario').populate('id_equipo').execPopulate();
            } catch (error) {
                console.error(error);
                throw new Error('Error al agregar miembro al equipo');
            }
        },

        eliminarMiembroEquipo: async (_, { id }, ctx) => {
            try {
                // Obtener la relación miembro-equipo
                const miembroEquipo = await MiembroEquipo.findById(id)
                    .populate('id_equipo');

                if (!miembroEquipo) {
                    throw new Error('La relación miembro-equipo no existe');
                }

                // Verificar permisos (solo el líder puede eliminar miembros)
                const equipo = miembroEquipo.id_equipo;
                if (ctx.usuario.rol !== 'admin') {
                    throw new Error('No tienes permiso para eliminar miembros de este equipo');
                }

                // Eliminar la relación
                await MiembroEquipo.findByIdAndDelete(id);

                // Actualizar contador de integrantes en el equipo
                await Equipo.findByIdAndUpdate(equipo._id, {
                    $inc: { cantidad_integrantes: -1 }
                });

                return 'Miembro eliminado del equipo correctamente';
            } catch (error) {
                console.error(error);
                throw new Error('Error al eliminar miembro del equipo');
            }
        },

        transferirLiderazgo: async (_, { id_equipo, nuevo_lider_id }, ctx) => {
            try {
                // Verificar que el equipo existe
                const equipo = await Equipo.findById(id_equipo);
                if (!equipo) {
                    throw new Error(`El equipo con ID: ${id_equipo} no existe`);
                }

                // Verificar que el nuevo líder existe
                const nuevoLider = await Usuario.findById(nuevo_lider_id);
                if (!nuevoLider) {
                    throw new Error('El nuevo líder especificado no existe');
                }

                // Verificar que el nuevo líder es miembro del equipo
                const esMiembro = await MiembroEquipo.findOne({
                    id_usuario: nuevo_lider_id,
                    id_equipo: id_equipo
                });

                if (!esMiembro) {
                    throw new Error('El nuevo líder debe ser miembro del equipo');
                }

                // Verificar permisos (solo el líder actual puede transferir)
                if (ctx.usuario.id !== equipo.id_lider_equipo.toString() && ctx.usuario.rol !== 'admin') {
                    throw new Error('No tienes permiso para transferir el liderazgo de este equipo');
                }

                // Actualizar el líder del equipo
                const equipoActualizado = await Equipo.findByIdAndUpdate(
                    id_equipo,
                    { id_lider_equipo: nuevo_lider_id },
                    { new: true }
                ).populate('id_lider_equipo');

                return equipoActualizado;
            } catch (error) {
                console.error(error);
                throw new Error('Error al transferir el liderazgo del equipo');
            }
        },

        crearRecurso: async (_, { input }, ctx) => {
            try {
                if (!ctx.usuario || ctx.usuario.rol !== "admin") {
                    throw new Error("No autorizado. Solo un administrador puede crear recursos.");
                }

                const equipo = await Equipo.findById(input.Equipoid);
                if (!equipo) {
                    throw new Error("Equipo no encontrado.");
                }

                const iniciales = equipo.nombre_equipo
                    .split(' ')
                    .map(p => p.charAt(0).toUpperCase())
                    .join('');

                let contador = 1;
                let codigoGenerado = '';
                let existe = true;

                // Generar un código único
                while (existe) {
                    codigoGenerado = `${iniciales}${String(contador).padStart(3, '0')}`;

                    // Verificar si el código ya existe globalmente (sin filtro por Equipoid)
                    const recursoExistente = await Recurso.findOne({ codigo: codigoGenerado });

                    if (recursoExistente) {
                        contador++;
                    } else {
                        existe = false; // Código único encontrado
                    }
                }

                const nuevoRecurso = new Recurso({
                    descripcion: input.descripcion,
                    codigo: codigoGenerado,
                    Equipoid: equipo._id,
                    lat: input.lat,
                    lng: input.lng
                });

                return await nuevoRecurso.save();

            } catch (error) {
                console.log(error);
                throw new Error("Error al crear el recurso");
            }
        },


        editarRecurso: async (_, { id, input }) => {
            try {
                let recurso = await Recurso.findById(id);
                console.log("pelotudo entro")
                if (!recurso) {
                    throw new Error(`El recurso con ID: ${id} no existe`);
                }
                console.log("pelotudo paso validacion")
                // Preparar campos actualizables
                const datosActualizados = {};
                if (input.descripcion !== undefined) datosActualizados.descripcion = input.descripcion;
                if (input.estado_del_pedido !== undefined) datosActualizados.estado_del_pedido = input.estado_del_pedido;
                if (input.lat !== undefined) datosActualizados.lat = input.lat;
                if (input.lng !== undefined) datosActualizados.lng = input.lng;

                recurso = await Recurso.findByIdAndUpdate(id, datosActualizados, { new: true }).populate('Equipoid');

                // Si estado_del_pedido se actualizó a true, enviar correo
                if (input.estado_del_pedido === true) {
                    // Obtener equipo con líder
                    const equipo = await Equipo.findById(recurso.Equipoid._id).populate('id_lider_equipo');

                    // Obtener miembros del equipo
                    const miembrosEquipo = await MiembroEquipo.find({ id_equipo: recurso.Equipoid._id }).populate('id_usuario');

                    // Construir lista de destinatarios sin duplicados (incluye líder y miembros)
                    const destinatariosMap = new Map();

                    if (equipo.id_lider_equipo) {
                        destinatariosMap.set(equipo.id_lider_equipo.email, {
                            email: equipo.id_lider_equipo.email,
                            nombre: equipo.id_lider_equipo.nombre
                        });
                    }

                    miembrosEquipo.forEach(m => {
                        if (!destinatariosMap.has(m.id_usuario.email)) {
                            destinatariosMap.set(m.id_usuario.email, {
                                email: m.id_usuario.email,
                                nombre: m.id_usuario.nombre
                            });
                        }
                    });

                    const destinatarios = Array.from(destinatariosMap.values());

                    const urlUbicacion = `https://maps.google.com/?q=${input.lat},${input.lng}`;

                    // Convertir descripción en lista HTML
                    const articulosArray = recurso.descripcion.split(',').map(item => {
                        const [nombre, cantidad] = item.split(':');
                        return `<li><strong>${nombre.trim()}</strong>: ${cantidad.trim()}</li>`;
                    }).join('');

                    // Configurar nodemailer
                    const transporter = require('nodemailer').createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.CORREO_APP,
                            pass: process.env.PASS_CORREO_APP,
                        }
                    });

                    // Enviar correo a cada destinatario
                    for (const destinatario of destinatarios) {
                        const mensajeHTML = `
                            <div style="font-family: Arial, sans-serif; color: #333;">
                                <h2 style="color:#2c3e50;">Hola ${destinatario.nombre},</h2>
                                <p>¡Tus recursos ya están listos para ser recogidos para tu misión!</p>
                                <p>A continuación, te presentamos los artículos:</p>
                                <ul style="background:#f9f9f9; padding: 15px; border-radius: 8px; max-width: 400px; color:#34495e;">
                                    ${articulosArray}
                                </ul>
                                <p>Por favor, dirígete a la siguiente ubicación para recoger tus provisiones y juntarte con tu equipo para ir a la misión:</p>
                                <p style="font-weight: bold; margin: 10px 0;">
                                    <a href="${urlUbicacion}" target="_blank" 
                                    style="color:#e67e22; text-decoration:none; background:#fceae5; padding:8px 12px; border-radius:5px; display:inline-block;">
                                    Haz click aquí para ver la ubicación de tus recursos
                                    </a>
                                </p>
                                <p>Gracias por tu colaboración y compromiso.</p>
                                <p>Saludos,<br/>Equipo Alas Chiquitanas</p>
                            </div>
                        `;

                        await transporter.sendMail({
                            from: `"Alas Chiquitanas" <${process.env.CORREO_APP}>`,
                            to: destinatario.email,
                            subject: 'Tus recursos están listos para ser recogidos',
                            html: mensajeHTML,
                        });
                    }
                }
                console.log("pelotudo logro")

                return recurso;

            } catch (error) {
                console.error(error);
                throw new Error('Error al actualizar el recurso');
            }
        },


        eliminarRecurso: async (_, { id }) => {
            try {
                const recurso = await Recurso.findById(id);
                if (!recurso) {
                    throw new Error(`El recurso con ID: ${id} no existe`);
                }

                await Recurso.findByIdAndDelete(id);
                return 'Recurso eliminado correctamente';
            } catch (error) {
                console.error(error);
                throw new Error('Error al eliminar el recurso');
            }
        },

        crearComunarioApoyo: async (_, { input }) => {
            try {
                const comunarioData = {
                    ...input,
                    entidad_perteneciente: "Comunario"
                };

                const comunario = new ComunariosApoyo(comunarioData);
                await comunario.save();

                // Asegúrate de devolver todos los campos requeridos
                return {
                    id: comunario._id,
                    nombre: comunario.nombre,
                    edad: comunario.edad,
                    entidad_perteneciente: comunario.entidad_perteneciente,
                    Equipoid: comunario.Equipoid // Asegúrate de que esto esté poblado si es necesario
                };
            } catch (error) {
                console.error(error);
                throw new Error('Error al crear el comunario de apoyo');
            }
        },

        eliminarComunarioApoyo: async (_, { id }) => {
            try {
                const comunario = await ComunariosApoyo.findByIdAndDelete(id);
                if (!comunario) {
                    throw new Error(`El comunario de apoyo con ID: ${id} no existe`);
                }
                return 'Comunario de apoyo eliminado correctamente';
            } catch (error) {
                console.error(error);
                throw new Error('Error al eliminar el comunario de apoyo');
            }
        },
    }
}

module.exports = resolvers;