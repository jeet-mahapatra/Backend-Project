import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler (async (req,res) =>{
    // get username , email , full name etc from frontend
    // validation - not empty
    // check if user already exsits: username and email
    // check for images , check for avatar
    // upload them in cloudinary ,avatar
    // create user object - create entry in db {stores data in database}
    // remove password and refresh token field from response
    // check for user creation 
    // return res


    const {username, email, fullname, password}=req.body
    console.log("email: ", email);
    // if (username===""){
    //     throw new ApiError(400, "fullname is required") 
    // } ////////////////////// you can do thsi multiple time

    if (
        [username , email , fullname , password].some((field)=>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const exsistedUser = User.findOne({
        $or: [{ username },{ email }] // Multiple checking
    })

    if (exsistedUser) {
        throw new ApiError(409 , "User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(404, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(localfilePath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(404,"Avatar is not uploaded")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Succesfully")
    )

})


export {registerUser}