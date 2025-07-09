import cron from "node-cron";
import Session_Model from "../DB/models/Sessions_model.js";
import { Op } from "sequelize";

cron.schedule( '*/10 * * * *' , async() => {
    try {

        const deleted  = await Session_Model.destroy({

            where : {
                Expires_at : { [Op.lt] : new Date() , }
            }
        }) 

        if ( deleted > 0 ) {
            console.log(`🧹 Deleted ${deleted} expired sessions.` );
            
        }
        
    } catch (error) {
        console.error( "failed to clean the session "  ,error.message  )
    }
}  )