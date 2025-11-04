import dotenv from "dotenv/config";
import connectDB from './database/index.database.js';

console.log(process.env.MONGO_DB_URI);
console.log(process.env.PORT);

// When Path is specified, unable to retrieve env variables.
// dotenv.config({
//     path:'./.env'
// })

connectDB();