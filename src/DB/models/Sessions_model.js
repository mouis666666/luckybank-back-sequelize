
import { DataTypes } from 'sequelize';
import { SequelizeConfig } from '../connection.js';
import User_model from './Users_model.js';

const Session_Model = SequelizeConfig.define('tbl_Session', {

  Token: {
    type: DataTypes.STRING,
    allowNull: false,
   //  unique: true,
  },
  Expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true, // createdAt and updatedAt
  freezeTableName :false
});


User_model.hasMany(Session_Model, { foreignKey: 'fk_user_id' , onDelete: 'CASCADE ' , onUpdate: 'CASCADE ' /* mean when delete or updata make the seam in the tbl_user */ });
Session_Model.belongsTo(User_model, { foreignKey: 'fk_user_id' });



export default Session_Model;


/**  
 * The **purpose of the `Sessions` table** is to **manage and track user authentication sessions** securely in your application. Here's what it does and **why it's important**:

---

### 🔐 **Primary Purpose of the `Sessions` Table**

1. **Track active logins**:

   * When a user logs in, a session is created with a unique `token` (like a JWT or session ID).
   * This lets the system know who is currently logged in and from where (optionally with IP/device).

2. **Implement session expiration**:

   * The `expires_at` field helps control **how long a user stays logged in**.
   * It adds a layer of security by auto-logging out inactive users.

3. **Secure multiple device logins**:

   * If a user logs in from multiple devices, each device has a separate session.
   * You can later provide a “log out from all devices” feature.

4. **Enforce revocation and logout**:

   * You can explicitly **delete** a session when a user logs out or invalidate it if you detect suspicious activity.

5. **Audit and trace**:

   * Admins can view login activity, including session creation and expiration.
   * Useful for auditing and **detecting unusual login patterns** (security).

---

### ✅ Example Use Case

* A user logs in from Chrome on their laptop → a session is created with a token that expires in 1 day.
* Later, the same user logs in from their phone → another session is created.
* If they logout on the laptop, that specific session is deleted.
* If an admin finds the phone login suspicious, they can delete just that session.

---

In short:

> 🔑 **`Sessions` = Controlled access + Traceability + Security for every user login.**

Would you like help implementing a secure session handling flow with Sequelize or tokens?

*/