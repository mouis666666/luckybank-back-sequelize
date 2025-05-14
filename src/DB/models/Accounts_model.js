import  DataTypes  from "sequelize/lib/sequelize";
import { SequelizeConfig } from "../connection.js";
import User_model from "./Users_model.js";

const Account_Model = SequelizeConfig.define( "tbl_Account", {


  Balance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },

  Currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EGP',
  },

  IsActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
}, {
  timestamps : true ,
  freezeTableName : false 
} )


User_model.hasMany(Account_Model, { foreignKey: 'fk_user_id'  , onDelete: 'CASCADE ' , onUpdate: 'CASCADE ' });
Account_Model.belongsTo(User_model, { foreignKey: 'fk_user_id' });

export default Account_Model

/**
Accounts
--------
id (PK)
user_id (FK -> Users)
balance
currency
is_active
created_at*/