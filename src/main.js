import express from "express"
import { database_connection } from "./DB/connection.js"
import router_handler from "./utils/router_handler.utils.js"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import cookieParser from "cookie-parser"
import  dotenv  from "dotenv"
import { validateCookies } from "./middlewares/validation_cookies_middleware.js"
dotenv.config()


// to allow who can call me using cors
const whitelist = [process.env.FRONT_END_ORIGIN  , undefined , "*" /* to tell the cors to accept postman requests ( need to delete it after the test ) */ ]
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
   app.use(cors(corsOptions))
   app.use(helmet({xContentTypeOptions : false , crossOriginOpenerPolicy :true  }) );
  //  app.use(rate_limit)


   // to parse all coming data 
   app.use(express.json())

   // to pase the cookies and validate it
   app.use( cookieParser() )
   //  app.use(validateCookies)

    // database
    database_connection()

    // test for production
    app.get( "/test" , async (req , res,next ) =>{ if(req.params.value == "prod" ){ return next("router") }   res.status(200).json(  {message : "hello from prod test production " ,mms:req.xhr  } )    } )
    //all the routers
    router_handler( app ,express ) 


    const server = app.listen( process.env.PORT || 3000 , (error) =>{
        // console.log( "server is running on " , process.env.PORT     );
      if (error) {
       throw error // e.g. EADDRINUSE
        }
         console.log(`Listening on =========> ${JSON.stringify(server.address())}`)
        
    })



}


export default bootstrap


