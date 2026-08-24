import {
    initializeApp
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";


import {
    getFirestore
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


import {
    getAuth
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";


import {
    getStorage
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const CLOUD_NAME = "jw16qafb";

const UPLOAD_PRESET = "urban_street_productos";

const firebaseConfig = {

    apiKey: "AIzaSyBkS95FERQhg_rD1uncjvofnvDkfeXSsmM",

    authDomain: "urban-street-4a7c1.firebaseapp.com",

    projectId: "urban-street-4a7c1",

    storageBucket: "urban-street-4a7c1.firebasestorage.app",

    messagingSenderId: "589169913778",

    appId: "1:589169913778:web:8f20a50189c9c580953eab",

    measurementId: "G-D5K4DLHPV8"

};



const app =
    initializeApp(firebaseConfig);


const db =
    getFirestore(app);


const auth =
    getAuth(app);


const storage =
    getStorage(app);



export {
    app,
    db,
    auth,
    storage
};

// ==========================================
// SUBIR IMAGEN A CLOUDINARY
// ==========================================

async function subirImagenCloudinary(archivo) {

    const formData = new FormData();

    formData.append(
        "file",
        archivo
    );

    formData.append(
        "upload_preset",
        UPLOAD_PRESET
    );


    const respuesta = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData
        }
    );


    if (!respuesta.ok) {

        throw new Error(
            "No se pudo subir la imagen a Cloudinary"
        );

    }


    const datos = await respuesta.json();


    return {
        url: datos.secure_url,
        publicId: datos.public_id
    };
}