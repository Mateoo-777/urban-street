import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
    MercadoPagoConfig,
    Preference,
    Payment,
    WebhookSignatureValidator
}
from "mercadopago";

import {
    initializeApp,
    cert
}
from "firebase-admin/app";

import {
    getFirestore
}
from "firebase-admin/firestore";

import {
    readFileSync
}
from "fs";


dotenv.config();


// ==========================================
// FIREBASE ADMIN
// ==========================================

// ==========================================
// FIREBASE ADMIN
// ==========================================

const serviceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT
        )
        : JSON.parse(
            readFileSync(
                "./firebase-admin.json",
                "utf8"
            )
        );


initializeApp({

    credential:
        cert(
            serviceAccount
        )

});


const db =
    getFirestore();


console.log(
    "🔥 Firebase Admin conectado"
);


// ==========================================
// EXPRESS
// ==========================================

const app =
    express();


app.use(
    cors({
        origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://urbanstreetag.lat",
    "https://www.urbanstreetag.lat",
    "https://mateoo-777.github.io"
],

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


app.use(
    express.json()
);


// ==========================================
// MERCADO PAGO
// ==========================================

if (
    !process.env.MP_ACCESS_TOKEN
) {

    console.error(
        "❌ Falta MP_ACCESS_TOKEN en .env"
    );

    process.exit(1);

}


const client =
    new MercadoPagoConfig({

        accessToken:
            process.env.MP_ACCESS_TOKEN

    });


const preference =
    new Preference(client);


const payment =
    new Payment(client);


// ==========================================
// RUTA PRINCIPAL
// ==========================================

app.get(
    "/",

    (req, res) => {

        res.json({

            mensaje:
                "Urban Street backend funcionando 🔥"

        });

    }
);


// ==========================================
// PRUEBA FIREBASE
// ==========================================

app.get(
    "/probar-firebase",

    async (req, res) => {

        try {

            const snapshot =
                await db
                    .collection("pedidos")
                    .limit(5)
                    .get();


            const pedidos = [];


            snapshot.forEach(
                documento => {

                    pedidos.push({

                        id:
                            documento.id,

                        ...documento.data()

                    });

                }
            );


            res.json({

                conectado:
                    true,

                cantidad:
                    pedidos.length,

                pedidos

            });


        } catch (error) {

            console.error(
                "❌ Error Firebase:",
                error
            );


            res
                .status(500)
                .json({

                    conectado:
                        false,

                    error:
                        error.message

                });

        }

    }
);


// ==========================================
// OBTENER PRODUCTOS REALES
// ==========================================

async function prepararProductos(
    productosPedido
) {

    const productosReales = [];

    let subtotal = 0;


    for (
        const item
        of productosPedido
    ) {

        const productoId =
            String(
                item.productoId ||
                item.id ||
                ""
            );


        const talle =
            String(
                item.talleSeleccionado ||
                item.talle ||
                ""
            );


        const cantidad =
            Number(
                item.cantidad || 1
            );


        if (
            !productoId ||
            !talle ||
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {

            throw new Error(
                "Hay un producto inválido en el pedido."
            );

        }


        // ======================================
        // PRODUCTO DESDE FIRESTORE
        // ======================================

        const productoDoc =
            await db
                .collection("productos")
                .doc(productoId)
                .get();


        if (!productoDoc.exists) {

            throw new Error(
                `El producto ${productoId} no existe.`
            );

        }


        const producto =
            productoDoc.data();


        if (
            producto.visible === false
        ) {

            throw new Error(
                `${producto.nombre || "El producto"} no está disponible.`
            );

        }


        // ======================================
        // STOCK REAL
        // ======================================

        const stockReal =
            Number(
                producto.talles?.[talle] ||
                0
            );


        if (
            stockReal < cantidad
        ) {

            throw new Error(
                `No hay suficiente stock de ${producto.nombre}, talle ${talle}.`
            );

        }


        // ======================================
        // PRECIO REAL
        // ======================================

        const precioReal =
            Number(
                producto.precio
            );


        if (
            !Number.isFinite(precioReal) ||
            precioReal <= 0
        ) {

            throw new Error(
                `El precio de ${producto.nombre} no es válido.`
            );

        }


        subtotal +=
            precioReal *
            cantidad;


       productosReales.push({

    productoId,

    nombre:
        producto.nombre,

    marca:
        producto.marca || "",

    talle,

    cantidad,

    precio:
        precioReal,

    subtotal:
        precioReal * cantidad

});

    }


    return {

        productos:
            productosReales,

        subtotal

    };

}


// ==========================================
// VALIDAR CUPÓN
// ==========================================

async function validarCupon(
    codigoRecibido,
    subtotal
) {

    if (!codigoRecibido) {

        return {

            codigo:
                null,

            descuento:
                0,

            datos:
                null

        };

    }


    const codigo =
        String(
            codigoRecibido
        )
        .trim()
        .toUpperCase();


    const snapshot =
    await db
        .collection("codigos")
        .where(
            "codigo",
            "==",
            codigo
        )
        .limit(1)
        .get();


if (snapshot.empty) {

    throw new Error(
        "El código promocional no existe."
    );

}


const cuponDoc =
    snapshot.docs[0];


const cupon =
    cuponDoc.data();


    if (
        cupon.activo !== true
    ) {

        throw new Error(
            "El código promocional no está activo."
        );

    }


    if (
        cupon.usoUnico === true &&
        cupon.canjeado === true
    ) {

        throw new Error(
            "Este código promocional ya fue utilizado."
        );

    }


    let descuento = 0;


    // ======================================
    // CUPÓN POR PORCENTAJE
    // ======================================

    if (
        cupon.tipo ===
        "porcentaje"
    ) {

        const porcentaje =
            Number(
                cupon.valor
            );


        if (
            !Number.isFinite(porcentaje) ||
            porcentaje <= 0 ||
            porcentaje > 100
        ) {

            throw new Error(
                "El porcentaje del cupón es inválido."
            );

        }


        descuento =
            subtotal *
            (
                porcentaje /
                100
            );

    }


    // ======================================
    // CUPÓN DE MONTO FIJO
    // ======================================

    else if (
        cupon.tipo ===
        "fijo"
    ) {

        descuento =
            Number(
                cupon.valor
            );


        if (
            !Number.isFinite(descuento) ||
            descuento <= 0
        ) {

            throw new Error(
                "El valor del cupón es inválido."
            );

        }

    }


    else {

        throw new Error(
            "El tipo de cupón no es válido."
        );

    }


    // Nunca puede descontar más
    // que el subtotal

    descuento =
        Math.min(
            descuento,
            subtotal
        );


    return {

        codigo,

        descuento,

        datos:
            cupon

    };

}


// ==========================================
// CALCULAR ENVÍO REAL
// ==========================================

async function calcularEnvio(
    entrega
) {

    if (
        !entrega ||
        entrega.tipo !== "envio"
    ) {

        return 0;

    }


    const provincia =
        entrega
            ?.direccion
            ?.provincia;


    if (!provincia) {

        throw new Error(
            "No se indicó la provincia de envío."
        );

    }


    const configuracionDoc =
        await db
            .collection(
                "configuracion"
            )
            .doc("envios")
            .get();


    if (!configuracionDoc.exists) {

        throw new Error(
            "Los precios de envío todavía no están configurados."
        );

    }


    const tarifas =
        configuracionDoc.data();


    const equivalencias = {

        "Cordoba":
            "Cordoba",

        "Córdoba":
            "Cordoba",

        "Buenos Aires":
            "BuenosAires",

        "Santa Fe":
            "SantaFe",

        "Otra":
            "Otra"

    };


    const campo =
        equivalencias[
            provincia
        ] || "Otra";


    const precio =
        Number(
            tarifas[campo]
        );


    if (
        !Number.isFinite(precio) ||
        precio < 0
    ) {

        throw new Error(
            "El precio de envío configurado es inválido."
        );

    }


    return precio;

}


// ==========================================
// CREAR PREFERENCIA
// ==========================================

app.post(
    "/crear-preferencia",

    async (req, res) => {

        try {

            const pedido =
                req.body;


            // ======================================
            // VALIDAR PEDIDO
            // ======================================

            if (
                !pedido ||
                !pedido.pedidoId ||
                !Array.isArray(
                    pedido.productos
                ) ||
                pedido.productos.length === 0
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "El pedido es inválido."

                    });

            }


            // ======================================
            // 7. PRODUCTOS Y PRECIOS SEGUROS
            // ======================================

            const resultadoProductos =
                await prepararProductos(
                    pedido.productos
                );


            const productosReales =
                resultadoProductos.productos;


            const subtotalReal =
                resultadoProductos.subtotal;


            // ======================================
            // 8. CUPÓN SEGURO
            // ======================================

            const resultadoCupon =
                await validarCupon(

                    pedido.codigoPromocional,

                    subtotalReal

                );


            const descuentoReal =
                resultadoCupon.descuento;


            const codigoPromocional =
                resultadoCupon.codigo;


            // ======================================
            // 9. ENVÍO SEGURO
            // ======================================

            const envioReal =
                await calcularEnvio(
                    pedido.entrega
                );


            // ======================================
            // TOTAL DEFINITIVO
            // ======================================

            const totalReal =
                subtotalReal -
                descuentoReal +
                envioReal;


            if (
                !Number.isFinite(totalReal) ||
                totalReal <= 0
            ) {

                throw new Error(
                    "El total del pedido es inválido."
                );

            }


            console.log(
                "================================"
            );

            console.log(
                "🛒 PEDIDO VALIDADO"
            );

            console.log(
                "Subtotal:",
                subtotalReal
            );

            console.log(
                "Descuento:",
                descuentoReal
            );

            console.log(
                "Envío:",
                envioReal
            );

            console.log(
                "TOTAL:",
                totalReal
            );

            console.log(
                "================================"
            );


            // ======================================
            // ACTUALIZAR PEDIDO
            // ======================================

            const pedidoRef =
                db
                    .collection("pedidos")
                    .doc(
                        String(
                            pedido.pedidoId
                        )
                    );


            const pedidoDoc =
                await pedidoRef.get();


            if (!pedidoDoc.exists) {

                throw new Error(
                    "El pedido no existe en Firebase."
                );

            }


            await pedidoRef.update({

                productos:
                    productosReales,

                subtotal:
                    subtotalReal,

                descuento:
                    descuentoReal,

                envio:
                    envioReal,

                total:
                    totalReal,

                codigoPromocional:
                    codigoPromocional,

                estadoPago:
                    "pendiente",

                stockDescontado:
                    false,

                valoresValidadosBackend:
                    true,

                actualizadoEn:
                    new Date()

            });


            // ======================================
            // ITEMS MERCADO PAGO
            // ======================================

            /*
                IMPORTANTE:

                Mercado Pago tiene que terminar
                cobrando totalReal.

                Para evitar depender de precios
                enviados por el navegador,
                construimos la compra usando
                únicamente datos calculados
                por este backend.
            */


            const items = [

                {

                    id:
                        String(
                            pedido.pedidoId
                        ),

                    title:
                        `Pedido Urban Street ${pedido.codigo || ""}`,

                    quantity:
                        1,

                    unit_price:
                        Number(
                            totalReal
                        ),

                    currency_id:
                        "ARS"

                }

            ];


            // ======================================
            // CREAR PREFERENCIA MP
            // ======================================

            const body = {

                items,

                notification_url:
    "https://pardon-facial-tadpole.ngrok-free.dev/webhook",

                payer: {

                    name:
                        pedido.cliente
                            ?.nombre || "",

                    email:
                        pedido.cliente
                            ?.email || ""

                },


                external_reference:
                    String(
                        pedido.pedidoId
                    ),


                metadata: {

                    pedido_id:
                        String(
                            pedido.pedidoId
                        ),

                    codigo_pedido:
                        pedido.codigo || "",

                    subtotal:
                        subtotalReal,

                    descuento:
                        descuentoReal,

                    envio:
                        envioReal,

                    total:
                        totalReal

                }

            };


            const resultado =
                await preference.create({
                    body
                });


            console.log(
                "✅ Preferencia creada:",
                resultado.id
            );


            res.json({

                preferenceId:
                    resultado.id,

                initPoint:
                    resultado.init_point,

                sandboxInitPoint:
                    resultado.sandbox_init_point,

                subtotal:
                    subtotalReal,

                descuento:
                    descuentoReal,

                envio:
                    envioReal,

                total:
                    totalReal

            });


        } catch (error) {

            console.error(
                "================================"
            );

            console.error(
                "❌ ERROR CREANDO PREFERENCIA"
            );

            console.error(
                error
            );

            console.error(
                "================================"
            );


            res
                .status(400)
                .json({

                    error:
                        error.message ||
                        "No se pudo crear la preferencia."

                });

        }

    }
);


// ==========================================
// DESCONTAR STOCK
// ==========================================

async function descontarStockPedido(
    pedidoId
) {

    const pedidoRef =
        db
            .collection("pedidos")
            .doc(pedidoId);


    await db.runTransaction(
        async transaction => {

            const pedidoDoc =
                await transaction.get(
                    pedidoRef
                );


            if (!pedidoDoc.exists) {

                throw new Error(
                    "El pedido no existe."
                );

            }


            const pedido =
                pedidoDoc.data();


            // ======================================
            // EVITAR DOBLE DESCUENTO
            // ======================================

            if (
                pedido.stockDescontado === true
            ) {

                console.log(
                    "ℹ️ El stock ya había sido descontado."
                );

                return;

            }


            if (
                !Array.isArray(
                    pedido.productos
                )
            ) {

                throw new Error(
                    "El pedido no contiene productos."
                );

            }


            const productosActualizar =
                [];


            // ======================================
            // LEER TODOS LOS PRODUCTOS
            // ======================================

            for (
                const item
                of pedido.productos
            ) {

                const productoId =
                    String(
                        item.productoId ||
                        item.id ||
                        ""
                    );


                const talle =
                    String(
                        item.talle ||
                        item.talleSeleccionado ||
                        ""
                    );


                const cantidad =
                    Number(
                        item.cantidad || 1
                    );


                if (
                    !productoId ||
                    !talle
                ) {

                    throw new Error(
                        "Producto o talle inválido."
                    );

                }


                const productoRef =
                    db
                        .collection(
                            "productos"
                        )
                        .doc(
                            productoId
                        );


                const productoDoc =
                    await transaction.get(
                        productoRef
                    );


                if (!productoDoc.exists) {

                    throw new Error(
                        `Producto ${productoId} no encontrado.`
                    );

                }


                const producto =
                    productoDoc.data();


                const talles = {

                    ...(
                        producto.talles ||
                        {}
                    )

                };


                const stockActual =
                    Number(
                        talles[talle] ||
                        0
                    );


                if (
                    stockActual <
                    cantidad
                ) {

                    throw new Error(
                        `Stock insuficiente de ${producto.nombre || productoId}, talle ${talle}.`
                    );

                }


                talles[talle] =
                    stockActual -
                    cantidad;


                productosActualizar.push({

                    ref:
                        productoRef,

                    talles

                });

            }


            // ======================================
            // ACTUALIZAR PRODUCTOS
            // ======================================

            for (
                const producto
                of productosActualizar
            ) {

                transaction.update(

                    producto.ref,

                    {

                        talles:
                            producto.talles

                    }

                );

            }


            // ======================================
            // MARCAR STOCK DESCONTADO
            // ======================================

            transaction.update(

                pedidoRef,

                {

                    stockDescontado:
                        true,

                    stockDescontadoEn:
                        new Date()

                }

            );

        }
    );


    console.log(
        "📦 Stock descontado:",
        pedidoId
    );

}


// ==========================================
// CANJEAR CUPÓN DE UN SOLO USO
// ==========================================

async function canjearCuponPedido(
    pedidoId
) {

    const pedidoRef =
        db
            .collection("pedidos")
            .doc(pedidoId);


    const pedidoDoc =
        await pedidoRef.get();


    if (!pedidoDoc.exists) {

        return;

    }


    const pedido =
        pedidoDoc.data();


    const codigo =
        pedido.codigoPromocional;


    if (!codigo) {

        return;

    }


    // ======================================
    // BUSCAR CÓDIGO
    // ======================================

    const snapshot =
        await db
            .collection("codigos")
            .where(
                "codigo",
                "==",
                String(codigo)
                    .trim()
                    .toUpperCase()
            )
            .limit(1)
            .get();


    if (snapshot.empty) {

        console.log(
            "ℹ️ Código no encontrado:",
            codigo
        );

        return;

    }


    const cuponDoc =
        snapshot.docs[0];


    const cuponRef =
        cuponDoc.ref;


    // ======================================
    // TRANSACCIÓN
    // ======================================

    await db.runTransaction(

        async transaction => {

            const documento =
                await transaction.get(
                    cuponRef
                );


            if (!documento.exists) {

                return;

            }


            const cupon =
                documento.data();


            // Cupón normal
            if (
                cupon.usoUnico !== true
            ) {

                return;

            }


            // Ya fue usado
            if (
                cupon.canjeado === true
            ) {

                console.log(
                    "ℹ️ Código ya canjeado:",
                    codigo
                );

                return;

            }


            transaction.update(
                cuponRef,
                {

                    canjeado:
                        true,

                    activo:
                        false,

                    canjeadoPor:
                        pedidoId,

                    canjeadoEn:
                        new Date()

                }
            );

        }

    );


    console.log(
        "🎟️ Código canjeado:",
        codigo
    );

}
// ==========================================
// WEBHOOK MERCADO PAGO
// ==========================================

app.post(
    "/webhook",

    async (req, res) => {

        try {

            console.log(
                "🔥 WEBHOOK RECIBIDO"
            );


            // Responder inmediatamente
            res.sendStatus(200);


            const xSignature =
                req.headers["x-signature"];


            const xRequestId =
                req.headers["x-request-id"];


            const dataId =
                req.query["data.id"];


            const paymentId =
                req.query["data.id"] ||
                req.body?.data?.id;


            const tipo =
                req.query.type ||
                req.body?.type;


            // ======================================
            // SI NO HAY ID
            // ======================================

            if (!paymentId) {

                console.log(
                    "Webhook sin data.id"
                );

                return;

            }


            // ======================================
            // VALIDAR FIRMA
            // ======================================

            if (
                process.env.MP_WEBHOOK_SECRET &&
                xSignature &&
                xRequestId &&
                dataId
            ) {

                WebhookSignatureValidator.validate({

                    xSignature,

                    xRequestId,

                    dataId:
                        String(dataId),

                    secret:
                        process.env.MP_WEBHOOK_SECRET

                });


                console.log(
                    "✅ Firma válida"
                );

            } else {

                console.log(
                    "ℹ️ Webhook sin firma o sin data.id en query"
                );

            }


            // ======================================
            // SOLO PAGOS
            // ======================================

            if (
                tipo !== "payment"
            ) {

                console.log(
                    "Webhook ignorado:",
                    tipo
                );

                return;

            }

            // ======================================
            // CONSULTAR PAGO REAL
            // ======================================

            const pago =
                await payment.get({

                    id:
                        String(
                            dataId
                        )

                });


            console.log(
                "💳 Pago:",
                pago.id
            );


            console.log(
                "Estado MP:",
                pago.status
            );


            // ======================================
            // OBTENER PEDIDO
            // ======================================

            const pedidoId =
                pago.external_reference;


            if (!pedidoId) {

                console.log(
                    "❌ Pago sin external_reference"
                );

                return;

            }


            console.log(
                "Pedido relacionado:",
                pedidoId
            );


            // ======================================
            // CONVERTIR ESTADO
            // ======================================

            let estadoPago =
                "pendiente";


            if (
                pago.status ===
                "approved"
            ) {

                estadoPago =
                    "aprobado";

            }

            else if (
                pago.status ===
                "rejected"
            ) {

                estadoPago =
                    "rechazado";

            }

            else if (
                pago.status ===
                "cancelled"
            ) {

                estadoPago =
                    "cancelado";

            }

            else if (
                pago.status ===
                "refunded"
            ) {

                estadoPago =
                    "reembolsado";

            }


            // ======================================
            // ACTUALIZAR PEDIDO
            // ======================================

            const pedidoRef =
                db
                    .collection(
                        "pedidos"
                    )
                    .doc(
                        String(
                            pedidoId
                        )
                    );


            await pedidoRef.update({

                estadoPago,

                mercadoPagoPaymentId:
                    String(
                        pago.id
                    ),

                mercadoPagoEstado:
                    pago.status,

                actualizadoEn:
                    new Date()

            });


            // ======================================
            // PAGO APROBADO
            // ======================================

            if (
                pago.status ===
                "approved"
            ) {

                // STOCK

                await descontarStockPedido(
                    String(
                        pedidoId
                    )
                );


                // CUPÓN DE UN SOLO USO

                await canjearCuponPedido(
                    String(
                        pedidoId
                    )
                );

            }


            console.log(
                "✅ Pedido actualizado:",
                pedidoId
            );


            console.log(
                "Estado:",
                estadoPago
            );


        } catch (error) {

            console.error(
                "❌ ERROR WEBHOOK:",
                error
            );


            if (
                !res.headersSent
            ) {

                res
                    .status(401)
                    .json({

                        error:
                            "Webhook inválido."

                    });

            }

        }

    }
);


// ==========================================
// SERVIDOR
// ==========================================

const PORT =
    process.env.PORT ||
    3000;


app.listen(
    PORT,

    () => {

        console.log(
            `🔥 Urban Street backend funcionando en http://localhost:${PORT}`
        );

    }
);