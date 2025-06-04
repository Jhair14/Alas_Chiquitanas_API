const mongoose = require('mongoose');

const ReporteRapidoSchema = mongoose.Schema({
    nombre_reportante: {
        type: String,
        required: true
    },
    telefono_contacto: {
        type: String,
        required: false
    },
    fecha_hora: {
        type: Date,
        default: Date.now,
        required: true
    },
    nombre_lugar: {
        type: String,
        required: false
    },
    ubicacion: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],  // [longitud, latitud]
            required: true
        }
    },
    tipo_incendio: {
        type: String,
        required: true
    },
    gravedad_incendio: {
        type: String,
        required: true
    },
    comentario_adicional: {
        type: String,
        required: false
    },
    cant_bomberos: {
        type: Number,
        required: false
    },
    cant_paramedicos: {
        type: Number,
        required: false
    },
    cant_veterinarios: {
        type: Number,
        required: false
    },
    cant_autoridades: {
        type: Number,
        required: false
    },
}, { timestamps: true });

// Crear índice geoespacial para consultas de ubicación
ReporteRapidoSchema.index({ ubicacion: '2dsphere' });

module.exports = mongoose.model("ReporteRapido", ReporteRapidoSchema);