import * as auth_services from "./services/auth_services.js"
import { Router } from "express";
import { error_handler_middleware } from './../../middlewares/error_handler_middleware.js';
const auth_controller = Router()



auth_controller.post( "/signup"  , error_handler_middleware(auth_services.sign_up_service  ))
auth_controller.post( "/login"  , error_handler_middleware(auth_services.login_service  ))
auth_controller.get( "/verify/:data"  , error_handler_middleware(auth_services.verify_email_service  ))
auth_controller.post( "/reToken"  , error_handler_middleware(auth_services.refresh_token_service  ))

auth_controller.post("/gmail-signup" , error_handler_middleware(auth_services.sign_up_gmail_service) ) // under test front
auth_controller.post("/gmail-login" , error_handler_middleware(auth_services.sign_in_gmail_service) ) // under test front

auth_controller.patch("/forget_pass" , error_handler_middleware(auth_services.forget_password_service) )
auth_controller.put("/reset_pass" , error_handler_middleware(auth_services.reset_password_service) )

auth_controller.post("/logout" , error_handler_middleware(auth_services.logout_service) )
auth_controller.post("/delete_acc" , error_handler_middleware(auth_services.delete_account_service) )
















export default auth_controller