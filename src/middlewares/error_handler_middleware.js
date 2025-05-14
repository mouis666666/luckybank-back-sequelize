


export const error_handler_middleware = (api) =>{

    return ( req, res, next ) =>{

        api(req , res , next).catch(( error ) =>{
            console.log(`error in${req.ul} from error handler middleware ======> ` , error );
            return next(  new Error(error.massage, {cause:500}))  
    })
    }
}

export const global_error_handler = ( err, req, res , next ) =>{
    console.log(`global error handler ${ err.massage } `);
    return res.status(500).json({ message :"  something went wrong ======> " , err:err.massage  })
    
}