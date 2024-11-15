import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler (async (req,res) =>{
    // get userName , email , full name etc from frontend
    // validation - not empty
    // check if user already exsits: userName and email
    // check for images , check for avatar
    // upload them in cloudinary ,avatar
    // create user object - create entry in db {stores data in database}
    // remove password and refresh token field from response
    // check for user creation 
    // return res


    const {userName, email, fullName, password}=req.body
    // console.log("email: ", email);


    // if (userName===""){
    //     throw new ApiError(400, "fullName is required") 
    // } ////////////////////// you can do this multiple time insted of next checking

    if (
        [userName , email , fullName , password].some((field)=>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const exsistedUser = await User.findOne({
        $or: [{ userName },{ email }] // Multiple checking
    })

    if (exsistedUser) {
        throw new ApiError(409 , "User with email or userName already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log(req.files); // for checking purpose only

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }



    if (!avatarLocalPath) {
        throw new ApiError(404, "Avatar file is required")
    }
   

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log("avatar is uploaded" , avatar); 

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    

    if (!avatar) {
        throw new ApiError(404,"Avatar is not uploaded")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
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