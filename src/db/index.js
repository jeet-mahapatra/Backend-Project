import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `mongodb+srv://jeetvictus:<password>@cluster0.fty5p.mongodb.net/${DB_NAME}`  //process.env.MONGO_DB use karne me error araha he ------>>>>  MongoParseError: Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"
        );
        console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`)
        
    } catch (error) {
        console.log("MONGODB connection Failed : ", error)
        process.exit(1)
    }
}
 
export default connectDB
