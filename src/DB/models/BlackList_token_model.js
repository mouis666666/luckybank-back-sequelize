import { DataTypes } from 'sequelize';
import { SequelizeConfig } from '../connection.js';
import User_model from './Users_model.js';

export const BlacklistToken_Model   = SequelizeConfig.define('tbl_blacklist_token', {
  TokenId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique : "idx_TokenId_unique" , 

  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
});

export default BlacklistToken_Model

// Set the association (1 user -> many blacklist tokens)
User_model.hasMany(BlacklistToken_Model, { foreignKey: 'fk_user_id' , onDelete: 'CASCADE ' , onUpdate: 'CASCADE '  });
BlacklistToken_Model.belongsTo(User_model, { foreignKey: 'fk_user_id' });

