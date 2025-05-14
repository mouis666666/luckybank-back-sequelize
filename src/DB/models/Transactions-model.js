import { DataTypes } from 'sequelize';
import { SequelizeConfig } from '../connection.js';
import Account_model from './Accounts_model.js'; // adjust path as needed
import { status_transaction, type_transaction } from '../../constants/constants.js';
import User_model from './Users_model.js';

export const Transactions_Model = SequelizeConfig.define('tbl_transactions', {
   
    from_account_id : {
      type : DataTypes.STRING ,
      allowNull : false ,
      references: {
        model: User_model,
        key: 'id',
      },
    } , 

   to_account_id: {
      type : DataTypes.STRING ,
      allowNull : false ,
      references: {
        model: User_model,
        key: 'id',
      },
    } , 

  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  type: {
    type: DataTypes.ENUM(Object.values(type_transaction)),
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM(Object.values(status_transaction)),
    allowNull: false,
    defaultValue: status_transaction.PENDING,
  },

}, {
  timestamps: false,
});


// Association: from_account_id
Account_model.hasMany(Transactions_Model, {
    foreignKey: 'fk_user_id',
    // as: 'SentTransactions',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  
  Transactions_Model.belongsTo(Account_model, {
    foreignKey: 'fk_user_id',
    // as: 'FromAccount',
  });
  
  // Association: to_account_id
  Account_model.hasMany(Transactions_Model, {
    foreignKey: 'fk_user_id',
    // as: 'ReceivedTransactions',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  
  Transactions_Model.belongsTo(Account_model, {
    foreignKey: 'fk_user_id',
    // as: 'ToAccount',\ // this is the alice
  });
  

  export default Transactions_Model