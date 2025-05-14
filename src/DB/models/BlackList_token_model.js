import { DataTypes } from 'sequelize';
import { SequelizeConfig } from '../connection';
import User_model from './Users_model';

export const BlacklistToken_Model   = SequelizeConfig.define('tbl_blacklist_token', {
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: false,
});

export default BlacklistToken_Model

// Set the association (1 user -> many blacklist tokens)
User_model.hasMany(BlacklistToken_Model, { foreignKey: 'fk_user_id' , onDelete: 'CASCADE ' , onUpdate: 'CASCADE '  });
BlacklistToken_Model.belongsTo(User_model, { foreignKey: 'fk_user_id' });

