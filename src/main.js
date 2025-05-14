import express from "express"
import { database_connection } from "./DB/connection.js"
import router_handler from "./utils/router_handler.utils.js"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { configDotenv } from "dotenv"
configDotenv()


// to allow who can call me using cors
const whitelist = [process.env.FRONT_END_ORIGIN  , undefined /* to tell the cors to accept postman requests ( need to delete it after the test ) */ ]
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}




// // to limit much req
// const rate_limit =  rateLimit({
//     windowMs : 1 * 60 * 1000 , // 1 minutes
//     limit : 10 ,
//     message : "too many requests , please try again later " ,
//     legacyHeaders : false
// })



 const bootstrap = () =>{
   const app = express()

   
   //security part
   app.disable("X-Powered-By")
   app.use(cors(corsOptions))
   app.use(helmet({xContentTypeOptions : false , crossOriginOpenerPolicy :false }) );
  //  app.use(rate_limit)


   // to parse all coming data 
   app.use(express.json())

    // database
    database_connection()


    router_handler( app ,express )


    app.listen( process.env.PORT || 3000 , () =>{
        console.log( "server is running on " , process.env.PORT     );
        
    }  )



}


export default bootstrap


