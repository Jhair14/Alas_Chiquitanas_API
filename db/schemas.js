const {gql } = require("apollo-server");
const typeDefs = gql`

    type Query {
        getalluser: [Usuario]
        obtenerUsuarios: [Usuario]
        obtenerUsuario(token:String): Usuario
        obtenerUsuarioPorToken: Usuario
        obtenerUsuariosPendientes: [Usuario]
        
        obtenerReportes: [ReporteRapido]
        obtenerReporte(id: ID!): ReporteRapido
        
        obtenerReportesIncendio: [ReporteIncendio]
        obtenerReporteIncendio(id: ID!): ReporteIncendio
        
        focosDeCalor(range: String): [FocoDeCalor]
        noticiasIncendios(max: Int): [Noticia]
        
        obtenerEquipos: [Equipo]
        obtenerEquipo(id: ID!): Equipo
        obtenerMiembrosEquipo(id_equipo: ID!): [MiembroEquipo]
        obtenerEquiposPorLider(id_lider: ID!): [Equipo]

        obtenerRecursos: [Recurso]
        obtenerRecursosCompletos: [Recurso]
        obtenerRecursosPorEquipo(Equipoid: ID!): [Recurso]

        obtenerComunariosApoyo: [ComunarioApoyo]
        obtenerComunariosApoyoPorEquipo(Equipoid: ID): [ComunarioApoyo]
    }
    
    type FocoDeCalor {
        country_id: String
        latitude: Float
        longitude: Float
        bright_ti4: Float
        scan: Float
        track: Float
        acq_date: String
        acq_time: String
        satellite: String
        instrument: String
        confidence: String
        version: String
        bright_ti5: Float
        frp: Float
        daynight: String
    }

    type Noticia {
        title: String
        date: String
        description: String
        url: String
        image: String
    }

    type Usuario {
        id: ID
        nombre: String
        apellido: String
        ci: String
        fecha_nacimiento: String
        genero: String
        telefono: String
        email: String
        tipo_de_sangre: String
        nivel_de_entrenamiento: String
        entidad_perteneciente: String
        creado: String
        rol: String
        estado: Boolean
        estadoCuenta: Boolean
        debeCambiarPassword: Boolean
    }
    
    type Token {
        token: String
    }
    
    type ReporteRapido {
        id: ID
        nombre_reportante: String
        telefono_contacto: String
        fecha_hora: String
        nombre_lugar: String
        ubicacion: Ubicacion
        tipo_incendio: String
        gravedad_incendio: String
        comentario_adicional: String
        creado: String
        actualizado: String
        cant_bomberos: Int
        cant_paramedicos: Int
        cant_veterinarios: Int
        cant_autoridades: Int
    }
    
    type Ubicacion {
        type: String
        coordinates: [Float]
    }
    
    type ReporteIncendio {
        id: ID
        usuarioid: Usuario
        nombreIncidente: String
        ubicacion: Ubicacion
        controlado: Boolean
        extension: String
        condicionesClima: String
        equiposEnUso: [String]
        numeroBomberos: Int
        necesitaMasBomberos: Boolean
        apoyoExterno: String
        comentarioAdicional: String
        fechaCreacion: String
    }
    
    type Equipo {
        id: ID
        nombre_equipo: String
        ubicacion: Ubicacion
        cantidad_integrantes: Int
        id_lider_equipo: Usuario
        estado: String
        miembros: [MiembroEquipo]
    }
    
    type MiembroEquipo {
        id: ID
        id_usuario: Usuario
        id_equipo: Equipo
    }

    type Recurso {
        id: ID!
        codigo: String!
        fecha_pedido: String!
        descripcion: String!
        Equipoid: Equipo
        lat: Float
        lng: Float
        creado: String
        actualizado: String
        estado_del_pedido: Boolean
    }
        
    type ComunarioApoyo {
        id: ID
        nombre: String!
        edad: Int!
        entidad_perteneciente: String
        Equipoid: Equipo
    }

    input inputUsuario {
        id: ID
        nombre: String
        apellido: String
        ci: String
        fecha_nacimiento: String
        genero: String
        telefono: String
        email: String
        tipo_de_sangre: String
        nivel_de_entrenamiento: String
        entidad_perteneciente: String
        password: String
        creado: String
        rol: String
        estado: Boolean
        estadoCuenta: Boolean
        debeCambiarPassword: Boolean
    }
    
    input inputUsuarioGlobal {
        id: ID
        nombre: String
        apellido: String
        ci: String
        fecha_nacimiento: String
        genero: String
        telefono: String
        email: String
        tipo_de_sangre: String
        nivel_de_entrenamiento: String
        entidad_perteneciente: String
        password: String
        creado: String
        rol: String
        estado: Boolean
        estadoCuenta: Boolean
        debeCambiarPassword: Boolean
    }
    
    input inputAutenticar{
        ci: String
        password: String
    }
    
    input inputReporteRapido {
        nombre_reportante: String!
        telefono_contacto: String
        fecha_hora: String
        nombre_lugar: String
        lat: Float!
        lng: Float!
        tipo_incendio: String!
        gravedad_incendio: String!
        comentario_adicional: String
        cant_bomberos: Int
        cant_paramedicos: Int
        cant_veterinarios: Int
        cant_autoridades: Int
    }
    
    input inputReporteIncendio {
        nombreIncidente: String
        controlado: Boolean!
        extension: String!
        condicionesClima: String!
        equiposEnUso: [String]!
        numeroBomberos: Int!
        necesitaMasBomberos: Boolean!
        apoyoExterno: String!
        comentarioAdicional: String
    }
    
    input inputEquipo {
        nombre_equipo: String!
        lat: Float!
        lng: Float!
        cantidad_integrantes: Int!
        id_lider_equipo: ID!
        estado: String
    }
    
    input inputMiembroEquipo {
        id_usuario: ID! 
        id_equipo: ID!
    }
    
    input inputRecurso {
        descripcion: String!
        Equipoid: ID
        lat: Float
        lng: Float
    }
    input inputEditarRecurso {
        descripcion: String
        estado_del_pedido: Boolean
        lat: Float
        lng: Float
    }   

    input inputComunarioApoyo {
        nombre: String!
        edad: Int!
        Equipoid: ID!
    }

    type Mutation {
        #Usuario
        nuevoUsuario(input:inputUsuario): Usuario
        nuevoUsuarioGlobal(input:inputUsuarioGlobal): Usuario
        autenticarUsuario(input: inputAutenticar): Token
        actualizarUsuario(id: ID!, input: inputUsuario): Usuario
        deleteUsuario(id: ID!): String
        activarCuentaUsuario(id_usuario: ID!): String
        cambiarPasswordInicial(nuevaContrasenia: String!): String

        
        solicitarRecuperacionContrasenia(email: String!): String
        cambiarContrasenia(token: String!, nuevaContrasenia: String!): String
        
        #ReporteRapido
        crearReporte(input: inputReporteRapido): ReporteRapido
        actualizarReporte(id: ID!, input: inputReporteRapido): ReporteRapido
        eliminarReporte(id: ID!): String
        
        #ReporteIncendio
        crearReporteIncendio(input: inputReporteIncendio): ReporteIncendio
        actualizarReporteIncendio(id: ID!, input: inputReporteIncendio): ReporteIncendio
        eliminarReporteIncendio(id: ID!): String
        
        # Equipos
        crearEquipo(input: inputEquipo): Equipo
        actualizarEquipo(id: ID!, input: inputEquipo): Equipo
        eliminarEquipo(id: ID!): String
        
        # Miembros de Equipo
        agregarMiembroEquipo(input: inputMiembroEquipo): MiembroEquipo
        eliminarMiembroEquipo(id: ID!): String
        transferirLiderazgo(id_equipo: ID!, nuevo_lider_id: ID!): Equipo
        agregarMiembrosEquipo(id_equipo: ID!, miembros: [ID!]!): MiembrosResponse

        crearRecurso(input: inputRecurso): Recurso
        editarRecurso(id: ID!, input: inputEditarRecurso): Recurso
        eliminarRecurso(id: ID!): String

        crearComunarioApoyo(input: inputComunarioApoyo): ComunarioApoyo
        eliminarComunarioApoyo(id: ID!): String
    }
    type MiembrosResponse {
        count: Int
        miembros: [MiembroEquipo]
    }
`
module.exports = typeDefs;