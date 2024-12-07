const jwt = require('jsonwebtoken');

module.exports = (req, res, next) =>{
    try{
const token = req.headers.authorization.split(" ")[1];
console.log(token); 
const verify = jwt.verify(token,'your-secret-key');
console.log(verify);
   next();

    }catch(error)
    {
        return res.status(401).json({
            msg: 'invalid token'
        })
    }
}