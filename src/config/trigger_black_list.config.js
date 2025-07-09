import cron from "node-cron";
import { Op } from "sequelize";
import BlacklistToken_Model from "../DB/models/BlackList_token_model.js";

cron.schedule( '0 0 * * *' , async() => {
    try {

        const deleted  = await BlacklistToken_Model.destroy({

            where : {
                Expires_at : { [Op.lt] : new Date() , }
            }
        }) 

        if ( deleted > 0 ) {
            console.log(`🧹 Deleted ${deleted} expired black List.` );
            
        }
        
    } catch (error) {
        console.error( "failed to clean the session "  ,error.message  )
    }
}  )