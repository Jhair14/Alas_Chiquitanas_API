const mongoose = require('mongoose');

const RecursoSchema = new mongoose.Schema({
    codigo: {
        type: String,
        unique: true,
        required: true
    },
    fecha_pedido: {
        type: Date,
        default: Date.now,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    Equipoid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipo',
        required: true
    },
    estado_del_pedido: {
        type: Boolean,
        default: false
    },
    lat: {
        type: Number,
        required: false
    },
    lng: {
        type: Number,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Recurso', RecursoSchema);