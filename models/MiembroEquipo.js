const mongoose = require('mongoose');

const MiembroEquipoSchema = mongoose.Schema({
    id_usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', // Relación con el modelo de Usuario
        required: true
    },
    id_equipo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipo', // Relación con el modelo de Equipo
        required: true
    }
});

module.exports = mongoose.model("MiembroEquipo", MiembroEquipoSchema);
