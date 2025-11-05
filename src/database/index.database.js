import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"

const connectDB = async () => {
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);
        console.log(
            `\n MONGO_DB CONNECTION SUCESSFULL !! 
            \n DB HOST : ${connectInstance.connection.host}`
        )
    } catch (error) {
        console.log('MONGO_DB CONNECTION FAILED', error);
        process.exit(1);
    }
}

export default connectDB;
