const mongoose = require('mongoose');

const ComunariosApoyoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        unique: true,
        required: true
    },
    edad: {
        type: Number,
        required: true
    },
    entidad_perteneciente: {
        type: String,
        default: "Comunario",
        trim: true
    },
    Equipoid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipo',
        required: true
    }
});

module.exports = mongoose.model('ComunariosApoyo', ComunariosApoyoSchema);