// require('dotenv').config({path: "./env"})

// import mongoose from "mongoose"
// import { DB_NAME } from "./constants.js"

import dotenv from "dotenv"
import connectDB from "./db/index.js"
import {app} from "./app.js"

dotenv.config({
    path: "./.env"
})
 
connectDB()
.then(()=>{
    app.on("error: ",(error)=>{
        console.log("error",error)
        throw error
    })
    const PORT = process.env.PORT || 8000;
    app.listen(PORT || 8000 , ()=> {
        console.log(`Server is running at port : ${PORT}`)
    }) 
    
})
.catch((err)=>{
    console.log("MongoDB Connection Errror: ",err);
})





/* 
********------------- we add mongodb in single approch----------

import express from "express"
const app = express()

( async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("ERROR: ", error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`app is listening on port ${process.env.PORT}`)   
        })
    } catch (error) {
        console.error("ERROR:",error)
        throw error
    }
})()

*/