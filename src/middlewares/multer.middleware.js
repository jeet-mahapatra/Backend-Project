import multer from "multer"


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,"./public/temp")
    },
    filename: function (req, file, cb) {

      cb(null, file.originalname) //you can also console log the file itself,, and also change the file.origianlname {this will store here for a tiny time and then it will upload at cloudianary}
    }
  })
  
  export const upload = multer({ 
    storage, // we are using es6 so insted of storage:storage we will use only storage
 })