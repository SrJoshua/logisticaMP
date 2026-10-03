// ==========================================
// CONFIGURACIÓN
// ==========================================

// Repositorio donde están las planillas de personas.
const REPO_USUARIOS =
    "https://api.github.com/repos/SrJoshua/buscador-padron/contents/datos";

// Archivo de destinos de nuestro proyecto.
const DESTINOS_URL = "./data/destinos.json";

// Servidor backend de Logística MP
const API_URL =
    "https://email-competent-antivirus-ing.trycloudflare.com ";


// ==========================================
// VARIABLES
// ==========================================

let destinos = [];
let personaEncontrada = null;


// ==========================================
// ELEMENTOS HTML
// ==========================================

const cedulaInput =
    document.getElementById("cedula");

const telefonoInput =
    document.getElementById("telefono");

const btnBuscar =
    document.getElementById("btnBuscar");

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

        destinos =
            await respuesta.json();

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

    if (
        !objeto ||
        typeof objeto !== "object"
    ) {
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

        const valor =
            objeto[clave];

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
                        String(
                            objeto[campo]
                        )
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

            for (
                const registro of datos
            ) {

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

    btnBuscar.textContent =
        "Buscando...";


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


        for (
            const archivo of archivos
        ) {

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

        btnBuscar.textContent =
            "Buscar";
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


    destinoSelect.innerHTML =
        "";


    if (!seccional) {

        destinoSelect.disabled =
            true;


        const opcion =
            document.createElement(
                "option"
            );


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
        document.createElement(
            "option"
        );


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
// REGISTRAR ENTREGA EN MYSQL
// ==========================================

async function registrarEntrega(datos) {

    try {

        const respuesta =
            await fetch(
                `${API_URL}/entregas`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(datos)
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                resultado.detalle ||
                "No se pudo registrar la entrega."
            );
        }


        return resultado;

    } catch (error) {

        console.error(
            "Error registrando entrega:",
            error
        );

        throw error;
    }
}


// ==========================================
// REGISTRAR ENTREGA
// ==========================================

async function entregar() {

    // ======================================
    // VALIDAR PERSONA
    // ======================================

    if (!personaEncontrada) {

        alert(
            "Primero debe buscar una C.I. válida."
        );

        cedulaInput.focus();

        return;
    }


    // ======================================
    // VALIDAR CHAPA
    // ======================================

    const chapa =
        chapaInput.value.trim();


    if (!chapa) {

        alert(
            "Ingrese la chapa del vehículo."
        );

        chapaInput.focus();

        return;
    }

    // ======================================
    // VALIDAR TELÉFONO
    // ======================================
    
    const telefono =
        telefonoInput.value.trim();
    
    if (!telefono) {
    
        alert(
            "Ingrese el número de teléfono."
        );
    
        telefonoInput.focus();
    
        return;
    }


    // ======================================
    // VALIDAR SECCIONAL
    // ======================================

    const seccional =
        Number(
            seccionalSelect.value
        );


    if (!seccional) {

        alert(
            "Seleccione una seccional."
        );

        seccionalSelect.focus();

        return;
    }


    // ======================================
    // VALIDAR DESTINO
    // ======================================

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


    // ======================================
    // VALIDAR MERCADERÍA
    // ======================================

    const mercaderia =
        mercaderiaInput.value.trim();


    if (!mercaderia) {

        alert(
            "Describa la mercadería."
        );

        mercaderiaInput.focus();

        return;
    }


    // ======================================
    // ENCONTRAR DESTINO
    // ======================================

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


    // ======================================
    // ABRIR VENTANA DE MAPS
    // ======================================
    // Se abre inmediatamente para evitar
    // que el navegador bloquee la ventana
    // después del fetch.

    let ventanaMapa = null;

    if (destino.maps) {

        ventanaMapa =
            window.open(
                "about:blank",
                "_blank"
            );
    }


    // ======================================
    // DESACTIVAR BOTÓN
    // ======================================

    btnEntregar.disabled = true;

    const textoOriginal =
        btnEntregar.textContent;

    btnEntregar.textContent =
        "Registrando...";


    try {

        // ==================================
        // ENVIAR A MYSQL
        // ==================================

        const datosEntrega = {
        
            cedula:
                normalizarCedula(
                    cedulaInput.value
                ),
        
            responsable:
                personaEncontrada.nombre,
        
            telefono:
                telefono,
        
            chapa:
                chapa.toUpperCase(),
        
            seccional:
                seccional,
        
            destino:
                destino.nombre,
        
            mercaderia:
                mercaderia
        };

        const resultado =
            await registrarEntrega(
                datosEntrega
            );


        console.log(
            "Entrega registrada:",
            resultado
        );


        // ==================================
        // FECHA Y HORA
        // ==================================

        const ahora =
            new Date();


        const fecha =
            ahora.toLocaleString(
                "es-PY",
                {
                    dateStyle:
                        "short",

                    timeStyle:
                        "medium"
                }
            );


        // ==================================
        // MOSTRAR RESUMEN
        // ==================================

        document.getElementById(
            "resumenPersona"
        ).textContent =
            personaEncontrada.nombre;


        document.getElementById(
            "resumenCedula"
        ).textContent =
            normalizarCedula(
                cedulaInput.value
            );


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


        // ==================================
        // ABRIR GOOGLE MAPS
        // ==================================

        if (destino.maps) {

            if (ventanaMapa) {

                ventanaMapa.location.href =
                    destino.maps;

            } else {

                window.open(
                    destino.maps,
                    "_blank"
                );
            }
        }


        // ==================================
        // ACTUALIZAR PENDIENTES
        // ==================================

        await cargarEntregasPendientes();


        alert(
            "✅ Entrega registrada correctamente.\n\n" +
            "Estado: PENDIENTE"
        );


        // ==================================
        // LIMPIAR CAMPOS DE ENTREGA
        // ==================================
        
        telefonoInput.value = "";
        
        chapaInput.value = "";
        
        mercaderiaInput.value = "";
        
        seccionalSelect.value = "";

        actualizarDestinos();


    } catch (error) {

        console.error(error);


        // Si hubo error, cerrar ventana
        // vacía de Google Maps.

        if (
            ventanaMapa &&
            !ventanaMapa.closed
        ) {

            ventanaMapa.close();
        }


        alert(
            "❌ No se pudo registrar la entrega.\n\n" +
            error.message +
            "\n\n" +
            "Verifique que el servidor de Logística MP esté funcionando."
        );

    } finally {

        btnEntregar.disabled =
            false;

        btnEntregar.textContent =
            textoOriginal;
    }
}


// ==========================================
// CREAR SECCIÓN DE ENTREGAS PENDIENTES
// ==========================================

function crearSeccionPendientes() {

    let contenedor =
        document.getElementById(
            "entregasPendientes"
        );


    // Si ya existe, no volver a crearla.

    if (contenedor) {

        return contenedor;
    }


    contenedor =
        document.createElement(
            "section"
        );


    contenedor.id =
        "entregasPendientes";


    contenedor.style.marginTop =
        "30px";


    contenedor.style.padding =
        "20px";


    contenedor.style.borderRadius =
        "15px";


    contenedor.style.background =
        "#ffffff";


    contenedor.style.boxShadow =
        "0 4px 15px rgba(0,0,0,0.08)";


    // ======================================
    // TÍTULO
    // ======================================

    const titulo =
        document.createElement(
            "h2"
        );


    titulo.textContent =
        "📦 Entregas pendientes";


    titulo.style.marginTop =
        "0";


    titulo.style.marginBottom =
        "15px";


    contenedor.appendChild(
        titulo
    );


    // ======================================
    // LISTA
    // ======================================

    const lista =
        document.createElement(
            "div"
        );


    lista.id =
        "listaEntregasPendientes";


    contenedor.appendChild(
        lista
    );


    // ======================================
    // AGREGAR AL DOCUMENTO
    // ======================================

    const lugar =
        resumen?.parentElement ||
        document.querySelector(
            "main"
        ) ||
        document.body;


    lugar.appendChild(
        contenedor
    );


    return contenedor;
}


// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFecha(fecha) {

    if (!fecha) {

        return "Sin fecha";
    }


    const fechaObjeto =
        new Date(fecha);


    if (
        isNaN(
            fechaObjeto.getTime()
        )
    ) {

        return String(fecha);
    }


    return fechaObjeto.toLocaleString(
        "es-PY",
        {
            dateStyle: "short",
            timeStyle: "medium"
        }
    );
}


// ==========================================
// CREAR TARJETA DE ENTREGA
// ==========================================

function crearTarjetaEntrega(
    entrega
) {

    const tarjeta =
        document.createElement(
            "div"
        );


    tarjeta.style.border =
        "1px solid #ddd";


    tarjeta.style.borderRadius =
        "12px";


    tarjeta.style.padding =
        "15px";


    tarjeta.style.marginBottom =
        "12px";


    tarjeta.style.background =
        "#f8f9fa";


    // ======================================
    // RESPONSABLE
    // ======================================

    const responsable =
        document.createElement(
            "div"
        );


    responsable.style.fontWeight =
        "bold";


    responsable.style.fontSize =
        "17px";


    responsable.textContent =
        entrega.responsable ||
        "Sin responsable";


    tarjeta.appendChild(
        responsable
    );


    // ======================================
    // DATOS
    // ======================================

    const datos =
        document.createElement(
            "div"
        );


    datos.style.marginTop =
        "8px";


    datos.style.lineHeight =
        "1.6";


    datos.innerHTML = "";


    const ci =
        document.createElement(
            "div"
        );


    ci.textContent =
        `🪪 C.I.: ${entrega.cedula || ""}`;

    const telefono =
        document.createElement(
            "div"
        );
    
    telefono.textContent =
        `📱 Teléfono: ${entrega.telefono || ""}`;


    const chapa =
        document.createElement(
            "div"
        );


    chapa.textContent =
        `🚗 Chapa: ${entrega.chapa || ""}`;


    const destino =
        document.createElement(
            "div"
        );


    destino.textContent =
        `📍 Seccional ${entrega.seccional} — ${entrega.destino || ""}`;


    const mercaderia =
        document.createElement(
            "div"
        );


    mercaderia.textContent =
        `📦 Mercadería: ${entrega.mercaderia || ""}`;


    const fecha =
        document.createElement(
            "div"
        );


    fecha.textContent =
        `🕐 Registrada: ${formatearFecha(entrega.fecha_registro)}`;


    datos.appendChild(
        ci
    );
    
    datos.appendChild(
        telefono
    );
    
    datos.appendChild(
        chapa
    );

    datos.appendChild(
        destino
    );

    datos.appendChild(
        mercaderia
    );

    datos.appendChild(
        fecha
    );


    tarjeta.appendChild(
        datos
    );


    // ======================================
    // BOTÓN ENTREGADA
    // ======================================

    const boton =
        document.createElement(
            "button"
        );


    boton.type =
        "button";


    boton.textContent =
        "✅ MARCAR COMO ENTREGADA";


    boton.style.marginTop =
        "12px";


    boton.style.width =
        "100%";


    boton.style.padding =
        "12px";


    boton.style.border =
        "none";


    boton.style.borderRadius =
        "8px";


    boton.style.cursor =
        "pointer";


    boton.style.fontWeight =
        "bold";


    boton.style.background =
        "#198754";


    boton.style.color =
        "#ffffff";


    boton.addEventListener(
        "click",
        () =>
            marcarComoEntregada(
                entrega.id,
                boton
            )
    );


    tarjeta.appendChild(
        boton
    );


    return tarjeta;
}


// ==========================================
// CARGAR ENTREGAS PENDIENTES
// ==========================================

async function cargarEntregasPendientes() {

    try {

        const contenedor =
            crearSeccionPendientes();


        const lista =
            document.getElementById(
                "listaEntregasPendientes"
            );


        if (!lista) {

            return;
        }


        lista.innerHTML =
            "";


        const cargando =
            document.createElement(
                "div"
            );


        cargando.textContent =
            "Cargando entregas...";


        lista.appendChild(
            cargando
        );


        const respuesta =
            await fetch(
                `${API_URL}/entregas?estado=PENDIENTE`
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron obtener las entregas pendientes."
            );
        }


        const entregas =
            await respuesta.json();


        lista.innerHTML =
            "";


        // ==================================
        // NO HAY PENDIENTES
        // ==================================

        if (
            !Array.isArray(entregas) ||
            entregas.length === 0
        ) {

            const vacio =
                document.createElement(
                    "div"
                );


            vacio.textContent =
                "🎉 No hay entregas pendientes.";


            vacio.style.padding =
                "15px";


            vacio.style.textAlign =
                "center";


            vacio.style.color =
                "#666";


            lista.appendChild(
                vacio
            );


            return;
        }


        // ==================================
        // MOSTRAR ENTREGAS
        // ==================================

        entregas.forEach(
            entrega => {

                const tarjeta =
                    crearTarjetaEntrega(
                        entrega
                    );


                lista.appendChild(
                    tarjeta
                );
            }
        );


    } catch (error) {

        console.error(
            "Error cargando entregas pendientes:",
            error
        );


        const lista =
            document.getElementById(
                "listaEntregasPendientes"
            );


        if (lista) {

            lista.innerHTML =
                "";


            const errorDiv =
                document.createElement(
                    "div"
                );


            errorDiv.textContent =
                "⚠️ No se pudo conectar con el servidor de Logística MP.";


            errorDiv.style.padding =
                "15px";


            errorDiv.style.color =
                "#b02a37";


            lista.appendChild(
                errorDiv
            );
        }
    }
}


// ==========================================
// MARCAR COMO ENTREGADA
// ==========================================

async function marcarComoEntregada(
    id,
    boton
) {

    if (!id) {

        alert(
            "No se encontró el ID de la entrega."
        );

        return;
    }


    const confirmar =
        confirm(
            "¿Confirmar que esta entrega fue realizada?"
        );


    if (!confirmar) {

        return;
    }


    // ======================================
    // DESACTIVAR BOTÓN
    // ======================================

    boton.disabled =
        true;


    boton.textContent =
        "Procesando...";


    try {

        const respuesta =
            await fetch(
                `${API_URL}/entregas/${id}/entregar`,
                {
                    method: "PUT"
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                resultado.detalle ||
                "No se pudo marcar como entregada."
            );
        }


        console.log(
            "Entrega completada:",
            resultado
        );


        alert(
            "✅ Entrega marcada como ENTREGADA."
        );


        // ==================================
        // ACTUALIZAR LISTA
        // ==================================

        await cargarEntregasPendientes();


    } catch (error) {

        console.error(
            "Error marcando entrega:",
            error
        );


        alert(
            "❌ No se pudo marcar la entrega.\n\n" +
            error.message
        );


        boton.disabled =
            false;


        boton.textContent =
            "✅ MARCAR COMO ENTREGADA";
    }
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

        if (
            event.key === "Enter"
        ) {

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

async function iniciarAplicacion() {

    // Cargar destinos

    await cargarDestinos();


    // Crear y cargar entregas pendientes

    crearSeccionPendientes();

    await cargarEntregasPendientes();
}


iniciarAplicacion();
