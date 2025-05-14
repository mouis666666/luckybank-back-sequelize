import { Sequelize } from "sequelize";


export const SequelizeConfig = new Sequelize( "lucky_bank" , "root" , "" , { 
    host : "localhost" ,
    dialect: "mysql" ,
    logging : (msg) => {  console.log( " data query is =======> " , msg );
    }
 })


 export const database_connection = async (  ) =>{ 
    try {
        await SequelizeConfig.sync( { alter : true  , force :false }  )
        console.log(  "connection is success"  );
    } catch (error) {
        console.log(  "connection is failed"  , error  );
    }
  } 


  /**
   * Absolutely! Let’s walk through the **full cycle (flow)** of how the system works based on your ERD (Entity Relationship Diagram) for your **secure banking app**:

---

### 🔐 **1. User Registration & Authentication**

* **Users table**

  * A new user signs up or logs in (via email/password or Google).
  * Upon registration, a new record is created in the `Users` table.
  * `google_id` is filled only if they use Google login.
  * `role` determines access level (admin or regular user).

* **Sessions table**

  * When a user logs in successfully, a new token (usually JWT or session ID) is generated and stored with an `expires_at` time.
  * This session is validated for each request to verify that the user is authenticated.

* **blacklist\_token table**

  * When a user logs out or forgets their password, their token or OTP is added here to **invalidate** it (especially for JWT).
  * During login, tokens are checked against this table to prevent reuse of old/insecure tokens.

---

### 💰 **2. Account Management & Transactions**

Although the `Accounts` table isn’t in your message, it's implied in the `Transactions` table.

Let’s assume:

**Accounts**

```sql
id (PK)
user_id (FK → Users)
balance
currency
is_active
created_at
```

* Each user has at least one **account**.
* When they perform a **deposit, withdrawal, or transfer**, a record is created in the `Transactions` table:

  * `from_account_id`: The sender’s account (nullable for deposits).
  * `to_account_id`: The receiver’s account (nullable for withdrawals).
  * `type`: Type of transaction.
  * `status`: Pending, success, or failed.
  * `timestamp`: When it occurred.

---

### 🔁 **3. Transaction Lifecycle (Example)**

**Transfer Money**

1. User is authenticated via `Sessions`.
2. Request is validated (user has access to `from_account_id`).
3. System checks balance.
4. If sufficient:

   * Deduct amount from `from_account_id`.
   * Add to `to_account_id`.
   * Insert new `Transactions` record with status `success`.
5. If failure (e.g., insufficient funds or internal error):

   * Insert transaction with status `failed`.

**All of this is usually wrapped in a DB transaction** to ensure atomicity.

---

### 🔄 **4. Password Reset Flow**

1. User requests to reset password.
2. System generates a **one-time OTP** and stores it in `blacklist_token` with expiration.
3. User uses the OTP to submit a new password.
4. System verifies the OTP, updates password, and deletes the OTP entry.

---

### ✅ **Security Roles (Admin/User)**

* Admins can:

  * View all users, transactions, and accounts.
  * Freeze/unfreeze accounts.
  * Audit sessions and tokens.

* Users can:

  * Access only their own sessions, accounts, and transactions.

---

### 🧠 Summary of Flow

1. User signs up → `Users`
2. Logs in → `Sessions`
3. Performs transaction → `Transactions`
4. Logs out → token added to `blacklist_token`
5. Resets password → OTP added to `blacklist_token`, used once, then deleted.

---

Let me know if you want a **visual diagram** or a **sequence flow chart** for this cycle!

  */