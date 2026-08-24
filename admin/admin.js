// ==========================================
// FIREBASE
// ==========================================

import {
    db,
    auth
}
from "../js/firebase.js";


import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
    query,
    orderBy
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ==========================================
// ELEMENTOS PROMOCIONES
// ==========================================

const formCodigo =
    document.getElementById(
        "form-codigo"
    );


const listaCodigos =
    document.getElementById(
        "lista-codigos"
    );


const mensajeCodigoAdmin =
    document.getElementById(
        "mensaje-codigo-admin"
    );


    // ==========================================
// PEDIDOS
// ==========================================

const listaPedidos =
    document.getElementById(
        "lista-pedidos"
    );


const contadorPedidos =
    document.getElementById(
        "contador-pedidos"
    );


const filtroPagoAdmin =
    document.getElementById(
        "filtro-pago-admin"
    );


const filtroPedidoAdmin =
    document.getElementById(
        "filtro-pedido-admin"
    );


let pedidosAdmin = [];
// ==========================================
// CREAR CÓDIGO PROMOCIONAL
// ==========================================

if (formCodigo) {

    formCodigo.addEventListener(
        "submit",

        async function(evento) {

            evento.preventDefault();


            const codigo =
                document
                    .getElementById(
                        "codigo-nombre"
                    )
                    .value
                    .trim()
                    .toUpperCase();


            const tipo =
                document
                    .getElementById(
                        "codigo-tipo"
                    )
                    .value;


            const valor =
                Number(
                    document
                        .getElementById(
                            "codigo-valor"
                        )
                        .value
                );


            const activo =
                document
                    .getElementById(
                        "codigo-activo"
                    )
                    .checked;


            const usoUnico =
    document
        .getElementById(
            "codigo-uso-unico"
        )
        .checked;

            if (
                !codigo ||
                valor <= 0
            ) {

                mensajeCodigoAdmin.textContent =
                    "Completá correctamente los datos.";

                return;

            }


            try {

                await addDoc(
                    collection(
                        db,
                        "codigos"
                    ),
                    {
    codigo:
        codigo,

    tipo:
        tipo,

    valor:
        valor,

    activo:
        activo,

    usoUnico:
        usoUnico,

    canjeado:
        false,

    canjeadoPor:
        null,

    canjeadoEn:
        null
}
                );


                mensajeCodigoAdmin.textContent =
                    "Código creado ✓";


                formCodigo.reset();


                document
                    .getElementById(
                        "codigo-activo"
                    )
                    .checked = true;


            } catch (error) {

                console.error(
                    error
                );


                mensajeCodigoAdmin.textContent =
                    "Error creando código.";

            }

        }
    );

}

// ==========================================
// MOSTRAR CÓDIGOS
// ==========================================

const codigosRef =
    collection(
        db,
        "codigos"
    );


onSnapshot(
    codigosRef,

    function(snapshot) {

        if (!listaCodigos) {
            return;
        }


        listaCodigos.innerHTML =
            "";


        snapshot.forEach(
            function(documento) {

                const codigo =
                    documento.data();


                const tarjeta =
                    document.createElement(
                        "div"
                    );


                tarjeta.classList.add(
                    "codigo-admin"
                );


                let descuentoTexto;


                if (
                    codigo.tipo ===
                    "porcentaje"
                ) {

                    descuentoTexto =
                        codigo.valor +
                        "%";

                } else {

                    descuentoTexto =
                        "$" +
                        Number(
                            codigo.valor
                        ).toLocaleString(
                            "es-AR"
                        );

                }


                tarjeta.innerHTML = `

                    <div>

                        <strong>
                            ${codigo.codigo}
                        </strong>

                        <p>
                            Descuento:
                            ${descuentoTexto}
                        </p>

                        <p>
                            ${
                                codigo.activo
                                    ? "Activo"
                                    : "Desactivado"
                            }
                        </p>

                        <p>
    ${
        codigo.usoUnico
            ? "🎟️ Un solo uso"
            : "♾️ Usos ilimitados"
    }
</p>

${
    codigo.usoUnico
        ? `
            <p>
                ${
                    codigo.canjeado
                        ? "🔴 Canjeado"
                        : "🟢 Disponible"
                }
            </p>
        `
        : ""
}
                    </div>


                    <button
                        class="eliminar-codigo"
                        data-id="${documento.id}"
                    >
                        Eliminar
                    </button>

                `;


                listaCodigos.appendChild(
                    tarjeta
                );

            }
        );


        activarEliminarCodigos();

    }
);

// ==========================================
// ELIMINAR CÓDIGOS
// ==========================================

function activarEliminarCodigos() {

    document
        .querySelectorAll(
            ".eliminar-codigo"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",

                    async function() {

                        const confirmar =
                            confirm(
                                "¿Eliminar este código?"
                            );


                        if (!confirmar) {
                            return;
                        }


                        await deleteDoc(
                            doc(
                                db,
                                "codigos",
                                boton.dataset.id
                            )
                        );

                    }

                );

            }
        );

}



import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";



// ==========================================
// CLOUDINARY
// ==========================================

const CLOUD_NAME = "jw16qafb";

const UPLOAD_PRESET = "urban_street_productos";



// ==========================================
// ELEMENTOS DEL LOGIN
// ==========================================

const loginContainer =
    document.getElementById("login-container");


const panelAdmin =
    document.getElementById("panel-admin");


const loginForm =
    document.getElementById("login-form");


const loginMensaje =
    document.getElementById("login-mensaje");


const botonCerrarSesion =
    document.getElementById("cerrar-sesion");



// ==========================================
// ELEMENTOS DEL FORMULARIO
// ==========================================

const formulario =
    document.getElementById("form-producto");


const mensaje =
    document.getElementById("mensaje");


const listaProductos =
    document.getElementById("lista-productos");


const inputImagen =
    document.getElementById("imagen");


const previewContainer =
    document.getElementById("preview-container");


const previewImagen =
    document.getElementById("preview-imagen");



// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener(
    "submit",

    async function(evento) {

        evento.preventDefault();


        const email =
            document
                .getElementById("login-email")
                .value
                .trim();


        const password =
            document
                .getElementById("login-password")
                .value;


        try {

            loginMensaje.textContent =
                "Ingresando...";


            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            loginMensaje.textContent =
                "";

        } catch (error) {

            console.error(
                "Error login:",
                error
            );


            loginMensaje.textContent =
                "Email o contraseña incorrectos.";

        }

    }
);



// ==========================================
// DETECTAR SESIÓN
// ==========================================

onAuthStateChanged(
    auth,

    function(usuario) {

        if (usuario) {

            loginContainer.style.display =
                "none";


            panelAdmin.style.display =
                "block";

        } else {

            loginContainer.style.display =
                "flex";


            panelAdmin.style.display =
                "none";

        }

    }
);



// ==========================================
// CERRAR SESIÓN
// ==========================================

botonCerrarSesion.addEventListener(
    "click",

    async function() {

        try {

            await signOut(auth);

        } catch (error) {

            console.error(
                "Error cerrando sesión:",
                error
            );

        }

    }
);



// ==========================================
// VISTA PREVIA DE LA IMAGEN
// ==========================================

inputImagen.addEventListener(
    "change",

    function() {

        const archivo =
            inputImagen.files[0];


        if (!archivo) {

            previewContainer.style.display =
                "none";

            return;

        }


        const urlTemporal =
            URL.createObjectURL(
                archivo
            );


        previewImagen.src =
            urlTemporal;


        previewContainer.style.display =
            "block";

    }
);



// ==========================================
// SUBIR IMAGEN A CLOUDINARY
// ==========================================

async function subirImagenCloudinary(
    archivo
) {

    console.log(
        "Intentando subir imagen..."
    );


    console.log(
        "Cloud name:",
        CLOUD_NAME
    );


    console.log(
        "Preset:",
        UPLOAD_PRESET
    );


    console.log(
        "Archivo:",
        archivo
    );


    const formData =
        new FormData();


    formData.append(
        "file",
        archivo
    );


    formData.append(
        "upload_preset",
        UPLOAD_PRESET
    );


    const respuesta =
        await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );


    const datos =
        await respuesta.json();


    console.log(
        "Respuesta Cloudinary:",
        datos
    );


    if (!respuesta.ok) {

        throw new Error(

            datos.error?.message ||

            "Error desconocido al subir imagen"

        );

    }


    return {

        url:
            datos.secure_url,

        publicId:
            datos.public_id

    };

}



// ==========================================
// AGREGAR PRODUCTO
// ==========================================

formulario.addEventListener(
    "submit",

    async function(evento) {

        evento.preventDefault();


        const archivo =
            inputImagen.files[0];


        if (!archivo) {

            mensaje.textContent =
                "Seleccioná una imagen.";

            return;

        }


        try {

            mensaje.textContent =
                "Subiendo imagen...";


            // ==============================
            // SUBIR A CLOUDINARY
            // ==============================

            const resultadoImagen =
                await subirImagenCloudinary(
                    archivo
                );


            const urlImagen =
                resultadoImagen.url;


            const imagenPublicId =
                resultadoImagen.publicId;



            // ==============================
            // GUARDAR PRODUCTO
            // ==============================

            mensaje.textContent =
                "Guardando producto...";


            const producto = {

                nombre:
                    document
                        .getElementById(
                            "nombre"
                        )
                        .value
                        .trim(),


                marca:
                    document
                        .getElementById(
                            "marca"
                        )
                        .value
                        .trim(),


                precio:
                    Number(
                        document
                            .getElementById(
                                "precio"
                            )
                            .value
                    ),


                talles: {

                    "39":
                        Number(
                            document
                                .getElementById(
                                    "talle39"
                                )
                                .value
                        ),

                    "40":
                        Number(
                            document
                                .getElementById(
                                    "talle40"
                                )
                                .value
                        ),

                    "41":
                        Number(
                            document
                                .getElementById(
                                    "talle41"
                                )
                                .value
                        ),

                    "42":
                        Number(
                            document
                                .getElementById(
                                    "talle42"
                                )
                                .value
                        ),

                    "43":
                        Number(
                            document
                                .getElementById(
                                    "talle43"
                                )
                                .value
                        ),

                    "44":
                        Number(
                            document
                                .getElementById(
                                    "talle44"
                                )
                                .value
                        )

                },


                estado:
                    document
                        .getElementById(
                            "estado"
                        )
                        .value,


                imagen:
                    urlImagen,


                imagenPublicId:
                    imagenPublicId,


                destacado:
                    document
                        .getElementById(
                            "destacado"
                        )
                        .checked,


                visible:
                    document
                        .getElementById(
                            "visible"
                        )
                        .checked

            };


            await addDoc(
                collection(
                    db,
                    "productos"
                ),

                producto
            );


            mensaje.textContent =
                "Producto agregado correctamente ✓";


            formulario.reset();


            document
                .getElementById(
                    "visible"
                )
                .checked = true;


            previewContainer.style.display =
                "none";


        } catch (error) {

            console.error(
                "Error agregando producto:",
                error
            );


            mensaje.textContent =
                "Error: " +
                error.message;

        }

    }
);



// ==========================================
// MOSTRAR PRODUCTOS
// ==========================================

const productosRef =
    collection(
        db,
        "productos"
    );


onSnapshot(

    productosRef,

    function(snapshot) {

        listaProductos.innerHTML =
            "";


        snapshot.forEach(
            function(documento) {

                const producto =
                    documento.data();


                const id =
                    documento.id;


                const tarjeta =
                    document.createElement(
                        "div"
                    );


                tarjeta.classList.add(
                    "producto-admin"
                );


                // ==========================
                // MOSTRAR TALLES CON STOCK
                // ==========================

                const tallesDisponibles =
                    Object.entries(
                        producto.talles ||
                        {}
                    )

                    .filter(
                        ([talle, stock]) =>
                            Number(stock) > 0
                    )

                    .map(
                        ([talle, stock]) =>
                            `${talle} (${stock})`
                    )

                    .join(" - ");



                tarjeta.innerHTML = `

                    <img
                        src="${producto.imagen || ""}"
                        alt="${producto.nombre || ""}"
                    >


                    <div>

                        <h3>
                            ${producto.nombre || ""}
                        </h3>


                        <p>
                            ${producto.marca || ""}
                        </p>


                        <p>
                            $${Number(
                                producto.precio || 0
                            ).toLocaleString(
                                "es-AR"
                            )}
                        </p>


                        <p>
                            Talles:
                            ${
                                tallesDisponibles ||
                                "Sin stock"
                            }
                        </p>


                        <p>
                            Estado:
                            ${
                                producto.estado ||
                                "Sin etiqueta"
                            }
                        </p>


                        <p>
                            ${
                                producto.visible
                                    ? "Visible"
                                    : "Oculto"
                            }
                        </p>


                        <p>
                            ${
                                producto.destacado
                                    ? "Destacado"
                                    : ""
                            }
                        </p>

                    </div>


                    <button
                        class="btn-eliminar"
                        data-id="${id}"
                    >
                        Eliminar
                    </button>

                `;


                listaProductos.appendChild(
                    tarjeta
                );

            }
        );


        activarEliminar();

    },

    function(error) {

        console.error(
            "Error leyendo productos:",
            error
        );


        listaProductos.innerHTML =
            "<p>Error cargando productos.</p>";

    }

);

function formatearPrecioAdmin(
    precio
) {

    return new Intl.NumberFormat(
        "es-AR",
        {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0
        }
    ).format(
        Number(precio) || 0
    );

}

// ==========================================
// ESCUCHAR PEDIDOS
// ==========================================

const pedidosRef =
    collection(
        db,
        "pedidos"
    );


const consultaPedidos =
    query(
        pedidosRef,
        orderBy(
            "creadoEn",
            "desc"
        )
    );


onSnapshot(

    consultaPedidos,

    function(snapshot) {

        pedidosAdmin = [];


        snapshot.forEach(
            function(documento) {

                pedidosAdmin.push({

                    id:
                        documento.id,

                    ...documento.data()

                });

            }
        );


        aplicarFiltrosPedidos();

    },

    function(error) {

        console.error(
            "Error leyendo pedidos:",
            error
        );


        if (listaPedidos) {

            listaPedidos.innerHTML =
                "<p>Error cargando pedidos.</p>";

        }

    }

);

// ==========================================
// FILTRAR PEDIDOS
// ==========================================

function aplicarFiltrosPedidos() {

    let resultados =
        [...pedidosAdmin];


    const estadoPago =
        filtroPagoAdmin?.value || "";


    const estadoPedido =
        filtroPedidoAdmin?.value || "";


    if (estadoPago) {

        resultados =
            resultados.filter(
                pedido =>
                    pedido.estadoPago ===
                    estadoPago
            );

    }


    if (estadoPedido) {

        resultados =
            resultados.filter(
                pedido =>
                    pedido.estadoPedido ===
                    estadoPedido
            );

    }


    mostrarPedidos(
        resultados
    );

}

if (filtroPagoAdmin) {

    filtroPagoAdmin.addEventListener(
        "change",
        aplicarFiltrosPedidos
    );

}


if (filtroPedidoAdmin) {

    filtroPedidoAdmin.addEventListener(
        "change",
        aplicarFiltrosPedidos
    );

}

// ==========================================
// MOSTRAR PEDIDOS
// ==========================================

function mostrarPedidos(lista) {

    if (!listaPedidos) {
        return;
    }


    listaPedidos.innerHTML =
        "";


    if (contadorPedidos) {

        contadorPedidos.textContent =
            `${lista.length} ${
                lista.length === 1
                    ? "pedido"
                    : "pedidos"
            }`;

    }


    if (lista.length === 0) {

        listaPedidos.innerHTML = `

            <div class="pedido-admin">

                <div class="pedido-cabecera">

                    <p>
                        No hay pedidos para mostrar.
                    </p>

                </div>

            </div>

        `;

        return;

    }


    lista.forEach(
        pedido => {

            // ==============================
            // FECHA
            // ==============================

            let fechaTexto =
                "Fecha no disponible";


            if (
                pedido.creadoEn &&
                pedido.creadoEn.toDate
            ) {

                fechaTexto =
                    pedido
                        .creadoEn
                        .toDate()
                        .toLocaleString(
                            "es-AR"
                        );

            }


            // ==============================
            // PRODUCTOS
            // ==============================

            const productosHTML =
                (
                    pedido.productos ||
                    []
                )
                .map(
                    producto => `

                        <div class="producto-pedido">

                            <strong>
                                ${producto.nombre}
                            </strong>

                            <p>
                                Marca:
                                ${producto.marca || "-"}
                            </p>

                            <p>
                                Talle:
                                ${producto.talle}
                            </p>

                            <p>
                                Cantidad:
                                ${producto.cantidad}
                            </p>

                            <p>
                                ${
                                    formatearPrecioAdmin(
                                        producto.subtotal
                                    )
                                }
                            </p>

                        </div>

                    `
                )
                .join("");


            // ==============================
            // ENTREGA
            // ==============================

            let entregaHTML;


            if (
                pedido.entrega?.tipo ===
                "envio"
            ) {

                const direccion =
                    pedido.entrega
                        ?.direccion ||
                    {};


                entregaHTML = `

                    <p>
                        <strong>
                            Envío a domicilio
                        </strong>
                    </p>

                    <p>
                        ${direccion.calle || ""}
                    </p>

                    <p>
                        ${direccion.localidad || ""}
                        -
                        ${direccion.provincia || ""}
                    </p>

                    <p>
                        CP:
                        ${direccion.cp || ""}
                    </p>

                `;

            } else {

                entregaHTML = `

                    <p>
                        <strong>
                            Retiro
                        </strong>
                    </p>

                    <p>
                        Sin costo de envío
                    </p>

                `;

            }


            // ==============================
            // CLASE PAGO
            // ==============================

            const estadoPago =
                pedido.estadoPago ||
                "pendiente";


            const estadoPedido =
                pedido.estadoPedido ||
                "nuevo";


            const tarjeta =
                document.createElement(
                    "article"
                );


            tarjeta.classList.add(
                "pedido-admin"
            );


            tarjeta.innerHTML = `

                <!-- CABECERA -->

                <div class="pedido-cabecera">

                    <div>

                        <div class="pedido-codigo">

                            ${
                                pedido.codigo ||
                                pedido.id
                            }

                        </div>

                        <div class="pedido-fecha">

                            ${fechaTexto}

                        </div>

                    </div>


                    <div class="pedido-estados">

                        <span
                            class="
                                estado-pago
                                pago-${estadoPago}
                            "
                        >
                            PAGO:
                            ${estadoPago}
                        </span>


                        <span
                            class="
                                estado-pedido
                                pedido-${estadoPedido}
                            "
                        >
                            ${estadoPedido}
                        </span>

                    </div>

                </div>


                <!-- INFORMACIÓN -->

                <div class="pedido-contenido">

                    <div class="pedido-seccion">

                        <h4>
                            CLIENTE
                        </h4>

                        <p>
                            ${
                                pedido.cliente
                                    ?.nombre ||
                                "-"
                            }
                        </p>

                        <p>
                            📱
                            ${
                                pedido.cliente
                                    ?.telefono ||
                                "-"
                            }
                        </p>

                        <p>
                            ✉️
                            ${
                                pedido.cliente
                                    ?.email ||
                                "-"
                            }
                        </p>

                    </div>


                    <div class="pedido-seccion">

                        <h4>
                            ENTREGA
                        </h4>

                        ${entregaHTML}

                    </div>


                    <div class="pedido-seccion">

                        <h4>
                            PRODUCTOS
                        </h4>

                        ${productosHTML}

                    </div>


                    <div class="pedido-seccion">

                        <h4>
                            COMPRA
                        </h4>

                        <p>
                            Código:
                            ${
                                pedido.codigoPromocional ||
                                "Sin código"
                            }
                        </p>

                        <p>
                            Método:
                            ${
                                pedido.origen ===
                                "mercadopago"
                                    ? "Mercado Pago"
                                    : pedido.origen ||
                                      "-"
                            }
                        </p>

                    </div>

                </div>


                <!-- TOTALES -->

                <div class="pedido-totales">

                    <div class="pedido-total-fila">

                        <span>
                            Productos
                        </span>

                        <span>
                            ${
                                formatearPrecioAdmin(
                                    pedido.subtotal
                                )
                            }
                        </span>

                    </div>


                    <div class="pedido-total-fila">

                        <span>
                            Descuento
                        </span>

                        <span>

                            -${
                                formatearPrecioAdmin(
                                    pedido.descuento
                                )
                            }

                        </span>

                    </div>


                    <div class="pedido-total-fila">

                        <span>
                            Envío
                        </span>

                        <span>

                            ${
                                Number(
                                    pedido.envio
                                ) === 0

                                    ? "GRATIS"

                                    : formatearPrecioAdmin(
                                        pedido.envio
                                    )
                            }

                        </span>

                    </div>


                    <div
                        class="
                            pedido-total-fila
                            pedido-total-final
                        "
                    >

                        <strong>
                            TOTAL
                        </strong>

                        <strong>

                            ${
                                formatearPrecioAdmin(
                                    pedido.total
                                )
                            }

                        </strong>

                    </div>

                </div>


                <!-- ESTADO PEDIDO -->

                <div class="pedido-acciones">

                    <label>
                        Estado del pedido
                    </label>


                    <select
                        class="cambiar-estado-pedido"
                        data-id="${pedido.id}"
                    >

                        <option
                            value="nuevo"
                            ${
                                estadoPedido ===
                                "nuevo"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Nuevo
                        </option>


                        <option
                            value="preparando"
                            ${
                                estadoPedido ===
                                "preparando"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Preparando
                        </option>


                        <option
                            value="enviado"
                            ${
                                estadoPedido ===
                                "enviado"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Enviado
                        </option>


                        <option
                            value="entregado"
                            ${
                                estadoPedido ===
                                "entregado"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Entregado
                        </option>


                        <option
                            value="cancelado"
                            ${
                                estadoPedido ===
                                "cancelado"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Cancelado
                        </option>

                    </select>

                </div>

            `;


            listaPedidos.appendChild(
                tarjeta
            );

        }
    );


    activarCambioEstadoPedidos();

}

// ==========================================
// CAMBIAR ESTADO DEL PEDIDO
// ==========================================

function activarCambioEstadoPedidos() {

    const selects =
        document.querySelectorAll(
            ".cambiar-estado-pedido"
        );


    selects.forEach(
        select => {

            select.addEventListener(
                "change",

                async function() {

                    const pedidoId =
                        select.dataset.id;


                    const nuevoEstado =
                        select.value;


                    try {

                        await updateDoc(

                            doc(
                                db,
                                "pedidos",
                                pedidoId
                            ),

                            {
                                estadoPedido:
                                    nuevoEstado
                            }

                        );


                    } catch (error) {

                        console.error(
                            "Error actualizando pedido:",
                            error
                        );


                        alert(
                            "No se pudo actualizar el pedido."
                        );

                    }

                }
            );

        }
    );

}

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

function activarEliminar() {

    const botones =
        document.querySelectorAll(
            ".btn-eliminar"
        );


    botones.forEach(
        function(boton) {

            boton.addEventListener(
                "click",

                async function() {

                    const id =
                        boton.dataset.id;


                    const confirmar =
                        confirm(
                            "¿Seguro que querés eliminar este producto?"
                        );


                    if (!confirmar) {

                        return;

                    }


                    try {

                        await deleteDoc(
                            doc(
                                db,
                                "productos",
                                id
                            )
                        );


                    } catch (error) {

                        console.error(
                            "Error eliminando producto:",
                            error
                        );


                        alert(
                            "No se pudo eliminar el producto."
                        );

                    }

                }
            );

        }
    );

}