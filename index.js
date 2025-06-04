const {ApolloServer} = require('apollo-server');
const conectarDB = require('./config/db');
const typeDefs = require('./db/schemas');
const resolvers = require('./db/resolvers');

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });

//levantamos la BD
conectarDB();


//Luego configuramos el servidor
const servidor = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req})=> {
        const token = req.headers.authorization || '';
        // Verificamos si el token del usuario/vendedor es valido
        if (token) {
            try {
                const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.PALABRA_SECRETA);
                return { usuario: decoded }; // Colocas el usuario decodificado en el contexto
            } catch (error) {
                throw new Error('No autorizado');
            }
        }
    }
});


//y por ultimo levantamos el servidor
servidor.listen({ port: 4000}).then(({ url }) => {
    console.log("base de datos iniciada en el servidor:", url);
});
