import * as user_services from "./services/users_services.js"
import { Router } from "express";
import { error_handler_middleware } from './../../middlewares/error_handler_middleware.js';
const user_controller = Router()




user_controller.post( "/create_account"  , error_handler_middleware(user_services.createAccount_service  ))
user_controller.post( "/create_session"  , error_handler_middleware(user_services.createSession_service  ))

















export default user_controller