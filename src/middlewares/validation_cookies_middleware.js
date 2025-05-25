
import express from 'express'

const app = express()

export async function validateCookies (req, res, next) {
  await cookieValidator(req.cookies)

  // error handle
  app.use((err, req, res, next) => {
  res.status(400).send(err.message)
})



  next()
}


/**
 * 
 * 🍪 What Are Cookies?
   Cookies are small pieces of data stored on the client-side (browser) and sent to the server with each HTTP request. They are primarily used for:

   Session management (authentication)

   User preferences (theme, language)

   Tracking (analytics, behavior)

   They are key/value pairs sent via the Set-Cookie and Cookie HTTP headers.
 * 
 * | Attribute    | Description                                            |
| ------------ | ------------------------------------------------------ |
| `Name=Value` | The actual data                                        |
| `Path`       | Limits the path where the cookie is sent               |
| `Domain`     | Limits the domain                                      |
| `Max-Age`    | Time in seconds before cookie expires                  |
| `Expires`    | Expiry date in UTC string (alternative to Max-Age)     |
| `HttpOnly`   | Cannot be accessed via JavaScript (secure against XSS) |
| `Secure`     | Sent only over HTTPS                                   |
| `SameSite`   | Controls cross-site sending (`Strict`, `Lax`, `None`)  |

 * 
 * 
 * 
 * 
 * 
 * //read the cookies 
 *  const token = req.cookies.token;
 * 
 * 
 * 
 * 
 * 
 * 
 * ==========> best practice
 * | Concern  | Recommendation                               |
| -------- | -------------------------------------------- |
| XSS      | Use `HttpOnly` to prevent JS access          |
| CSRF     | Use `SameSite=Strict` or CSRF tokens         |
| Security | Use `Secure` in production (HTTPS only)      |
| Storage  | Don't store sensitive info (e.g., passwords) |

 * 






   // 🌐 Frontend use (React)
To include cookies in requests from React (e.g., Axios):

js
Copy
Edit
axios.post("/api/login", credentials, {
  withCredentials: true, // required to send cookies
});
Also, on the server:

js
Copy
Edit
app.use(cors({
  origin: "http://localhost:3000", // React frontend origin
  credentials: true,
}));








*/

