const mongoose = require('mongoose');

const EquipoSchema = mongoose.Schema({
    nombre_equipo: {
        type: String,
        required: true,
        trim: true
    },
    ubicacion: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    cantidad_integrantes: {
        type: Number,
        required: true,
        default: 1 // El líder cuenta como 1 integrante
    },
    id_lider_equipo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    estado: {
        type: String,
        enum: ['activo', 'inactivo', 'en_mision'],
        default: 'activo'
    }
}, {
    timestamps: true
});

EquipoSchema.index({ ubicacion: '2dsphere' });

module.exports = mongoose.model("Equipo", EquipoSchema);