
import { DataTypes, Sequelize } from 'sequelize';
import { SequelizeConfig } from './../connection.js';
import { ROLE } from '../../constants/constants.js';
import { hashSync } from 'bcrypt';
import { encryption } from '../../utils/encryption.utils.js';
// import sequelize from 'sqlite::memory:';


 const User_model = SequelizeConfig.define("tbl_User" , { 
    FirstName : { 
        type : DataTypes.STRING ,
        allowNull : false ,
        validate :{ notEmpty : true ,
            len : [ 2,10  ]
         }
     } ,

    LastName : {        
        type : DataTypes.STRING ,
        allowNull : false ,
        validate :{ 
            notEmpty : true ,
            len : [ 2,10  ]
         } } ,

    UserName : { 
        type : DataTypes.VIRTUAL ,
        get(){
            const first_name = this.getDataValue("FirstName") 
            const last_name = this.getDataValue("LastName")
            return ( `${first_name} ${ last_name} ` ) 
        }
     } ,
    Email :{
        type : DataTypes.STRING ,
        allowNull : false ,
        unique : "idx_email_unique",
        validate :{ 
            isEmail : true ,
            notEmpty : false
        }
    } ,

        OTP :{
        type : DataTypes.STRING ,
        defaultValue : null ,
        unique : "idx_OTP_unique",
    } ,

    Password : {
        type : DataTypes.STRING ,
        allowNull : false ,
        set(value){
            this.setDataValue( "Password"  , hashSync(value , +process.env.HASH_PASS_SALT )  )
        }
    } ,

    Phone : {
        type : DataTypes.STRING,
        allowNull : false ,
       async set ( phone ) {
            const dfs =  this.setDataValue( "Phone" , await encryption(  {value : phone  , secret_key : process.env.PHONE_SECRET_KEY   }  ) )
            // console.log( "sdffffffffffffffffff" , dfs );
            
        } 
    },

    Role : {
        type : DataTypes.ENUM( Object.values(ROLE)) ,
        defaultValue : ROLE.USER ,
        allowNull :false ,


    } ,

     Age : { 
        type : DataTypes.INTEGER ,
        allowNull :true ,
        validate : {
            checkAge(value){ 
                if( value < 18 || value > 60 ) {
                    throw new Error( " the age must lass then 60 and more then 18" )
                }
             }
        }
     },

     Google_Id :{
        type : DataTypes.STRING ,
        allowNull : true, 
        defaultValue : null , 

     },

     isDeleted : { 
        type : DataTypes.BOOLEAN ,
        allowNull  :false ,
        defaultValue : false ,
        createdAt: DataTypes.NOW ,
      },

     isVerified: { 
        type : DataTypes.BOOLEAN ,
        allowNull  :false ,
        defaultValue : false ,
      }

  } ,
   { timestamps : true ,  freezeTableName : false , paranoid : true } )
   
//    AccountModel.hasOne(User_model , "fk_account_id")
//    User_model.belongsToMany(AccountModel , "fk_account_id")

 export default User_model

 

 
//  console.log( User_model === sequelize.models.User_model ); // 1


















////////////////////////////////////////////   ERD
/** Users
-----






Transactions
------------
id (PK)
from_account_id (FK -> Accounts)
to_account_id (FK -> Accounts)
amount
type (transfer, deposit, withdraw)
status (pending, success, failed)
timestamp




Sessions
--------
id (PK)
user_id (FK -> Users)
token
expires_at





blacklist_token
-------------------
id (PK)
user_id (FK -> Users)
otp
expires_at

*/



