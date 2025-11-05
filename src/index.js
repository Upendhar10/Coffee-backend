import dotenv from "dotenv/config";
import app from './app.js';
import connectDB from './database/index.database.js';

console.log(process.env.MONGO_DB_URI);
console.log(process.env.PORT);

// When Path is specified, unable to retrieve env variables.
// dotenv.config({
//     path:'./.env'
// })

const PORT = process.env.PORT || 8000

connectDB()
.then(() => {
    app.listen(PORT, (request, response) => {
        console.log(`Server is Listening at PORT ; ${PORT}`);
    })
    app.on("error", (error) =>{
        console.log('ERR:', error);
        throw error;
    })
})
.catch((err) => {
    console.log(`MONGO_DB CONNECTION FAILED !!!`, err);
})