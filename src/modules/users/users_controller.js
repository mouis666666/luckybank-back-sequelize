import * as user_services from "./services/users_services.js"
import { Router } from "express";
import { error_handler_middleware } from './../../middlewares/error_handler_middleware.js';
import { authentication_middleware } from "../../middlewares/authentication_middleware.js";
const user_controller = Router()


user_controller.use( authentication_middleware()  )

user_controller.post("/logAll" , error_handler_middleware(user_services.log_all_service) ) 
user_controller.post( "/create_account"  , error_handler_middleware(user_services.createAccount_service  ))
user_controller.post( "/create_session"  , error_handler_middleware(user_services.createSession_service  ))



  /** //////////////////////////////////// 🌐  Main APIs
 🔑 Auth Done ( ✔✔ )






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














export default user_controller