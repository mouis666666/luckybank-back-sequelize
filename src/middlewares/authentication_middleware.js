import  jwt  from 'jsonwebtoken';






export const authentication_middleware = () =>{
    return async ( req , res , next ) =>{

        try {
            const { access_token } = req.headers

            // decode the data
            const decoding_access_token = jwt.verify(access_token , process.env.ACCESS_TOKEN_KEY)

            // check if in black list
            const if_black_list = await black_list_model.findOne({token_id:decoding_access_token.jti})
            if ( if_black_list) {return res.status(401).json({ message :"this token is expired please login again"  }) }

            // find the data
            const User = await user_model.findById(decoding_access_token._id , "-password -__v")
            if (!User) { return res.status(404).json({ message :"this user is not found" }) }
            
            // console.log( User  , "ddddddddddddd" );
            req.login_user = { ...User._doc , token:{  token_id:decoding_access_token.jti , expiration_data:decoding_access_token.exp } }
            // console.log( req.login_user );
            
            next()
        } catch (error) {
            console.log(  "internal authentication middleware error" , error );
            res.status(500).json({ message : "internal authentication middleware error " , error })
        }

    }
}



export const authorization_middleware = (allow_role) =>{
    return async ( req , res , next ) =>{
 
        try {
            // console.log(  req.login_user );
            
            const { role:login_user_role } = req.login_user 

            const is_user_allowed = allow_role.includes(  login_user_role )
            if (!is_user_allowed) { return res.status(401).json({ message :"unauthorized" }) }
            
            next()
        } catch (error) {
            console.log(  "internal authorization middleware  error" , error );
            res.status(500).json({ message : "internal authorization middleware  error" , error })
        }

    }
}