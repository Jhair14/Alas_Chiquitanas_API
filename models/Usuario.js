const mongoose = require('mongoose');

const UsuarioSchema = mongoose.Schema({

    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type:String,
        required: true,
        trim: true
    },
    ci:{
        type:String,
        required: true,
        trim: true,
        unique: true
    },
    fecha_nacimiento:{
        type: Date,
        required: false,
        trim: true
    },
    genero:{
        type: String,
        required: false,
        trim: true
    },
    telefono:{
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email:{
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    tipo_de_sangre:{
        type: String,
        required: false,
        trim: true
    },
    nivel_de_entrenamiento:{
        type: String,
        required: false,
        trim: true
    },
    entidad_perteneciente: {
        type: String,
        required: false,
        trim: true
    },
    password: {
        type: String,
        required: false,
        trim: true,
    },
    creado:{
        type: Date,
        default: Date.now
    },
    rol:{
        type: String,
        trim: true
    },
    estado:{
        type: Boolean,
        default: false
    },
    estadoCuenta:{
        type: Boolean
    },
    debeCambiarPassword: {
        type: Boolean,
        default: false
    }
})


module.exports = mongoose.model("Usuario", UsuarioSchema);