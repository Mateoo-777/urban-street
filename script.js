// ==========================================
// FIREBASE
// ==========================================

import {
    escucharProductos,
    buscarCodigoPromocion,
    crearPedido
}
from "./js/productosFirebase.js";



// ==========================================
// PRODUCTOS
// ==========================================

let productos = [];


// Guarda el talle seleccionado de cada producto
const tallesSeleccionados = {};



// ==========================================
// CARRITO
// ==========================================

let carrito =
    JSON.parse(
        localStorage.getItem("urbanStreetCarrito")
    ) || [];

// ==========================================
// CÓDIGO DE DESCUENTO
// ==========================================

let codigoAplicado =
    JSON.parse(
        localStorage.getItem(
            "urbanStreetCodigo"
        )
    ) || null;

// ==========================================
// ELEMENTOS HTML
// ==========================================

const inputCodigo =
    document.getElementById(
        "codigo-promocion"
    );


const botonAplicarCodigo =
    document.getElementById(
        "aplicar-codigo"
    );


const mensajeCodigo =
    document.getElementById(
        "mensaje-codigo"
    );


const descuentoContainer =
    document.getElementById(
        "descuento-container"
    );


const descuentoTotal =
    document.getElementById(
        "descuento-total"
    );

const productosGrid =
    document.getElementById("productos-grid");


const carritoSidebar =
    document.getElementById("carrito");


const carritoOverlay =
    document.getElementById("carrito-overlay");


const abrirCarritoBtn =
    document.getElementById("abrir-carrito");


const cerrarCarritoBtn =
    document.getElementById("cerrar-carrito");


const carritoProductos =
    document.getElementById("carrito-productos");


const carritoVacio =
    document.getElementById("carrito-vacio");


const carritoTotal =
    document.getElementById("carrito-total");


const contadorCarrito =
    document.getElementById("contador-carrito");


const buscador =
    document.getElementById("buscador");


const sinResultados =
    document.getElementById("sin-resultados");


const notificacion =
    document.getElementById("notificacion");



// ==========================================
// FILTROS
// ==========================================

const filtroMarca =
    document.getElementById("filtro-marca");


const filtroTalle =
    document.getElementById("filtro-talle");


const filtroEstado =
    document.getElementById("filtro-estado");


const ordenProductos =
    document.getElementById("orden-productos");


const limpiarFiltrosBtn =
    document.getElementById("limpiar-filtros");


// ==========================================
// APLICAR CÓDIGO PROMOCIONAL
// ==========================================

if (botonAplicarCodigo) {

    botonAplicarCodigo.addEventListener(
        "click",

        async function() {

            const codigo =
                inputCodigo.value
                    .trim()
                    .toUpperCase();


            if (!codigo) {

                mensajeCodigo.textContent =
                    "Ingresá un código.";

                return;

            }


            try {

                mensajeCodigo.textContent =
                    "Comprobando código...";


                const codigoEncontrado =
                    await buscarCodigoPromocion(
                        codigo
                    );


                if (!codigoEncontrado) {

                    codigoAplicado =
                        null;


                    localStorage.removeItem(
                        "urbanStreetCodigo"
                    );


                    mensajeCodigo.textContent =
                        "Código inválido o vencido.";


                    actualizarCarrito();

                    return;

                }


                codigoAplicado =
                    codigoEncontrado;


                localStorage.setItem(

                    "urbanStreetCodigo",

                    JSON.stringify(
                        codigoAplicado
                    )

                );


                mensajeCodigo.textContent =
                    `Código ${codigo} aplicado ✓`;


                actualizarCarrito();


            } catch (error) {

                console.error(
                    error
                );


                mensajeCodigo.textContent =
                    "No se pudo verificar el código.";

            }

        }
    );

}

// ==========================================
// FORMATEAR PRECIO
// ==========================================

function formatearPrecio(precio) {

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
// MOSTRAR PRODUCTOS
// ==========================================

function mostrarProductos(lista) {

    if (!productosGrid) {
        return;
    }


    productosGrid.innerHTML = "";


    const productosVisibles =
        lista.filter(
            producto =>
                producto.visible !== false
        );


    if (productosVisibles.length === 0) {

        if (sinResultados) {

            sinResultados.style.display =
                "block";

        }

        return;

    }


    if (sinResultados) {

        sinResultados.style.display =
            "none";

    }


    productosVisibles.forEach(
        producto => {

            const tallesDisponibles =
                Object.entries(
                    producto.talles || {}
                )
                .filter(
                    ([talle, stock]) =>
                        Number(stock) > 0
                );


            const tarjeta =
                document.createElement(
                    "article"
                );


            tarjeta.classList.add(
                "producto"
            );


            tarjeta.innerHTML = `

                ${
                    producto.estado
                        ? `
                        <span class="producto-etiqueta">
                            ${producto.estado}
                        </span>
                        `
                        : ""
                }


                <div class="producto-imagen">

                    <img
                        src="${producto.imagen || ""}"
                        alt="${producto.nombre || "Producto"}"
                        loading="lazy"
                    >

                </div>


                <div class="producto-info">

                    <p class="producto-marca">

                        ${
                            producto.marca ||
                            "URBAN STREET"
                        }

                    </p>


                    <h3>

                        ${
                            producto.nombre ||
                            "Producto"
                        }

                    </h3>

                    <div class="producto-disponibilidad">

    ${
        producto.disponibilidad === "encargo"
            ? `
                <span class="disponibilidad-encargo">
                    📦 POR ENCARGO
                </span>

                <small>
                    Disponible en depósito · Entrega estimada de 3 a 7 días
                </small>
            `
            : `
                <span class="disponibilidad-inmediato">
                    ⚡ STOCK INMEDIATO
                </span>
            `
    }

</div>


                    <div class="producto-talles">

                        ${
                            tallesDisponibles.length > 0

                                ? tallesDisponibles
                                    .map(
                                        ([talle]) => `

                                            <button
                                                class="talle-btn ${
                                                    tallesSeleccionados[
                                                        producto.id
                                                    ] === talle
                                                        ? "seleccionado"
                                                        : ""
                                                }"
                                                data-talle="${talle}"
                                                data-producto="${producto.id}"
                                            >
                                                ${talle}
                                            </button>

                                        `
                                    )
                                    .join("")

                                : `
                                    <span class="sin-stock">
                                        Sin stock
                                    </span>
                                `
                        }

                    </div>


                    <div class="producto-bottom">

                        <span class="producto-precio">

                            ${formatearPrecio(
                                producto.precio
                            )}

                        </span>


                        <button
                            class="btn-agregar"
                            data-id="${producto.id}"

                            ${
                                tallesDisponibles.length === 0
                                    ? "disabled"
                                    : ""
                            }
                        >
                            Añadir
                        </button>

                    </div>

                </div>

            `;


            productosGrid.appendChild(
                tarjeta
            );

        }
    );


    activarBotonesTalle();

    activarBotonesAgregar();

}



// ==========================================
// APLICAR FILTROS
// ==========================================

function aplicarFiltros() {

    let resultados =
        [...productos];



    // ======================================
    // BUSCADOR
    // ======================================

    const texto =
        buscador
            ?.value
            .toLowerCase()
            .trim()
        || "";


    if (texto) {

        resultados =
            resultados.filter(
                producto => {

                    const nombre =
                        producto.nombre
                            ?.toLowerCase()
                        || "";


                    const marca =
                        producto.marca
                            ?.toLowerCase()
                        || "";


                    const estado =
                        producto.estado
                            ?.toLowerCase()
                        || "";


                    return (

                        nombre.includes(texto)

                        ||

                        marca.includes(texto)

                        ||

                        estado.includes(texto)

                    );

                }
            );

    }



    // ======================================
    // MARCA
    // ======================================

    const marcaSeleccionada =
        filtroMarca?.value || "";


    if (marcaSeleccionada) {

        resultados =
            resultados.filter(
                producto => {

                    const marca =
                        producto.marca
                            ?.toLowerCase()
                            .trim()
                        || "";


                    return (
                        marca ===
                        marcaSeleccionada
                            .toLowerCase()
                            .trim()
                    );

                }
            );

    }



    // ======================================
    // TALLE
    // ======================================

    const talleSeleccionado =
        filtroTalle?.value || "";


    if (talleSeleccionado) {

        resultados =
            resultados.filter(
                producto => {

                    const stock =
                        producto.talles?.[
                            talleSeleccionado
                        ];


                    return (
                        Number(stock) > 0
                    );

                }
            );

    }



    // ======================================
    // ESTADO
    // ======================================

    const estadoSeleccionado =
        filtroEstado?.value || "";


    if (estadoSeleccionado) {

        resultados =
            resultados.filter(
                producto => {

                    const estado =
                        producto.estado
                            ?.toLowerCase()
                            .trim()
                        || "";


                    return (
                        estado ===
                        estadoSeleccionado
                            .toLowerCase()
                            .trim()
                    );

                }
            );

    }



    // ======================================
    // ORDENAR
    // ======================================

    const orden =
        ordenProductos?.value || "";


    if (orden === "menor-precio") {

        resultados.sort(
            (a, b) =>
                Number(a.precio) -
                Number(b.precio)
        );

    }


    if (orden === "mayor-precio") {

        resultados.sort(
            (a, b) =>
                Number(b.precio) -
                Number(a.precio)
        );

    }


    if (orden === "nombre") {

        resultados.sort(
            (a, b) =>

                (a.nombre || "")
                    .localeCompare(
                        b.nombre || "",
                        "es"
                    )

        );

    }



    // ======================================
    // MOSTRAR
    // ======================================

    mostrarProductos(
        resultados
    );

}



// ==========================================
// BOTONES DE TALLES
// ==========================================

function activarBotonesTalle() {

    const botones =
        document.querySelectorAll(
            ".talle-btn"
        );


    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                function() {

                    const productoId =
                        boton.dataset.producto;


                    const talle =
                        boton.dataset.talle;


                    tallesSeleccionados[
                        productoId
                    ] = talle;


                    const botonesProducto =
                        document.querySelectorAll(
                            `.talle-btn[data-producto="${productoId}"]`
                        );


                    botonesProducto.forEach(
                        botonTalle => {

                            botonTalle.classList.remove(
                                "seleccionado"
                            );

                        }
                    );


                    boton.classList.add(
                        "seleccionado"
                    );

                }
            );

        }
    );

}



// ==========================================
// BOTONES AGREGAR
// ==========================================

function activarBotonesAgregar() {

    const botones =
        document.querySelectorAll(
            ".btn-agregar"
        );


    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                function() {

                    const id =
                        boton.dataset.id;


                    agregarAlCarrito(
                        id
                    );

                }
            );

        }
    );

}



// ==========================================
// AGREGAR AL CARRITO
// ==========================================

function agregarAlCarrito(id) {

    const producto =
        productos.find(
            producto =>
                producto.id === id
        );


    if (!producto) {
        return;
    }


    const talleSeleccionado =
        tallesSeleccionados[id];


    if (!talleSeleccionado) {

        alert(
            "Seleccioná un talle antes de agregar al carrito."
        );

        return;

    }


    const stockDisponible =
        Number(
            producto.talles?.[
                talleSeleccionado
            ] || 0
        );


    if (stockDisponible <= 0) {

        alert(
            "Ese talle no tiene stock disponible."
        );

        return;

    }


    const productoEnCarrito =
        carrito.find(
            item =>
                item.id === id &&
                item.talleSeleccionado ===
                    talleSeleccionado
        );


    if (productoEnCarrito) {

        if (
            productoEnCarrito.cantidad >=
            stockDisponible
        ) {

            alert(
                "No hay más stock disponible de ese talle."
            );

            return;

        }


        productoEnCarrito.cantidad++;

    } else {

        carrito.push({

            id:
                producto.id,

            nombre:
                producto.nombre,

            marca:
                producto.marca,

            precio:
                Number(
                    producto.precio
                ),

            imagen:
                producto.imagen,

            talles:
                producto.talles,

            talleSeleccionado:
                talleSeleccionado,

            cantidad:
                1

        });

    }


    guardarCarrito();

    actualizarCarrito();

    mostrarNotificacion();

}



// ==========================================
// ELIMINAR DEL CARRITO
// ==========================================

function eliminarProducto(
    id,
    talleSeleccionado
) {

    carrito =
        carrito.filter(
            producto =>
                !(
                    producto.id === id &&
                    producto.talleSeleccionado ===
                        talleSeleccionado
                )
        );


    guardarCarrito();

    actualizarCarrito();

}



// ==========================================
// CAMBIAR CANTIDAD
// ==========================================

function cambiarCantidad(
    id,
    talleSeleccionado,
    cambio
) {

    const productoCarrito =
        carrito.find(
            producto =>
                producto.id === id &&
                producto.talleSeleccionado ===
                    talleSeleccionado
        );


    if (!productoCarrito) {
        return;
    }


    const productoOriginal =
        productos.find(
            producto =>
                producto.id === id
        );


    const stockDisponible =
        Number(

            productoOriginal
                ?.talles
                ?.[talleSeleccionado]

            ||

            productoCarrito
                ?.talles
                ?.[talleSeleccionado]

            ||

            0

        );


    if (
        cambio > 0 &&
        productoCarrito.cantidad >=
            stockDisponible
    ) {

        alert(
            "No hay más stock disponible de ese talle."
        );

        return;

    }


    productoCarrito.cantidad +=
        cambio;


    if (
        productoCarrito.cantidad <= 0
    ) {

        eliminarProducto(
            id,
            talleSeleccionado
        );

        return;

    }


    guardarCarrito();

    actualizarCarrito();

}

// ==========================================
// CALCULAR DESCUENTO
// ==========================================

function calcularDescuento(
    subtotal
) {

    if (!codigoAplicado) {

        return 0;

    }


    let descuento = 0;


    // PORCENTAJE

    if (
        codigoAplicado.tipo ===
        "porcentaje"
    ) {

        descuento =
            subtotal *
            (
                Number(
                    codigoAplicado.valor
                ) / 100
            );

    }


    // MONTO FIJO

    if (
        codigoAplicado.tipo ===
        "fijo"
    ) {

        descuento =
            Number(
                codigoAplicado.valor
            );

    }


    // Nunca puede descontar más
    // que el total de la compra

    if (descuento > subtotal) {

        descuento =
            subtotal;

    }


    return descuento;

}

// ==========================================
// ACTUALIZAR CARRITO
// ==========================================

function actualizarCarrito() {

    if (!carritoProductos) {
        return;
    }


    carritoProductos.innerHTML =
        "";


    if (carrito.length === 0) {

        if (carritoVacio) {

            carritoVacio.style.display =
                "block";

        }

    } else {

        if (carritoVacio) {

            carritoVacio.style.display =
                "none";

        }

    }


    carrito.forEach(
        producto => {

            const item =
                document.createElement(
                    "div"
                );


            item.classList.add(
                "carrito-item"
            );


            item.innerHTML = `

                <img
                    src="${producto.imagen || ""}"
                    alt="${producto.nombre || ""}"
                >


                <div class="carrito-item-info">

                    <h4>
                        ${producto.nombre}
                    </h4>


                    <p>
                        Talle:
                        ${
                            producto.talleSeleccionado ||
                            "Sin seleccionar"
                        }
                    </p>


                    <p class="carrito-item-precio">

                        ${formatearPrecio(
                            producto.precio
                        )}

                    </p>


                    <div class="item-controles">

                        <button
                            class="restar"
                            data-id="${producto.id}"
                            data-talle="${producto.talleSeleccionado}"
                        >
                            −
                        </button>


                        <span>
                            ${producto.cantidad}
                        </span>


                        <button
                            class="sumar"
                            data-id="${producto.id}"
                            data-talle="${producto.talleSeleccionado}"
                        >
                            +
                        </button>


                        <button
                            class="eliminar-item"
                            data-id="${producto.id}"
                            data-talle="${producto.talleSeleccionado}"
                        >
                            ✕
                        </button>

                    </div>

                </div>

            `;


            carritoProductos.appendChild(
                item
            );

        }
    );


    activarControlesCarrito();



    // ======================================
    // CONTADOR
    // ======================================

    const cantidadTotal =
        carrito.reduce(
            (
                total,
                producto
            ) =>

                total +
                Number(
                    producto.cantidad
                ),

            0
        );


    if (contadorCarrito) {

        contadorCarrito.textContent =
            cantidadTotal;

    }



 // ======================================
// SUBTOTAL
// ======================================

const subtotal =
    carrito.reduce(
        (
            suma,
            producto
        ) =>

            suma +
            Number(
                producto.precio
            ) *
            Number(
                producto.cantidad
            ),

        0
    );



// ======================================
// DESCUENTO
// ======================================

const descuento =
    calcularDescuento(
        subtotal
    );



// ======================================
// TOTAL FINAL
// ======================================

const totalFinal =
    subtotal -
    descuento;



// MOSTRAR DESCUENTO

if (
    codigoAplicado &&
    descuento > 0
) {

    descuentoContainer.style.display =
        "flex";


    descuentoTotal.textContent =
        "-" +
        formatearPrecio(
            descuento
        );

} else {

    descuentoContainer.style.display =
        "none";

}



// MOSTRAR TOTAL

if (carritoTotal) {

    carritoTotal.textContent =
        formatearPrecio(
            totalFinal
        );

}

}
// ==========================================
// CONTROLES CARRITO
// ==========================================

function activarControlesCarrito() {


    // SUMAR

    document
        .querySelectorAll(
            ".sumar"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    function() {

                        cambiarCantidad(

                            boton.dataset.id,

                            boton.dataset.talle,

                            1

                        );

                    }
                );

            }
        );



    // RESTAR

    document
        .querySelectorAll(
            ".restar"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    function() {

                        cambiarCantidad(

                            boton.dataset.id,

                            boton.dataset.talle,

                            -1

                        );

                    }
                );

            }
        );



    // ELIMINAR

    document
        .querySelectorAll(
            ".eliminar-item"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    function() {

                        eliminarProducto(

                            boton.dataset.id,

                            boton.dataset.talle

                        );

                    }
                );

            }
        );

}



// ==========================================
// GUARDAR CARRITO
// ==========================================

function guardarCarrito() {

    localStorage.setItem(
        "urbanStreetCarrito",

        JSON.stringify(
            carrito
        )
    );

}



// ==========================================
// ABRIR CARRITO
// ==========================================

function abrirCarrito() {

    if (carritoSidebar) {

        carritoSidebar.classList.add(
            "activo"
        );

    }


    if (carritoOverlay) {

        carritoOverlay.classList.add(
            "activo"
        );

    }


    document.body.style.overflow =
        "hidden";

}



// ==========================================
// CERRAR CARRITO
// ==========================================

function cerrarCarrito() {

    if (carritoSidebar) {

        carritoSidebar.classList.remove(
            "activo"
        );

    }


    if (carritoOverlay) {

        carritoOverlay.classList.remove(
            "activo"
        );

    }


    document.body.style.overflow =
        "";

}



// ==========================================
// EVENTOS DEL CARRITO
// ==========================================

if (abrirCarritoBtn) {

    abrirCarritoBtn.addEventListener(
        "click",
        abrirCarrito
    );

}


if (cerrarCarritoBtn) {

    cerrarCarritoBtn.addEventListener(
        "click",
        cerrarCarrito
    );

}


if (carritoOverlay) {

    carritoOverlay.addEventListener(
        "click",
        cerrarCarrito
    );

}



// ==========================================
// CERRAR CON ESC
// ==========================================

document.addEventListener(
    "keydown",
    function(evento) {

        if (evento.key === "Escape") {

            cerrarCarrito();

        }

    }
);



// ==========================================
// BUSCADOR
// ==========================================

if (buscador) {

    buscador.addEventListener(
        "input",
        aplicarFiltros
    );

}



// ==========================================
// FILTRO MARCA
// ==========================================

if (filtroMarca) {

    filtroMarca.addEventListener(
        "change",
        aplicarFiltros
    );

}



// ==========================================
// FILTRO TALLE
// ==========================================

if (filtroTalle) {

    filtroTalle.addEventListener(
        "change",
        aplicarFiltros
    );

}



// ==========================================
// FILTRO ESTADO
// ==========================================

if (filtroEstado) {

    filtroEstado.addEventListener(
        "change",
        aplicarFiltros
    );

}



// ==========================================
// ORDEN
// ==========================================

if (ordenProductos) {

    ordenProductos.addEventListener(
        "change",
        aplicarFiltros
    );

}



// ==========================================
// LIMPIAR FILTROS
// ==========================================

if (limpiarFiltrosBtn) {

    limpiarFiltrosBtn.addEventListener(
        "click",
        function() {

            if (buscador) {

                buscador.value =
                    "";

            }


            if (filtroMarca) {

                filtroMarca.value =
                    "";

            }


            if (filtroTalle) {

                filtroTalle.value =
                    "";

            }


            if (filtroEstado) {

                filtroEstado.value =
                    "";

            }


            if (ordenProductos) {

                ordenProductos.value =
                    "";

            }


            mostrarProductos(
                productos
            );

        }
    );

}



// ==========================================
// NOTIFICACIÓN
// ==========================================

let temporizadorNotificacion;


function mostrarNotificacion() {

    if (!notificacion) {
        return;
    }


    clearTimeout(
        temporizadorNotificacion
    );


    notificacion.classList.add(
        "activa"
    );


    temporizadorNotificacion =
        setTimeout(
            function() {

                notificacion
                    .classList
                    .remove(
                        "activa"
                    );

            },
            1800
        );

}



// ==========================================
// BOTONES DE FINALIZAR COMPRA
// ==========================================

const botonWhatsapp =
    document.getElementById(
        "btn-whatsapp"
    );


const botonMercadoPago =
    document.getElementById(
        "btn-mercadopago"
    );

// ==========================================
// CHECKOUT
// ==========================================

const checkoutModal =
    document.getElementById(
        "checkout-modal"
    );


const checkoutOverlay =
    document.getElementById(
        "checkout-overlay"
    );


const cerrarCheckoutBtn =
    document.getElementById(
        "cerrar-checkout"
    );


const checkoutForm =
    document.getElementById(
        "checkout-form"
    );


const datosEnvio =
    document.getElementById(
        "datos-envio"
    );


const checkoutSubtotal =
    document.getElementById(
        "checkout-subtotal"
    );


const checkoutDescuento =
    document.getElementById(
        "checkout-descuento"
    );


const checkoutDescuentoFila =
    document.getElementById(
        "checkout-descuento-fila"
    );


const checkoutEnvio =
    document.getElementById(
        "checkout-envio"
    );


const checkoutTotal =
    document.getElementById(
        "checkout-total"
    );

// ==========================================
// ENVÍOS
// ==========================================

const PRECIOS_ENVIO = {

    retiro: 0,

    Cordoba: 8000,

    "Buenos Aires": 12000,

    "Santa Fe": 11000,

    Otra: 15000

};

function calcularCheckout() {

    const {
        subtotal,
        descuento
    } = obtenerTotales();


    const tipoEntrega =
        document.querySelector(
            'input[name="tipo-entrega"]:checked'
        )?.value || "retiro";


    let envio = 0;


    if (tipoEntrega === "envio") {

        const provincia =
            document.getElementById(
                "checkout-provincia"
            ).value;


        envio =
            PRECIOS_ENVIO[
                provincia
            ] || 0;

    }


    const total =
        subtotal -
        descuento +
        envio;


    checkoutSubtotal.textContent =
        formatearPrecio(
            subtotal
        );


    if (descuento > 0) {

        checkoutDescuentoFila.style.display =
            "flex";


        checkoutDescuento.textContent =
            "-" +
            formatearPrecio(
                descuento
            );

    } else {

        checkoutDescuentoFila.style.display =
            "none";

    }


    checkoutEnvio.textContent =
        envio === 0

            ? "GRATIS"

            : formatearPrecio(
                envio
            );


    checkoutTotal.textContent =
        formatearPrecio(
            total
        );


    return {

        subtotal,
        descuento,
        envio,
        total

    };

}

function abrirCheckout() {

    if (carrito.length === 0) {

        alert(
            "Tu carrito está vacío."
        );

        return;

    }


    cerrarCarrito();


    checkoutModal.classList.add(
        "activo"
    );


    checkoutOverlay.classList.add(
        "activo"
    );


    document.body.style.overflow =
        "hidden";


    calcularCheckout();

}
function cerrarCheckout() {

    checkoutModal.classList.remove(
        "activo"
    );


    checkoutOverlay.classList.remove(
        "activo"
    );


    document.body.style.overflow =
        "";

}

if (botonMercadoPago) {

    botonMercadoPago.addEventListener(
        "click",
        abrirCheckout
    );

}


if (cerrarCheckoutBtn) {

    cerrarCheckoutBtn.addEventListener(
        "click",
        cerrarCheckout
    );

}


if (checkoutOverlay) {

    checkoutOverlay.addEventListener(
        "click",
        cerrarCheckout
    );

}

const opcionesEntrega =
    document.querySelectorAll(
        'input[name="tipo-entrega"]'
    );


opcionesEntrega.forEach(
    opcion => {

        opcion.addEventListener(
            "change",
            function() {

                const tipo =
                    document.querySelector(
                        'input[name="tipo-entrega"]:checked'
                    ).value;


                if (tipo === "envio") {

                    datosEnvio.style.display =
                        "flex";

                } else {

                    datosEnvio.style.display =
                        "none";

                }


                calcularCheckout();

            }
        );

    }
);

const selectProvincia =
    document.getElementById(
        "checkout-provincia"
    );


if (selectProvincia) {

    selectProvincia.addEventListener(
        "change",
        calcularCheckout
    );

}

// ==========================================
// EVITAR DOBLE PAGO
// ==========================================

let procesandoPago = false;


// ==========================================
// CHECKOUT / MERCADO PAGO
// ==========================================

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",

        async function(evento) {

            evento.preventDefault();


            // ======================================
            // EVITAR DOBLE CLICK
            // ======================================

            if (procesandoPago) {

                console.log(
                    "Ya se está procesando un pago."
                );

                return;

            }


            if (carrito.length === 0) {

                alert(
                    "Tu carrito está vacío."
                );

                return;

            }


            procesandoPago = true;


            const boton =
                checkoutForm.querySelector(
                    'button[type="submit"]'
                );


            if (boton) {

                boton.disabled = true;

                boton.textContent =
                    "PROCESANDO...";

            }


            try {

                // ======================================
                // DATOS DEL CLIENTE
                // ======================================

                const nombre =
                    document
                        .getElementById(
                            "checkout-nombre"
                        )
                        .value
                        .trim();


                const telefono =
                    document
                        .getElementById(
                            "checkout-telefono"
                        )
                        .value
                        .trim();


                const email =
                    document
                        .getElementById(
                            "checkout-email"
                        )
                        .value
                        .trim();


                const tipoEntrega =
                    document.querySelector(
                        'input[name="tipo-entrega"]:checked'
                    )?.value;


                if (
                    !nombre ||
                    !telefono ||
                    !email
                ) {

                    throw new Error(
                        "Completá tus datos."
                    );

                }


                if (!tipoEntrega) {

                    throw new Error(
                        "Seleccioná un tipo de entrega."
                    );

                }


                // ======================================
                // DIRECCIÓN
                // ======================================

                let direccion = null;


                if (tipoEntrega === "envio") {

                    const provincia =
                        document
                            .getElementById(
                                "checkout-provincia"
                            )
                            .value;


                    const localidad =
                        document
                            .getElementById(
                                "checkout-localidad"
                            )
                            .value
                            .trim();


                    const calle =
                        document
                            .getElementById(
                                "checkout-direccion"
                            )
                            .value
                            .trim();


                    const cp =
                        document
                            .getElementById(
                                "checkout-cp"
                            )
                            .value
                            .trim();


                    if (
                        !provincia ||
                        !localidad ||
                        !calle ||
                        !cp
                    ) {

                        throw new Error(
                            "Completá todos los datos de envío."
                        );

                    }


                    direccion = {

                        provincia,
                        localidad,
                        calle,
                        cp

                    };

                }


                // ======================================
                // CALCULAR TOTALES
                // ======================================

                const totales =
                    calcularCheckout();


                // ======================================
                // PRODUCTOS DEL PEDIDO
                // ======================================

                const productosPedido =
                    carrito.map(
                        producto => {

                            return {

                                productoId:
                                    producto.id,

                                nombre:
                                    producto.nombre,

                                marca:
                                    producto.marca || "",

                                talle:
                                    producto.talleSeleccionado,

                                cantidad:
                                    Number(
                                        producto.cantidad
                                    ),

                                precio:
                                    Number(
                                        producto.precio
                                    ),

                                subtotal:
                                    Number(
                                        producto.precio
                                    ) *
                                    Number(
                                        producto.cantidad
                                    )

                            };

                        }
                    );


                // ======================================
                // CÓDIGO DEL PEDIDO
                // ======================================

                const codigoPedido =
                    "US-" +
                    Date.now()
                        .toString()
                        .slice(-7);


                // ======================================
                // CREAR OBJETO PEDIDO
                // ======================================

                const pedido = {

                    codigo:
                        codigoPedido,

                    cliente: {

                        nombre,
                        telefono,
                        email

                    },

                    entrega: {

                        tipo:
                            tipoEntrega,

                        direccion:
                            direccion

                    },

                    productos:
                        productosPedido,

                    subtotal:
                        Number(
                            totales.subtotal
                        ),

                    descuento:
                        Number(
                            totales.descuento
                        ),

                    envio:
                        Number(
                            totales.envio
                        ),

                    total:
                        Number(
                            totales.total
                        ),

                    codigoPromocional:
                        codigoAplicado?.codigo ||
                        null,

                    origen:
                        "mercadopago",

                    estadoPago:
                        "pendiente",

                    estadoPedido:
                        "nuevo",

                    stockDescontado:
                        false

                };


                // ======================================
                // GUARDAR PEDIDO EN FIRESTORE
                // ======================================

                if (boton) {

                    boton.textContent =
                        "GUARDANDO PEDIDO...";

                }


                const pedidoId =
                    await crearPedido(
                        pedido
                    );


                console.log(
                    "Pedido guardado:",
                    pedidoId
                );


                // ======================================
                // ID DEL PEDIDO PARA EL BACKEND
                // ======================================

                pedido.pedidoId =
                    pedidoId;


                // ======================================
                // CREAR PREFERENCIA MERCADO PAGO
                // ======================================

                if (boton) {

                    boton.textContent =
                        "ABRIENDO MERCADO PAGO...";

                }


                const respuesta =
                    await fetch(
                        "https://urban-street.onrender.com/crear-preferencia",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    pedido
                                )

                        }
                    );


                // ======================================
                // LEER RESPUESTA DEL BACKEND
                // ======================================

                const datos =
                    await respuesta.json();


                console.log(
                    "Respuesta Mercado Pago:",
                    datos
                );


                if (!respuesta.ok) {

                    throw new Error(
                        datos.error ||
                        datos.detalle ||
                        "No se pudo iniciar Mercado Pago."
                    );

                }


                // ======================================
                // OBTENER URL DE MERCADO PAGO
                // ======================================

                const urlMercadoPago =
                    datos.sandboxInitPoint ||
                    datos.initPoint;


                if (!urlMercadoPago) {

                    throw new Error(
                        "Mercado Pago no devolvió una URL de pago."
                    );

                }


                console.log(
                    "Redirigiendo a Mercado Pago:",
                    urlMercadoPago
                );


                // ======================================
                // REDIRIGIR
                // ======================================

                window.location.href =
                    urlMercadoPago;


            } catch (error) {

                console.error(
                    "Error checkout:",
                    error
                );


                alert(
                    error.message ||
                    "No se pudo iniciar el pago."
                );


                // Permitir intentar nuevamente
                // solamente si ocurrió un error

                procesandoPago = false;


                if (boton) {

                    boton.disabled =
                        false;

                    boton.textContent =
                        "CONTINUAR A MERCADO PAGO →";

                }

            }

        }
    );

}

// ==========================================
// CALCULAR TOTALES
// ==========================================

function obtenerTotales() {

    const subtotal =
        carrito.reduce(
            (suma, producto) => {

                return (
                    suma +
                    Number(producto.precio) *
                    Number(producto.cantidad)
                );

            },
            0
        );


    const descuento =
        calcularDescuento(
            subtotal
        );


    const total =
        subtotal -
        descuento;


    return {

        subtotal,
        descuento,
        total

    };

}

// ==========================================
// WHATSAPP
// ==========================================

if (botonWhatsapp) {

    botonWhatsapp.addEventListener(
        "click",

        function() {

            if (carrito.length === 0) {

                alert(
                    "Tu carrito está vacío."
                );

                return;

            }


            const {
                subtotal,
                descuento,
                total
            } = obtenerTotales();


            let mensaje =
                "Hola! Quiero hacer este pedido en Urban Street:%0A%0A";


            carrito.forEach(
                producto => {

                    mensaje +=
                        `👟 ${producto.nombre}%0A`;

                    mensaje +=
                        `Marca: ${producto.marca || "-"}%0A`;

                    mensaje +=
                        `Talle: ${producto.talleSeleccionado}%0A`;

                    mensaje +=
                        `Cantidad: ${producto.cantidad}%0A`;

                    mensaje +=
                        `Precio: ${formatearPrecio(
                            producto.precio *
                            producto.cantidad
                        )}%0A%0A`;

                }
            );


            mensaje +=
                `Subtotal: ${formatearPrecio(
                    subtotal
                )}%0A`;


            if (descuento > 0) {

                mensaje +=
                    `Descuento: -${formatearPrecio(
                        descuento
                    )}%0A`;

            }


            if (codigoAplicado) {

                mensaje +=
                    `Código: ${codigoAplicado.codigo}%0A`;

            }


            mensaje +=
                `%0A*TOTAL: ${formatearPrecio(
                    total
                )}*`;


            // ==================================
            // TU NÚMERO
            // ==================================

            const telefono =
                "5493513239154";


            const url =
                `https://wa.me/${telefono}?text=${mensaje}`;


            window.open(
                url,
                "_blank"
            );

        }

    );

}


// ==========================================
// NEWSLETTER
// ==========================================

const newsletterForm =
    document.getElementById(
        "newsletter-form"
    );


if (newsletterForm) {

    newsletterForm.addEventListener(
        "submit",
        function(evento) {

            evento.preventDefault();


            const email =
                document.getElementById(
                    "newsletter-email"
                );


            alert(
                "¡Gracias por sumarte a Urban Street!"
            );


            if (email) {

                email.value =
                    "";

            }

        }
    );

}



// ==========================================
// FIREBASE
// ==========================================

escucharProductos(
    function(productosFirebase) {

        productos =
            productosFirebase;


        console.log(
            "Productos recibidos desde Firebase:",
            productos
        );


        // Aplicamos los filtros actuales
        // también cuando Firebase se actualiza
        aplicarFiltros();

    }
);



// ==========================================
// INICIAR CARRITO
// ==========================================

actualizarCarrito();