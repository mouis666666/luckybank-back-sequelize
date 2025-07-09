import { send_Email_event } from "../../../config/send_email_verify.config.js";
import User_model from "../../../DB/models/Users_model.js";
import path from "path";
import jwt from "jsonwebtoken";
import { compareSync, hashSync } from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import Session_Model from "../../../DB/models/Sessions_model.js";
import { OAuth2Client } from "google-auth-library";
import { provider } from "../../../constants/constants.js";
import bcrypt from "bcrypt";
import { encryption } from "../../../utils/encryption.utils.js";
import BlacklistToken_Model from "../../../DB/models/BlackList_token_model.js";

/*  🔐 Authentication & Security APIs

GET /auth/activity-log – Get recent login/IP history


* **Users table**

  * A new user signs up or logs in (via email/password or Google). done 
  * Upon registration, a new record is created in the `Users` table. done
  * `google_id` is filled only if they use Google login. done
  * `role` determines access level (admin or regular user). done

* **Sessions table**

  * When a user logs in successfully, a new token (usually JWT or session ID) is generated and stored with an `expires_at` time. Done
  * This session is validated for each request to verify that the user is authenticated. 🐮🐮  done

* **blacklist\_token table**
  * During login, tokens are checked against this table to prevent reuse of old/insecure tokens. done

---

**/

export const sign_up_service = async (req, res) => {
  try {
    const { FirstName, LastName, Email, Phone, Password, rePassword, Age } =
      req.body;

    // if pass right
    if (Password != rePassword) {
      return res
        .status(409)
        .json({ message: "the pass must match the repass" });
    }

    // if email exist
    const if_email_exist = await User_model.findOne({
      where: { Email: Email },
    });
    // console.log( "fdsfdffffffff" , Email , if_email_exist );

    if (if_email_exist !== null) {
      return res.status(409).json({ message: "this email is already exist" });
    }

    // create a token to the user_model
    const token_email_verify = jwt.sign(
      { Email },
      process.env.JWT_EMAIL_SECRET_KEY,
      { expiresIn: "10h" }
    );

    // send verify email
    const confirm_email_link = `${req.protocol}://${req.headers.host}/auth/verify/${token_email_verify}`;
    send_Email_event.emit("Send_Email", {
      to: Email,
      subject: " this mail from Lucky-bank to verify your email",
      html: ` <h2> verify your email </h2>       
       <a href="${confirm_email_link}" > click there to verify  </a>`,
      //      attachments: [{ 👽👽👽
      //   content: path.resolve("../../../Assets/verify_email/download.png"),
      //   filename: "download.png",
      //   type: "image/png",
      //   disposition: "attachment",
      // },
      //   ],
    });

    // create the user
    const user = await User_model.create({
      FirstName,
      LastName,
      Email,
      Phone,
      Password,
      rePassword,
      Age,
    } 
  );

    const new_user = { userName : user.UserName ,  userEmail : user.Email  } 

    if (user) {
      return res
        .status(201)
        .json({ message: "the user has been created , but need to login first ", new_user });
    } else {
      return res.status(409).json({ message: "failed to SignUp" });
    }
  } catch (error) {
    console.log("error in signup ===========> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

export const login_service = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    // find email
    const user = await User_model.findOne({ where: { Email: Email }  , attributes: { exclude: ["Google_Id",
        "isDeleted",
        "isVerified",
        "createdAt",
        "updatedAt",
        "deletedAt"  ] } });
    if (user == null) {
      return res.status(409).json({ message: "this email is not exist" });
    }

    // check the password
    const pass_right = compareSync(Password, user.Password);
    // console.log(pass_right);

    if (pass_right == false) {
      return res
        .status(409)
        .json({ message: "this email or the pas is wrong" });
    }

    // Step 1: Count active sessions
    const existingSessions = await Session_Model.findAll({
      where: {
        fk_user_id: user.id,
        is_active: true,
      },
      order: [["createdAt", "ASC"]], // oldest first
    });

    // Step 2: If 3 active, remove oldest
    if (existingSessions.length >= 3) {
      const oldest = existingSessions[0];
      await oldest.destroy(); // or update is_active = false
    }
    
    // make the token
    const access_token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
      {
        expiresIn: process.env.EXPIRATION_DATA_ACCESS_TOKEN_KEY,
        jwtid: uuidv4(),
      }
    );
    const refresh_token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
      {
        expiresIn: process.env.EXPIRATION_DATA_REFRESH_TOKEN_KEY,
        jwtid: uuidv4(),
      }
    );

    // make the session token
    const session_token = await encryption({
        /*  👽  need to updata the data in the last of the project this is not secure 👽    */
      value:
        uuidv4() +
        "/" +
        { userId: user.id, userEmail: user.email } +
        "/" +
        Date.now(),
      secret_key: process.env.SESSION_SECRET_KEY,
    }); // combine with user-specific data

    // make the session
    const session_done = await Session_Model.create({
      Token: session_token,
      Expires_at: new Date(Date.now() + 300 * 60 * 1000), // five hours
      fk_user_id: user.id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    if (!session_done) {
      return res
        .status(40)
        .json({ message: "failed to signin try again later" });
    }

    // delete the black list  trigger  has been finished >>>



    // make the cookies
    res.cookie("token", session_token, {
      httpOnly: true,
      //   secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "Strict", // CSRF protection
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });
    console.log("cookies", req.cookies); // for rest

    // send the data
    if (user) {
      return res
        .status(201)
        .json({
          message: " sign in is success",
          user,
          access_token: access_token,
          refresh_token: refresh_token,
        });
    } else {
      return res.status(409).json({ message: "failed to SignUp" });
    }
  } catch (error) {
    console.log("error in login =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

export const verify_email_service = async (req, res) => {
  try {
    const { data } = req.params;

    const decoding_data = jwt.verify(data, process.env.JWT_EMAIL_SECRET_KEY);
    console.log("dfsdf", decoding_data);

    // case one
    const user = await User_model.findOne({
      where: { Email: decoding_data.Email },
    });
    if (!user) {
      return res.status(409).json({ message: "failed to verify" });
    }

    // case two after updata
    const updated_user = await (await user.update({ isVerify: true })).save;
    if (!updated_user) {
      return res.status(409).json({ message: "failed to verify" });
    }

    if (user) {
      return res.status(200).json({ message: " email has been verified" });
    } else {
      return res.status(409).json({ message: "failed to  verify email" });
    }
  } catch (error) {
    console.log("error in verify email =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

export const refresh_token_service = async (req, res) => {
  try {
    const { refresh_token } = req.headers;

    // decoding data
    const decoding_data = jwt.verify(
      refresh_token,
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY
    );
    if (!decoding_data) {
      return res
        .status(409)
        .json({ message: " failed to decoding refresh token" });
    }

    const new_access_token = jwt.sign(
      { id: decoding_data.id, email: decoding_data.Email },
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: "1h", jwtid: uuidv4() }
    );
    const new_refresh_token = jwt.sign(
      { id: decoding_data.id, email: decoding_data.Email },
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: "1d", jwtid: uuidv4() }
    );

    if (new_access_token && new_refresh_token) {
      return res
        .status(200)
        .json({
          message: "the token has been refreshed",
          access_token: new_access_token,
          refresh_token: new_refresh_token,
        });
    } else {
      return res.status(409).json({ message: "failed to  refresh token" });
    }
  } catch (error) {
    console.log("error in refresh token =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

export const sign_in_gmail_service = async (req, res) => {
  try {
    const { idToken } = req.body;

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Specify the WEB_CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const { email_verified, email } = payload;

    if (email_verified !== true) {
      return res.status(404).json({ message: " login has been failed " });
    }

    const User = await User_model.findOne({ Where: { Email: email } });
    if (!User) {
      return res.status(404).json({ message: " user not found" });
    }
    // console.log(User);

    const access_token = jwt.sign(
      { email: email, id: User?.id },
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
      {
        expiresIn: process.env.EXPIRATION_DATA_ACCESS_TOKEN_KEY,
        jwtid: uuidv4(),
      }
    );
    const refresh_token = jwt.sign(
      { email: email, id: User?.id },
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
      {
        expiresIn: process.env.EXPIRATION_DATA_REFRESH_TOKEN_KEY,
        jwtid: uuidv4(),
      }
    );

        // make the session token
    const session_token = await encryption({
        /*  👽  need to updata the data in the last of the project this is not secure 👽    */
      value:
        uuidv4() +
        "/" +
        { userId: User.id, userEmail: User.email } +
        "/" +
        Date.now(),
      secret_key: process.env.SESSION_SECRET_KEY,
    }); // combine with user-specific data

        // make the session
    const session_done = await Session_Model.create({
      Token: session_token,
      Expires_at: new Date(Date.now() + 300 * 60 * 1000), // five hours
      fk_user_id: User.id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    if (!session_done) {
      return res
        .status(40)
        .json({ message: "failed to signin try again later" });
    }

    if (User) {
      return res
        .status(201)
        .json({
          message: " user has been  signin ",
          access_token: access_token,
          refresh_token: refresh_token,
        });
    } else {
      return res.status(200).json({ message: " failed to signin" });
    }
  } catch (error) {
    console.log("error in sign in with gmail =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

export const sign_up_gmail_service = async (req, res) => {
  try {
    const { idToken } = req.body;

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Specify the WEB_CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const { email_verified, email, name } = payload;

    // check if verify
    if (email_verified !== true) {
      return res.status(404).json({ message: " login has been failed " });
    }

    // check if email is here
    const User = await User_model.findOne({ Where: { Email: email } });
    if (User) {
      return res.status(409).json({ message: " this email is already exists" });
    }

    const new_user = await User_model.create({
      UserName: name,
      isVerify: true,
      provider: provider.GOOGLE,
      Email: email,
      Google_Id: uuidv4(),
      password: hashSync(uuidv4(), +process.env.HASH_PASS_SALTP),
    });

    if (new_user) {
      return res.status(201).json({ message: " user has been  signup " });
    } else {
      return res.status(200).json({ message: " failed to signUp" });
    }
  } catch (error) {
    console.log("error in signup =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

export const forget_password_service = async (req, res) => { 
  try {
    const { Email } = req.body;

    // find the email
    const user = await User_model.findOne({ where: { Email: Email } });
    if (!user) {
      return res.status(404).json({ massage: " email is not found " });
    }

    // make the OTP and save it in the database
    const OTP = Math.floor(Math.random() * 10000);
    const hash_otp = bcrypt.hashSync(OTP.toString(), +process.env.OTP_SALT);

    //   updata Totp
    const updated_user_otp = await (
      await user.update({ OTP: hash_otp })
    ).save;

    // send the OTP in the email
       const send_otp = send_Email_event.emit("Send_Email" , {
            to:user.Email, // Single Source of Truth => mean must take the last code that you took and use it for good performance
            subject : "this is OTP for your password if this is not you forget about it" ,
            html: `from your account ${ user.Email } lucky-bank</hl>
            <p> the OTP is ${OTP}</p>` , 
        } )

        // console.log(send_otp);
        

    if (!updated_user_otp || send_otp == false ) {
      return res.status(409).json({ message: "failed to send OTP" });
    } else {
      return res.status(200).json({ message: " the OTP has been send" }); 
    }
  } catch (error) {
    console.log("error in forget password =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

export const verify_forget_password_service = async (req, res) => { 
  try {
    const { OTP  ,  Email , new_password , confirm_password  } = req.body;

    // find the email
    const user = await User_model.findOne({ where: { Email: Email } });
    if (!user) {
      return res.status(404).json({ massage: " email is not found " });
    }

    //check for the OTP
    const if_otp_match = compareSync(OTP?.toString(), user.OTP);
    if (!if_otp_match) {
      return res.status(404).json({ massage: " this OTP is not correct " });
    }

    if (new_password != confirm_password) {
      return res.status(403).json({ massage: "the pass must be like confirm_pass" });
    }

    // hash the pass
    const hash_new_pass = hashSync(new_password, +process.env.HASH_PASS_SALT);

    // updata password 
    const updated_pass_user =  await (
      await user.update({ Password: hash_new_pass , OTP : "" })
    ).save;


    if (!updated_pass_user ) {
      return res.status(409).json({ message: " there is something want wrong " });
    } else {

      // send the OTP in the email
       const send_confirmChangePass = send_Email_event.emit("Send_Email" , {
            to:user.Email, // Single Source of Truth => mean must take the last code that you took and use it for good performance
            subject : "secure your bank-account ( lucky-bank )" ,
            html: `<hl> from your Account ${ user.Email } at lucky-bank</hl>
            <p> Your password has been changed if this is not you connect us </p>` , 
        } )
      return res.status(200).json({ message: " the password has been changed " });
    }
  } catch (error) {
    console.log("error in forget password =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

export const reset_password_service = async (req, res) => {
  try {
    const { Email, new_password, confirm_password } = req.body;

    // check for pass
    if (new_password !== confirm_password) {
      return res
        .status(404)
        .json({
          massage: " the password does't match the confirmation_password",
        });
    }

    // check for email
    const user = await User_model.findOne({ where: { Email: Email } });
    if (!user) {
      return res.status(404).json({ massage: " this email is not here" });
    }

    // hash the pass
    const hash_new_pass = hashSync(new_password, +process.env.HASH_PASS_SALT);

    // updata password 
    const updated_pass_user =  await (
      await user.update({ Password: hash_new_pass  })
    ).save;

    if (!updated_pass_user) {
      return res.status(409).json({ message: "failed to reset the password" });
    } else {

      // send the OTP in the email
       const send_confirmChangePass = send_Email_event.emit("Send_Email" , {
            to:user.Email, // Single Source of Truth => mean must take the last code that you took and use it for good performance
            subject : "secure your bank-account ( lucky-bank )" ,
            html: `<hl> from your Account ${ user.Email } at lucky-bank</hl>
            <p> Your password has been changed if this is not you connect us </p>` , 
        } )

       // create the black list  
      // await BlacklistToken_Model.create({ TokenId: /* should come from the middleware auth ( the refresh and access token ) */  , expires_at: new Date() + 1000 * 60 * 60 * 24   })
      return res.status(200).json({ message: " the pass has been rested" });
    }
  } catch (error) {
    console.log("error in reset password =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

export const logout_service = async (req, res) => {
  try {
    const { Email } = req.body;

    // find the email
    const user =  await User_model.findOne({ where :  { Email : Email  } })
        if (user == null) {
      return res.status(409).json({ message: "this email is not exist" });
    }

    // fine the session
    const finDevice = await Session_Model.findAll({
      where: {
        fk_user_id: user.id,
        is_active: true,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"]
      },
    });
    
    // case 1
    if (finDevice.length == 0   ) {
      return res.status(409).json({ message: "there is something went wrong please try again later" });
    }

    // case 2
    if (finDevice.length == 1 ) {
      const theOne = finDevice[0];
      await theOne.update( { is_active : false }); 
      //   console.log( "one" );
      
    }if(finDevice.length > 1 ) {
      
      for (let i = 0 ; i < finDevice.length; i++){
        const theOne = finDevice[i];
        await theOne.update( { is_active : false }); 
      }
      
      //  console.log( "two" );
    } 
    
    
    // clear the cookies
    res.clearCookie("token", {
      httpOnly: true,
      //  secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    
      // create the black list  
      // await BlacklistToken_Model.create({ TokenId: /* should come from the middleware auth ( the refresh and access token ) */  , expires_at: new Date() + 1000 * 60 * 60 * 24  })
      return res.status(201).json({ message: " logout is success" });
  } catch (error) {
    console.log("error in logout =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

export const logout_all_service = async (req, res) => {
  //👽
  try {
    const { Email } = req.body;

    // find the email
    const user =  await User_model.findOne({ where :  { Email : Email  } })
        if (user == null) {
      return res.status(409).json({ message: "this email is not exist" });
    }

    // fine the session
    const finDevice = await Session_Model.findAll({
      where: {
        fk_user_id: user.id,
        is_active: true,
      },
    });
    
    // case 1
    if (finDevice.length == 0   ) {
      return res.status(409).json({ message: "there is something went wrong please try again later" });
    }

    // case 2
    if (finDevice.length == 1 ) {
      const theOne = finDevice[0];
      await theOne.update( { is_active : false });  
    //   console.log( "one" );
      
    }if(finDevice.length > 1 ) {

        for (let i = 0 ; i < finDevice.length; i++){
             const theOne = finDevice[i];
             await theOne.update( { is_active : false }); 
        }
        //  console.log( "two" );
    } 


    // clear the cookies
    res.clearCookie("token", {
      httpOnly: true,
      //  secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });


      // create the black list  
      // await BlacklistToken_Model.create({ TokenId: /* should come from the middleware auth ( the refresh and access token ) */  , expires_at: new Date() + 1000 * 60 * 60 * 24   })
      return res.status(201).json({ message: " logout is success" });
  } catch (error) {
    console.log("error in logout =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

// MAKE THE parinoid soft delete
export const delete_account_service = async (req, res) => { //👽
  try {
    const { Email, Password } = req.body;




     // create the black list  
     // await BlacklistToken_Model.create({ TokenId: /* should come from the middleware auth ( the refresh and access token ) */  , expires_at: new Date() + 1000 * 60 * 60 * 24  })
      return res.status(201).json({ message: " logout is success" });
  } catch (error) {
    console.log("error in deleted account =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};

