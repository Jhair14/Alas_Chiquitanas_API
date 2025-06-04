const mongoose = require('mongoose');

const ReporteIncendioSchema = mongoose.Schema({
    usuarioid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nombreIncidente: {
        type: String,
        trim: true
    },
    controlado: {
        type: Boolean,
        required: true
    },
    extension: {
        type: String,
        required: true,
    },
    condicionesClima: {
        type: String,
        required: true,
    },
    equiposEnUso: [{
        type: String,
        required: false,
    }],
    numeroBomberos: {
        type: Number,
        required: true,
        min: 0
    },
    necesitaMasBomberos: {
        type: Boolean,
        required: true
    },
    apoyoExterno: {
        type: String,
        required: true,
    },
    comentarioAdicional: {
        type: String,
        trim: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

// Crear índice geoespacial para consultas de ubicación
ReporteIncendioSchema.index({ ubicacion: '2dsphere' });

module.exports = mongoose.model("ReporteIncendio", ReporteIncendioSchema);