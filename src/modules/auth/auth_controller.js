import * as auth_services from "./services/auth_services.js"
import { Router } from "express";
import { error_handler_middleware } from './../../middlewares/error_handler_middleware.js';
const auth_controller = Router()



auth_controller.post( "/signup"  , error_handler_middleware(auth_services.sign_up_service  ))
auth_controller.post( "/login"  , error_handler_middleware(auth_services.login_service  ))


















export default auth_controller