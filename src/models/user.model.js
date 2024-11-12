import mongoose , {Schema}  from "mongoose"
import jwt from "jsonwebtoken" 
import bcrypt from "bcrypt" 

const userSchema = new Schema(
    {

    userName:{
        type: String,
        required:true,
        unique: true,
        lowercase:true,
        trim:true,
        index: true //optimize the searching
    },
    email:{
        type: String,
        required:true,
        unique: true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type: String,
        required:true,
        trim:true,
        index: true
    },
    avatar:{
        type:String, //cloudinary url
        require:true
    },
    converImage:{
        type:String, //cloudinary url
    },
    watchHistory:[
        {
        type:Schema.Types.ObjectId,
        ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true, "Password is required"]
    },
    refressToken:{
        type: String
    }   

   },{timestamps:true }
)

userSchema.pre("save", async function(next) {
    if(this.isModified("password")){  ///here we use normal function not arrow function just beacase arrow function did not support this keyword
        this.password = await bcrypt.hash(this.password, 10)
        next()
    } 
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}


userSchema.methods.generateAcessToken = function(){
     return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName:this.userName,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
     )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
     )
}

export const User = mongoose.model("User", userSchema)