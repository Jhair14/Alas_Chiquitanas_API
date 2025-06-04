const{apolloServer}=require('apollo-server');
const mongoose=require('mongoose');
const path = require("node:path");

require('dotenv').config({path:'variables.env'});

const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB, {

        });
        console.log("base de datos conectada bien");
    }
    catch (error) {
        console.error("Error al conectar" + error);
    }
}


module.exports = conectarDB;