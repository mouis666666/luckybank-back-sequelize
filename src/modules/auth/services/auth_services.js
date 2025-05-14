import { send_Email_event } from "../../../config/send_email_verify.config.js";
import User_model from "../../../DB/models/Users_model.js";
import path from "path"
import  jwt  from 'jsonwebtoken';
import { compareSync } from "bcrypt";
import { log } from "console";



 /*  🔐 Authentication & Security APIs
POST /auth/2fa/setup – Generate 2FA secret for TOTP (Google Authenticator)

POST /auth/2fa/verify – Verify 2FA code

GET /auth/activity-log – Get recent login/IP history
**/



export const sign_up_service = async( req , res ) => {

    try {
     
        
    const { FirstName, LastName, Email, Phone , Password , rePassword  , Age } = req.body

    // if pass right
    if (Password != rePassword ) { return res.status(409).json({ message : "the pass must match the repass" }) }

    // if email exist
    const if_email_exist = await User_model.findOne({ where : {Email:Email }})
    // console.log( "fdsfdffffffff" , Email , if_email_exist );
    
    if (if_email_exist !== null ) { return res.status(409).json({ message : "this email is already exist" }) }


    // create a token to the user_model
    const token_email_verify = jwt.sign({Email} , process.env.JWT_EMAIL_SECRET_KEY , {expiresIn : "10m" } )

    // send verify email 
    const confirm_email_link = `${req.protocol}://${req.headers.host}/auth/verify/${token_email_verify}`
    // console.log( token_email_verify );
    
    send_Email_event.emit( "Send_Email" , {
        to : Email  ,
        subject : " this mail from Lucky-bank to verify your email" , 
        html :` <h2> verify your email </h2>       
       <a href="${ confirm_email_link }" > click there to verify  </a>` ,

        // attachments : path.resolve("../../../Assets/verify_email/download.png")
    }  )


    // create the user
    // const user = await User_model.create( {FirstName, LastName, Email, Phone , Password , rePassword  , Age} )

    // if (user) {
        // return  res.status(201).json({ message : "the user has been created" , user })
    // } else {
        return  res.status(201).json({ message : "failed to SignUp"  }) 
    // }
    
    } catch (error) {
        console.log( "error in signup ===========> " , error );
       return res.status(500).json({ message : "internal server error " })
    }
}



// MAKE THE parinoid soft delete


export const login_service = async ( req ,res  ) => {
    try {
        const { Email , Password } = req.body 

    // find email
    const user = await User_model.findOne({where : { Email :Email }  });
    if (user == null) { return res.status(409).json({ message : "this email is not exist" }) }

    // check the password
    const pass_right =  compareSync( Password , user.Password  )
    console.log(pass_right);
    
    if (pass_right == false ) { return res.status(409).json({ message : "this email or the pas is wrong" }) }
    
    // make the token

    // make the session 

    // delete the black list if has one


    // send the data
    if (user) {
        return  res.status(201).json({ message : "the user has been created" , user })
    } else {
        return  res.status(201).json({ message : "failed to SignUp"  }) 
    }
    } catch (error) {
        console.log( "error in login =============> " , error );
       return res.status(500).json({ message : "internal server error " })
    }
}



export const verify_email_service = async ( req ,res  ) => {
    try {
        const { Email , Password } = req.body 

        
    } catch (error) {
        console.log( "error in verify email =============> " , error );
       return res.status(500).json({ message : "internal server error " })
    }
}

export const refresh_token_service = async ( req ,res  ) => {
    try {
        const { Email , Password } = req.body 

        
    } catch (error) {
        console.log( "error in verify email =============> " , error );
       return res.status(500).json({ message : "internal server error " })
    }
}


export const forget_password_service = async ( req ,res  ) => {
    try {
        const { Email , Password } = req.body 

        
    } catch (error) {
        console.log( "error in verify email =============> " , error );
       return res.status(500).json({ message : "internal server error " })
    }
}


export const reset_password_service = async ( req ,res  ) => {
    try {
        const { Email , Password } = req.body 

        
    } catch (error) {
        console.log( "error in verify email =============> " , error );
       return res.status(500).json({ message : "internal server error " })
    }
}











/** //////////////////////////////////// 🌐  Main APIs
🔑 Auth
POST /auth/register

POST /auth/login

POST /auth/google   

POST /auth/forgot-password

POST /auth/reset-password

GET /auth/me

POST /auth/logout






👤 User & Account
GET /users/me

GET /accounts/me

POST /accounts/create (create new account)

GET /accounts/:id









💳 Transactions
POST /transactions/deposit

POST /transactions/withdraw

POST /transactions/transfer (trigger real-time update via Socket.IO)

GET /transactions/history

GET /transactions/:id







📊 Admin-only APIs
GET /admin/users

GET /admin/transactions

PATCH /admin/users/:id/block */



