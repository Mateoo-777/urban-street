import {
    db
}
from "./firebase.js";


import {
    collection,
    onSnapshot,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";



// ==========================================
// PRODUCTOS
// ==========================================

export function escucharProductos(callback) {

    const productosRef =
        collection(
            db,
            "productos"
        );


    onSnapshot(

        productosRef,

        function(snapshot) {

            const productos = [];


            snapshot.forEach(
                function(documento) {

                    productos.push({

                        id: documento.id,

                        ...documento.data()

                    });

                }
            );


            callback(productos);

        },

        function(error) {

            console.error(
                "Error leyendo productos:",
                error
            );

        }

    );

}



// ==========================================
// BUSCAR CÓDIGO PROMOCIONAL
// ==========================================

export async function buscarCodigoPromocion(
    codigo
) {

    const codigosRef =
        collection(
            db,
            "codigos"
        );


    const consulta =
        query(

            codigosRef,

            where(
                "codigo",
                "==",
                codigo.toUpperCase()
            ),

            where(
                "activo",
                "==",
                true
            )

        );


    const resultado =
        await getDocs(
            consulta
        );


    if (resultado.empty) {

        return null;

    }


    const documento =
        resultado.docs[0];


    return {

        id: documento.id,

        ...documento.data()

    };

}

// ==========================================
// CREAR PEDIDO
// ==========================================

export async function crearPedido(pedido) {

    const pedidosRef =
        collection(
            db,
            "pedidos"
        );


    const documento =
        await addDoc(
            pedidosRef,
            {
                ...pedido,

                creadoEn:
                    serverTimestamp(),

                estadoPago:
                    "pendiente",

                estadoPedido:
                    "nuevo"
            }
        );


    return documento.id;
}