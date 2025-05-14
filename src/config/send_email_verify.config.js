import nodemailer from "nodemailer"
import EventEmitter from "events"

export const send_email_service = async( to , subject , html , attachments  )  => {

try {
    
    
    const transporter = nodemailer.createTransport({
        host : "smtp.gmail.com",
        port : 465 ,
        secure: true, // true for 465, false for other ports
        auth: {
           user: process.env.EMAIL_NAME_VERIFY,
           pass: process.env.EMAIL_PASS_VERIFY,
         },
         tls:{
            rejectUnauthorized:false
        },
        // connectionTimeout :  5 * 60 * 1000, 

    })


    const info = await transporter.sendMail({
    from: `NO_REPLY FROM ${process.env.EMAIL_NAME_VERIFY}` ,
    to ,
    // cc: "Lucky_bank@outlook.com" ,
    subject,
    html,
    // attachments,

    })

    return info


} catch (error) {

    console.log( "error from send email nodemailer -==========>"    ,  error );
    return error
}



}



export const send_Email_event = new EventEmitter();
send_Email_event.on(  "Send_Email" , ( ...args ) =>{

    // console.log( args);
    
    const  { to , subject , attachments  , html } = args[0]
    send_email_service({
        to ,
        subject , 
        html ,
        // attachments 
    })

}  )