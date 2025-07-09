import Account_Model from "../../../DB/models/Accounts_model.js";
import Session_Model from "../../../DB/models/Sessions_model.js";
import User_model from "../../../DB/models/Users_model.js";








export const log_all_service = async (req, res) => {//👽
  try {

    const { Email } = req.body;

    // find the email
    const user =  await User_model.findOne({ where :  { Email : Email  } })
        if (user == null) {
      return res.status(409).json({ message: "this email is not exist" });
    }

    // fine the session
    const finDevice = await Session_Model.findAll({
      where: {
        fk_user_id: user.id 
      },
    });
    
    // case 1
    if (finDevice.length == 0   ) {
      return res.status(409).json({ message: "there is something went wrong please try again later" });
    }

      return res.status(201).json({ message: " log is success"  , devices : finDevice });
  } catch (error) {
    console.log("error in logout =============> ", error);
    return res.status(500).json({ message: "internal server error " });
  }
};


export const createAccount_service = async (req, res) => {
    const { User_id, Balance, Currency } = req.body;
  
    // if (!User_id || !Balance || !Currency) {
    //   return res.status(400).json({ message: 'user_id, balance, and currency are required' });
    // }
  
    try {
      const user = await User_model.findByPk(User_id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const account = await Account_Model.create({
        User_id,
        fk_user_id:User_id , 
        Balance,
        Currency,
        IsActive: true,
      });
  
      return res.status(201).json({ message: 'Account created', account });
    } catch (error) {
      console.error('Create Account Error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };






export const createSession_service = async (req ,res) => {
    const { User_id , Token } = req.body;
  
    if (!User_id) return res.status(400).json({ message: 'user_id is required' });
  
    try {
      // Check if user exists
      const user = await User_model.findByPk(User_id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
    //   const token = uuidv4();
    //   const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
  
      const session = await Session_Model.create({
        fk_user_id : User_id ,
        Token,
        // expires_at,
      });
  
      return res.status(201).json({ message: 'Session created', session });
    } catch (error) {
      console.error('Create Session Error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };










