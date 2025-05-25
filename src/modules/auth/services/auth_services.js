import { send_Email_event } from "../../../config/send_email_verify.config.js";
import User_model from "../../../DB/models/Users_model.js";
import path from "path"
import  jwt  from 'jsonwebtoken';
import { compareSync, hashSync } from "bcrypt";
import { v4 as uuidv4 } from 'uuid';
import Session_Model from "../../../DB/models/Sessions_model.js";
import {  DATE } from "sequelize";
import { OAuth2Client } from "google-auth-library";
import { provider } from "../../../constants/constants.js";
import bcrypt from "bcrypt"
import { encryption } from "../../../utils/encryption.utils.js";



 /*  🔐 Authentication & Security APIs
POST /auth/2fa/setup – Generate 2FA secret for TOTP (Google Authenticator)

POST /auth/2fa/verify – Verify 2FA code

GET /auth/activity-log – Get recent login/IP history

* **Users table**

  * A new user signs up or logs in (via email/password or Google). done 
  * Upon registration, a new record is created in the `Users` table. done
  * `google_id` is filled only if they use Google login. done
  * `role` determines access level (admin or regular user). done

* **Sessions table**

  * When a user logs in successfully, a new token (usually JWT or session ID) is generated and stored with an `expires_at` time.
  * This session is validated for each request to verify that the user is authenticated. 🐮🐮

* **blacklist\_token table**

  * When a user logs out or forgets their password, their token or OTP is added here to **invalidate** it (especially for JWT).
  * During login, tokens are checked against this table to prevent reuse of old/insecure tokens.

---

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
    const token_email_verify = jwt.sign({Email} , process.env.JWT_EMAIL_SECRET_KEY , {expiresIn : "10h" } )

    // send verify email 
    const confirm_email_link = `${req.protocol}://${req.headers.host}/auth/verify/${token_email_verify}`
    send_Email_event.emit( "Send_Email" , {
        to : Email  ,
        subject : " this mail from Lucky-bank to verify your email" , 
        html :` <h2> verify your email </h2>       
       <a href="${ confirm_email_link }" > click there to verify  </a>` ,
    //      attachments: [{ 👽👽👽
    //   content: path.resolve("../../../Assets/verify_email/download.png"),
    //   filename: "download.png",
    //   type: "image/png",
    //   disposition: "attachment",
    // },
//   ],
    }  )

    // create the user
    const user = await User_model.create( {FirstName, LastName, Email, Phone , Password , rePassword  , Age} )

    if (user) {
        return  res.status(201).json({ message : "the user has been created" , user })
    } else {
        return  res.status(409).json({ message : "failed to SignUp"  }) 
    }
    
    } catch (error) {
        console.log( "error in signup ===========> " , error );
       return res.status(500).json({ message : "internal server error " })
    }
}


export const login_service = async ( req ,res  ) => { //👽
    try {
        const { Email , Password } = req.body 
        
        // find email
        const user = await User_model.findOne({where : { Email :Email }  });
        if (user == null) { return res.status(409).json({ message : "this email is not exist" }) }
        
        // check the password
        const pass_right =  compareSync( Password , user.Password  )
        // console.log(pass_right);
        
        if (pass_right == false ) { return res.status(409).json({ message : "this email or the pas is wrong" }) } 
        
        // make the token
        const access_token = jwt.sign( {id:user.id , email : user.email } , process.env.JWT_ACCESS_TOKEN_SECRET_KEY, { expiresIn :process.env.EXPIRATION_DATA_ACCESS_TOKEN_KEY , jwtid:uuidv4()}  )
        const refresh_token = jwt.sign( {id:user.id , email : user.email } , process.env.JWT_REFRESH_TOKEN_SECRET_KEY  , { expiresIn :process.env.EXPIRATION_DATA_REFRESH_TOKEN_KEY , jwtid:uuidv4()}  )
        

        // make the session token
        const session_token =  await encryption( {value : uuidv4() +"/"+ user.id +"/"+ Date.now() , secret_key : process.env.SESSION_SECRET_KEY }) // combine with user-specific data

        // make the session  
        const session_done = await Session_Model.create({ Token : session_token , Expires_at : new Date( Date.now() + 300 * 60 * 1000  ) , fk_user_id : user.id  })
        if (!session_done ) { return res.status(40).json({ message : "failed to signin try again later" }) }
        
        // delete the black list if has one  trigger 👽👽👽
        

        // make the cookies
        res.cookie("token", access_token , {
          httpOnly: true,
        //   secure: process.env.NODE_ENV === "production", // HTTPS only in production 
          sameSite: "Strict", // CSRF protection
          maxAge: 1000 * 60 * 60 * 24, // 1 day
        });
        console.log( "cookies"  , req.cookies );  // for rest
        


        // send the data
        if (user) {
            return  res.status(201).json({ message : " sign in is success" , user , access_token :access_token , refresh_token :refresh_token })
        } else {
            return  res.status(409).json({ message : "failed to SignUp"  }) 
        }
    } catch (error) {
        console.log( "error in login =============> " , error );
        return res.status(500).json({ message : "internal server error " })
    }
}



export const verify_email_service = async ( req ,res  ) => {
    try {
        const { data } = req.params
        
        const decoding_data = jwt.verify(  data , process.env.JWT_EMAIL_SECRET_KEY )  
        console.log(   "dfsdf" , decoding_data );
        
        // case one
        const user = await User_model.findOne({ where : {Email : decoding_data.Email}  })
        if (!user ) {  return res.status(409).json( { message : "failed to verify" } ) }
        
        // case two after updata
        const updated_user =  await (await user.update({isVerify :true})).save
        if (!updated_user ) {  return res.status(409).json( { message : "failed to verify" } ) }
        
        
        
        if (user) {
            return  res.status(200).json({ message : " email has been verified" })
        } else {
            return  res.status(409).json({ message : "failed to  verify email"  }) 
        }
    } catch (error) {
        console.log( "error in verify email =============> " , error );
        return res.status(500).json({ message : "internal server error " })
    }
}

export const refresh_token_service = async ( req ,res  ) => {
    try {
        const { refresh_token } = req.headers
        
        // decoding data
        const decoding_data = jwt.verify( refresh_token  , process.env.JWT_REFRESH_TOKEN_SECRET_KEY )
        if (!decoding_data) {return  res.status(409).json({ message : " failed to decoding refresh token" })}
        
        const new_access_token  = jwt.sign( { id: decoding_data.id , email : decoding_data.Email }  , process.env.JWT_ACCESS_TOKEN_SECRET_KEY ,{ expiresIn : "1h" ,jwtid :uuidv4()   }) 
        const new_refresh_token = jwt.sign( { id: decoding_data.id , email : decoding_data.Email }  , process.env.JWT_REFRESH_TOKEN_SECRET_KEY ,{ expiresIn : "1d" , jwtid :uuidv4() })
        
        if ( new_access_token && new_refresh_token ) {
            return  res.status(200).json({ message : "the token has been refreshed"  , access_token : new_access_token , refresh_token :new_refresh_token })
        } else {
            return  res.status(409).json({ message : "failed to  refresh token"  }) 
        }
    } catch (error) {
        console.log( "error in refresh token =============> " , error );
        return res.status(500).json({ message : "internal server error " })
    }
}

export const sign_in_gmail_service = async ( req , res ) =>{

    try {
    const { idToken } = req.body

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,  // Specify the WEB_CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const { email_verified , email } = payload;
    
    if (email_verified !== true) { return res.status(404).json({ message :" login has been failed "  })}

    const User = await  User_model.findOne({Where: { Email : email } })
    if (!User) { return res.status(404).json({ message :" user not found"  })}
    // console.log(User);
    

    const access_token = jwt.sign( {email:email , id :User?.id } , process.env.JWT_ACCESS_TOKEN_SECRET_KEY, { expiresIn :process.env.EXPIRATION_DATA_ACCESS_TOKEN_KEY , jwtid:uuidv4()}  )
    const refresh_token = jwt.sign( {email:email , id :User?.id } , process.env.JWT_REFRESH_TOKEN_SECRET_KEY  , { expiresIn :process.env.EXPIRATION_DATA_REFRESH_TOKEN_KEY , jwtid:uuidv4()}  )

    if (User) {
     return res.status(201).json({ message :" user has been  signin " , access_token : access_token , refresh_token : refresh_token  })
    }else{
        return res.status(200).json({ message :" failed to signin" })
    }
    } catch (error) {
        console.log( "error in sign in with gmail =============> " , error );
        return res.status(500).json({ message : "internal server error " })
    }
}




export const sign_up_gmail_service = async ( req , res ) =>{

    try {
    const { idToken } = req.body

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,  // Specify the WEB_CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const { email_verified , email ,  name } = payload;

    // check if verify
    if (email_verified !== true) { return res.status(404).json({ message :" login has been failed "  })}

    // check if email is here
    const User = await  User_model.findOne({Where: { Email : email } })
    if (User) {return res.status(409).json({ message :" this email is already exists" })}

    const new_user = await User_model.create({
        UserName : name,
        isVerify : true ,
        provider : provider.GOOGLE,
        Email:email,
        Google_Id : uuidv4() ,
        password : hashSync(uuidv4() , +process.env.HASH_PASS_SALTP )
    })

    if (new_user) {
        
     return res.status(201).json({ message :" user has been  signup " })
    }else{
        return res.status(200).json({ message :" failed to signUp" })
    }
        
        
    } catch (error) {
        console.log( "error in signup =============> " , error );
        return res.status(500).json({ message : "internal server error " })
    }
}



export const forget_password_service = async ( req ,res  ) => {//👽
    try {
        const { Email } = req.body

        // find the email
        const  user = await  User_model.findOne( {where:{Email :Email  }})
        if (!user ) { return res.status(404).json({  massage : " email is not found "})  }

        // make the OTP and save it in the database
        const TOTP =  Math.floor(Math.random()*10000);
        const hash_Totp = bcrypt.hashSync( OTP.toString() , +process.env.TOTP_SALT )

        //   updata Totp
        const updated_user_Totp =  await (await user.update({TOTP :hash_Totp})).save
        
        //  const otp_save = await user_model.create({OTP:hash_otp})  =>( this way is not good in this case cause it's search in all the database )

        // send the TOTP in the email 
        
        if (!updated_user_Totp) {
            return res.status(409).json( { message : "failed to send OTP" } )
        } else {
            return  res.status(200).json({ message : " the TOTP has been send" })
        }
        
        
    } catch (error) {
        console.log( "error in forget password =============> " , error );
        return res.status(500).json({ message : "internal server error " })
    }
}


export const reset_password_service = async ( req ,res  ) => {//👽
    try {
        const { TOTP , Email , new_password , confirm_password } = req.body ;

        // check for pass
        if ( new_password !== confirm_password ) { return res.status(404).json({  massage : " the password does't match the confirmation_password"})  }

        // check for email
        const user = await User_model.findOne({ where : { Email: Email}})
        if (!user ) { return res.status(404).json({  massage : " this email is not here"})  }

        //check for the TOTP
        const if_otp_match =compareSync(TOTP?.toString() , user.TOTP ) 
        if (!if_otp_match ) { return res.status(404).json({  massage : " this OTP is not correct "})  }

        // hash the pass
        const hash_new_pass = hashSync(new_password , +process.env.SALT )

        // updata password 1
        // await User_model.updateOne({email },{ password:hash_new_pass , $unset:{OTP:"" }})
        // const updated_user =  await (await user.update({isActive :true})).save
        // if (!updated_user ) {  return res.status(409).json( { message : "failed to verify" } ) }
        
        
        if (!updated_user) {
            return res.status(409).json( { message : "failed to reset the password" } )
        } else {
            return  res.status(200).json({ message : " the pass has been rested" })
        }
    } catch (error) {
        console.log( "error in reset password =============> " , error );
        return res.status(500).json({ message : "internal server error " })
    }
}


export const logout_service = async ( req ,res  ) => {//👽
    try { 
        // how you can know the right device
        const { Email } = req.body 
    
        
     res.clearCookie("token", {
       httpOnly: true,
      //  secure: process.env.NODE_ENV === "production",
       sameSite: "Strict"
     });

        if (user) {
            return  res.status(201).json({ message : " logout is success"  })
        } else {
            return  res.status(409).json({ message : "failed to SignUp"  }) 
        }


    } catch (error) {
        console.log( "error in logout =============> " , error );
        return res.status(500).json({ message : "internal server error " })
    }
}

// MAKE THE parinoid soft delete
export const delete_account_service = async ( req ,res  ) => {//👽
    try {
        const { Email , Password } = req.body 
        
        
    } catch (error) {
        console.log( "error in deleted account =============> " , error );
        return res.status(500).json({ message : "internal server error " })
    }
}







/** //////////////////////////////////// 🌐  Main APIs
 🔑 Auth






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



