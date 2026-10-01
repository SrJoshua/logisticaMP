// ==========================================
// CONFIGURACIÓN
// ==========================================

// Repositorio donde están las planillas de personas.
//
// IMPORTANTE:
// Esta dirección apunta al repositorio que mostraste:
// SrJoshua/buscador-padron
//
const REPO_USUARIOS =
    "https://api.github.com/repos/SrJoshua/buscador-padron/contents/datos";


// Archivo de destinos de nuestro proyecto.
const DESTINOS_URL = "./data/destinos.json";


// ==========================================
// VARIABLES
// ==========================================

let destinos = [];
let personaEncontrada = null;


// ==========================================
// ELEMENTOS HTML
// ==========================================

const cedulaInput = document.getElementById("cedula");
const btnBuscar = document.getElementById("btnBuscar");

const resultadoPersona =
    document.getElementById("resultadoPersona");

const errorPersona =
    document.getElementById("errorPersona");

const nombrePersona =
    document.getElementById("nombrePersona");

const chapaInput =
    document.getElementById("chapa");

const seccionalSelect =
    document.getElementById("seccional");

const destinoSelect =
    document.getElementById("destino");

const mercaderiaInput =
    document.getElementById("mercaderia");

const btnEntregar =
    document.getElementById("btnEntregar");

const resumen =
    document.getElementById("resumen");


// ==========================================
// CARGAR DESTINOS
// ==========================================

async function cargarDestinos() {

    try {

        const respuesta =
            await fetch(DESTINOS_URL);

        if (!respuesta.ok) {
            throw new Error(
                "No se pudo cargar destinos.json"
            );
        }

        destinos = await respuesta.json();

        console.log(
            "Destinos cargados:",
            destinos
        );

    } catch (error) {

        console.error(
            "Error cargando destinos:",
            error
        );

        alert(
            "No se pudieron cargar los lugares de entrega."
        );
    }
}


// ==========================================
// CARGAR LISTA DE ARCHIVOS JSON
// ==========================================

async function obtenerArchivosPersonas() {

    try {

        const respuesta =
            await fetch(REPO_USUARIOS);

        if (!respuesta.ok) {
            throw new Error(
                "No se pudo acceder al repositorio"
            );
        }

        const archivos =
            await respuesta.json();

        return archivos.filter(
            archivo =>
                archivo.name
                    .toLowerCase()
                    .endsWith(".json")
        );

    } catch (error) {

        console.error(
            "Error obteniendo archivos:",
            error
        );

        return [];
    }
}


// ==========================================
// NORMALIZAR C.I.
// ==========================================

function normalizarCedula(valor) {

    return String(valor || "")
        .replace(/\./g, "")
        .replace(/\s/g, "")
        .trim();

}


// ==========================================
// BUSCAR C.I. EN OBJETOS
// ==========================================

function buscarEnObjeto(objeto, cedula) {

    if (!objeto || typeof objeto !== "object") {
        return null;
    }


    // Posibles nombres de campo para C.I.
    const camposCedula = [
        "cedula",
        "ci",
        "c_i",
        "documento",
        "document",
        "numero_cedula",
        "nro_cedula",
        "nro_ci",
        "nro_documento",
        "nroDocumento"
    ];


    let valorCedula = null;


    for (const campo of camposCedula) {

        if (
            Object.prototype.hasOwnProperty.call(
                objeto,
                campo
            )
        ) {

            valorCedula =
                objeto[campo];

            break;
        }
    }


    if (
        valorCedula !== null &&
        normalizarCedula(valorCedula) === cedula
    ) {

        return extraerPersona(objeto);
    }


    // Buscar recursivamente dentro del objeto.

    for (const clave in objeto) {

        const valor = objeto[clave];

        if (
            valor &&
            typeof valor === "object"
        ) {

            const resultado =
                buscarEnObjeto(
                    valor,
                    cedula
                );

            if (resultado) {
                return resultado;
            }
        }
    }


    return null;
}


// ==========================================
// EXTRAER NOMBRE
// ==========================================

function extraerPersona(objeto) {

    const nombreCampos = [
        "nombre",
        "nombres",
        "firstName",
        "firstname"
    ];

    const apellidoCampos = [
        "apellido",
        "apellidos",
        "lastName",
        "lastname"
    ];


    let nombre = "";
    let apellido = "";


    for (const campo of nombreCampos) {

        if (
            objeto[campo] !== undefined
        ) {

            nombre =
                String(objeto[campo]);

            break;
        }
    }


    for (const campo of apellidoCampos) {

        if (
            objeto[campo] !== undefined
        ) {

            apellido =
                String(objeto[campo]);

            break;
        }
    }


    // Si existe un campo "nombre_completo"

    const camposCompletos = [
        "nombre_completo",
        "nombreCompleto",
        "fullName",
        "fullname",
        "nombre_apellido"
    ];


    if (
        !nombre &&
        !apellido
    ) {

        for (
            const campo of camposCompletos
        ) {

            if (
                objeto[campo] !== undefined
            ) {

                return {
                    cedula:
                        normalizarCedula(
                            obtenerCedula(objeto)
                        ),

                    nombre:
                        String(objeto[campo])
                };
            }
        }
    }


    return {

        cedula:
            normalizarCedula(
                obtenerCedula(objeto)
            ),

        nombre:
            `${nombre} ${apellido}`
                .trim()

    };
}


// ==========================================
// OBTENER C.I. DEL OBJETO
// ==========================================

function obtenerCedula(objeto) {

    const campos = [
        "cedula",
        "ci",
        "c_i",
        "documento",
        "document",
        "numero_cedula",
        "nro_cedula",
        "nro_ci",
        "nro_documento",
        "nroDocumento"
    ];


    for (const campo of campos) {

        if (
            objeto[campo] !== undefined
        ) {

            return objeto[campo];
        }
    }


    return "";
}


// ==========================================
// BUSCAR EN UN ARCHIVO
// ==========================================

async function buscarEnArchivo(
    archivo,
    cedula
) {

    try {

        const respuesta =
            await fetch(
                archivo.download_url
            );

        if (!respuesta.ok) {
            return null;
        }

        const datos =
            await respuesta.json();


        // Si es un array

        if (Array.isArray(datos)) {

            for (const registro of datos) {

                const resultado =
                    buscarEnObjeto(
                        registro,
                        cedula
                    );

                if (resultado) {
                    return resultado;
                }
            }

        }


        // Si es un objeto

        else {

            const resultado =
                buscarEnObjeto(
                    datos,
                    cedula
                );

            if (resultado) {
                return resultado;
            }
        }

    } catch (error) {

        console.error(
            "Error leyendo:",
            archivo.name,
            error
        );
    }


    return null;
}


// ==========================================
// BUSCAR PERSONA
// ==========================================

async function buscarPersona() {

    const cedula =
        normalizarCedula(
            cedulaInput.value
        );


    if (!cedula) {

        alert(
            "Ingrese un número de C.I."
        );

        cedulaInput.focus();

        return;
    }


    btnBuscar.disabled = true;
    btnBuscar.textContent = "Buscando...";


    resultadoPersona.classList.add(
        "hidden"
    );

    errorPersona.classList.add(
        "hidden"
    );


    try {

        const archivos =
            await obtenerArchivosPersonas();


        if (archivos.length === 0) {

            throw new Error(
                "No se encontraron archivos JSON."
            );
        }


        console.log(
            `Buscando ${cedula} en ${archivos.length} archivos`
        );


        for (const archivo of archivos) {

            const persona =
                await buscarEnArchivo(
                    archivo,
                    cedula
                );


            if (persona) {

                personaEncontrada =
                    persona;


                nombrePersona.textContent =
                    persona.nombre ||
                    "Nombre no disponible";


                resultadoPersona.classList.remove(
                    "hidden"
                );


                console.log(
                    "Persona encontrada:",
                    persona
                );


                return;
            }
        }


        // No encontrada

        personaEncontrada = null;

        errorPersona.classList.remove(
            "hidden"
        );

    } catch (error) {

        console.error(error);

        alert(
            "Ocurrió un error al buscar la C.I."
        );

    } finally {

        btnBuscar.disabled = false;

        btnBuscar.textContent = "Buscar";
    }
}


// ==========================================
// CARGAR DESTINOS SEGÚN SECCIONAL
// ==========================================

function actualizarDestinos() {

    const seccional =
        Number(
            seccionalSelect.value
        );


    destinoSelect.innerHTML = "";


    if (!seccional) {

        destinoSelect.disabled = true;

        const opcion =
            document.createElement("option");

        opcion.value = "";

        opcion.textContent =
            "Primero seleccione una seccional";

        destinoSelect.appendChild(
            opcion
        );

        return;
    }


    const destinosFiltrados =
        destinos.filter(
            destino =>
                Number(destino.seccional) ===
                seccional
        );


    const primeraOpcion =
        document.createElement("option");

    primeraOpcion.value = "";

    primeraOpcion.textContent =
        "Seleccione el lugar de entrega";

    destinoSelect.appendChild(
        primeraOpcion
    );


    destinosFiltrados.forEach(
        destino => {

            const opcion =
                document.createElement(
                    "option"
                );

            opcion.value =
                destino.id;

            opcion.textContent =
                destino.nombre;

            destinoSelect.appendChild(
                opcion
            );
        }
    );


    destinoSelect.disabled =
        false;
}


// ==========================================
// REGISTRAR ENTREGA
// ==========================================

function entregar() {

    // Validar persona

    if (!personaEncontrada) {

        alert(
            "Primero debe buscar una C.I. válida."
        );

        cedulaInput.focus();

        return;
    }


    // Validar chapa

    const chapa =
        chapaInput.value.trim();


    if (!chapa) {

        alert(
            "Ingrese la chapa del vehículo."
        );

        chapaInput.focus();

        return;
    }


    // Validar destino

    const destinoId =
        Number(
            destinoSelect.value
        );


    if (!destinoId) {

        alert(
            "Seleccione el lugar de entrega."
        );

        destinoSelect.focus();

        return;
    }


    // Validar mercadería

    const mercaderia =
        mercaderiaInput.value.trim();


    if (!mercaderia) {

        alert(
            "Describa la mercadería."
        );

        mercaderiaInput.focus();

        return;
    }


    // Encontrar destino

    const destino =
        destinos.find(
            item =>
                Number(item.id) ===
                destinoId
        );


    if (!destino) {

        alert(
            "No se encontró el destino."
        );

        return;
    }


    // Fecha y hora

    const ahora =
        new Date();


    const fecha =
        ahora.toLocaleString(
            "es-PY",
            {
                dateStyle: "short",
                timeStyle: "medium"
            }
        );


    // Mostrar resumen

    document.getElementById(
        "resumenPersona"
    ).textContent =
        personaEncontrada.nombre;


    document.getElementById(
        "resumenCedula"
    ).textContent =
        cedulaInput.value;


    document.getElementById(
        "resumenChapa"
    ).textContent =
        chapa.toUpperCase();


    document.getElementById(
        "resumenDestino"
    ).textContent =
        `Seccional ${destino.seccional} — ${destino.nombre}`;


    document.getElementById(
        "resumenMercaderia"
    ).textContent =
        mercaderia;


    document.getElementById(
        "resumenFecha"
    ).textContent =
        fecha;


    resumen.classList.remove(
        "hidden"
    );


    // ======================================
    // ABRIR GOOGLE MAPS
    // ======================================

    window.open(
        destino.maps,
        "_blank"
    );
}


// ==========================================
// EVENTOS
// ==========================================

btnBuscar.addEventListener(
    "click",
    buscarPersona
);


cedulaInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            buscarPersona();
        }
    }
);


seccionalSelect.addEventListener(
    "change",
    actualizarDestinos
);


btnEntregar.addEventListener(
    "click",
    entregar
);


// ==========================================
// INICIO
// ==========================================

cargarDestinos();
