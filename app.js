//Configuración SERVER
const express = require('express');
const cors = require('cors'); // en caso de..
const fs = require('fs'); //filesysyem
const axios = require('axios');
const { v4: uuid } = require('uuid');
const app = express();
const port = 3000;



app.listen(port, console.log(`Servidor ON escuchando en puerto ${port}`))

app.use(express.json()); //Middleware
app.use(cors()); //Se habilita CORS

//Ruta que apunta al html
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

//POST
//Almacenamiento de un nuevo roomate

app.post("/roommate", async (req, res) => {
    try {
        const { data } = await axios.get("https://randomuser.me/api"); // Llamado de la API
        const randomRoommate = data.results[0];

        // Creación de objeto para el nuevo roommate
        const roommate = {
            id: uuid(), // Generador de ID unico
            nombre: `${randomRoommate.name.first} ${randomRoommate.name.last}`,
            debe: "",
            recibe: ""
        };

        console.log(roommate); //impresión por consola

        const roommatesData = JSON.parse(fs.readFileSync("Roommates.json", "utf-8")); // Leer archivo roomates.json
        const roommates = roommatesData.roommates;
        roommates.push(roommate); // Agregar nuevo roommate
        fs.writeFileSync("Roommates.json", JSON.stringify(roommatesData)); // Escribir al archivo roomates.json
        //Enviar respuesta JSON
        res.status(201).json({
            mensaje: "Roommate agregado correctamente", // Enviar respuesta con código 201 para indicar que se creó correctamente
            roommate: roommate
        }); 
    } catch (error) {
        console.error("Error al agregar un nuevo roommate:", error);
        res.status(500).json({error: "Error interno del servidor"}); // Enviar respuesta con código 500 en caso de error interno del servidor
    }
});

//RUTA GET

// Obtener todos los roommates almacenados
app.get("/roommate", (req, res) => {
    try {
        const roommatesData = JSON.parse(fs.readFileSync("Roommates.json", "utf-8")); // Leer archivo Roommates.json
        res.status(200).json(roommatesData); // Enviar respuesta con los roommates en formato JSON
    } catch (error) {
        console.error("Error al obtener los roommates:", error);
        res.status(500).json({ error: "Error interno del servidor" }); // Enviar respuesta con un objeto JSON en caso de error interno del servidor
    }
});

//GASTOS

//GET
// Obtener todos los gastos almacenados
app.get("/gasto", (req, res) => {
    try {
        const gastosData = JSON.parse(fs.readFileSync("gastos.json", "utf-8")); // Leer archivo gastos.json
        //const gastos = gastosData.gastos; //ver esta lineas!!
        res.status(200).json(gastosData); // Enviar respuesta con los gastos en formato JSON
    } catch (error) {
        console.error("Error al obtener los gastos:", error);
        res.status(500).json({ error: "Error interno del servidor" }); // Enviar respuesta con un objeto JSON en caso de error interno del servidor
    }
});

//POST
// Almacenar un nuevo gasto
app.post("/gasto", async (req, res) => {
    try {
        // Obtener los datos del gasto del cuerpo de la solicitud
        const { roommate, descripcion, monto } = req.body;
        console.log(req.body) //imprimir

        // Crear el objeto para el nuevo gasto
        const nuevoGasto = {
            id: uuid(),//nuevo id
            roommate,
            descripcion,
            monto
        };
        console.log(nuevoGasto);

        // Leer el archivo gastos.json
        const gastosData = JSON.parse(fs.readFileSync("gastos.json", "utf-8"));
        const gastos = gastosData.gastos;

        // Agregar el nuevo gasto a la lista de gastos
        gastos.push(nuevoGasto);

        // Escribir los gastos actualizados en el archivo gastos.json
        fs.writeFileSync("gastos.json", JSON.stringify(gastosData));

        // Enviar respuesta con código 201 y el nuevo gasto
        res.status(201).json({ 
            mensaje: "Gasto agregado correctamente", 
            gasto: nuevoGasto }); 
    } catch (error) {
        console.error("Error al agregar un nuevo gasto:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

//PUT
// Actualizar un gasto
app.put("/gasto", (req, res) => {
    try {
        const { id } = req.query; // Obtener el ID del gasto de las Query Strings
        const { roommate, descripcion, monto } = req.body; // Obtener los datos actualizados del cuerpo de la solicitud

        // Crear el objeto actualizado del gasto
        const gastoActualizado = { id, roommate, descripcion, monto };

        // Leer los datos de los gastos del archivo gastos.json
        const gastosData = JSON.parse(fs.readFileSync("gastos.json", "utf-8"));
        const gastos = gastosData.gastos;

        // Buscar y actualizar el gasto correspondiente en la lista de gastos
        const indiceGasto = gastos.findIndex(g => g.id === id);
        if (indiceGasto !== -1) {
            gastos[indiceGasto] = gastoActualizado;
        } else {
            return res.status(404).send("El gasto no se encontró");
        }

        // Escribir los gastos actualizados en el archivo gastos.json
        fs.writeFileSync("gastos.json", JSON.stringify(gastosData));

        // Enviar respuesta con un mensaje de éxito
        res.send("Gasto modificado exitosamente");
    } catch (error) {
        console.error("Error al modificar el gasto:", error);
        res.status(500).send("Ocurrió un error interno del servidor");
    }
});



// Eliminar un gasto

app.delete("/gasto", (req, res) => {
    try {
        const { id } = req.query;
        const gastosJSON = JSON.parse(fs.readFileSync("gastos.json", "utf-8"));
        const gastos = gastosJSON.gastos;
        gastosJSON.gastos = gastos.filter((g) => g.id !== id);
        fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON));
        res.send("gasto eliminado con éxito");
    }
    catch {
        res.status(500).send("Algo salió mal")
    }
})

//RECALCULO en proceso

const recalcularCuentas = () => {
    try {
        // Leer el archivo Roommates.json
        const roommatesData = JSON.parse(fs.readFileSync("Roommates.json", "utf-8"));
        const roommates = roommatesData.roommates;

        // Leer el archivo gastos.json
        const gastosData = JSON.parse(fs.readFileSync("gastos.json", "utf-8"));
        const gastos = gastosData.gastos;

        // Calcular el monto total de los gastos
        const montoTotal = gastos.reduce((total, gasto) => total + gasto.monto, 0);

        // Recorrer la lista de roommates
        roommates.forEach((roommate) => {
            let recibeProporcional = 0;
            let debe = 0;

            // Calcular el monto proporcional que debe recibir el roommate
            recibeProporcional = montoTotal / roommates.length; // Dividir el monto total entre el número de roommates

            // Calcular el monto que el roommate debe
            gastos.forEach((gasto) => {
                if (gasto.roommate === roommate.nombre) {
                    debe += gasto.monto; // Sumar el monto al debe si el roommate participó en el gasto
                }
            });

            // Actualizar los saldos en Roommates.json
            roommate.debe = (debe - recibeProporcional).toFixed(2); // Redondear a 2 decimales
            roommate.recibe = recibeProporcional.toFixed(2); // Redondear a 2 decimales
        });

        // Escribir los cambios en Roommates.json
        fs.writeFileSync("Roommates.json", JSON.stringify(roommatesData));

        console.log("Cuentas recalculadas y actualizadas correctamente.");
    } catch (error) {
        console.error("Error al recalcular las cuentas:", error);
    }
};

