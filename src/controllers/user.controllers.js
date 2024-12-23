import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAcessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAcessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
       await user.save({ validateBeforeSave: false })

       return {accessToken , refreshToken}
        
    } catch (error) {
        throw new ApiError(500,"Something Went Wrong while generating access and refresh token")
    }
}



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
    // console.log(req.files); // for checking purpose only

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

const loginUser = asyncHandler(async(req,res)=>{
    // req.body -> data
    // username or email
    // find the user 
    // password check
    // access and refresh token 
    // send cookie

    const {email , username , password} = req.body
    if(!(email || username)){
        throw new ApiError(400, "Username or email required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if (!user){
        throw new ApiError(404 ,"User does not Exist")
    }

     const isPasswordValid = await user.isPasswordCorrect(password)

     if (!isPasswordValid){
        throw new ApiError(401 ,"Password does not Match")
    }

    const {accessToken,refreshToken} = await generateAcessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken ,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser , accessToken , refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new : true
        }
     )

     const options ={
        httpOnly: true,
        secure: true
     }

     return res
     .status(200)
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken",options)
     .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError (401, "Unauthorized request")
    }

   try {
    const decodedToken =  jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
 
    const user = await User.findById(decodedToken?._id)
 
    if(!user){
     throw new ApiError (401, "Invalid Refresh Token")
     }
 
     if (incomingRefreshToken !== user?.refreshToken){
     throw new ApiError (401, "Refresh Token is expired or used")
     }
 
     const {accessToken , newRefreshToken} = await generateAcessAndRefreshToken(user._id)
     
     const options={
         httpOnly:true,
         secure:true
     }
 
     return res
     .status(200)
     .cookie("accessToken", accessToken , options)
     .cookie("refreshToken", newRefreshToken , options)
     .json(
         new ApiResponse(
             200,
             {accessToken , refreshToken: newRefreshToken},
             "Access token refreshed"
         )
     )          
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token")
   }
})


const changecurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)

   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
    throw new ApiError(400, "Incorrect Old Password")
   }

   user.password = newPassword

   await user.save({validateBeforeSave : false})

   return res
   .status(200)
   .json(new ApiResponse(200, {} , "Password changed Successfully"))

})


const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200, req.user,"Current User Fetched Successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName , email  } = req.body
    if (!fullName || !email){
        throw new ApiError(400, "All fields Required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName: fullName ,
                email:email // also you can write only one "email" insted of "email: email" ===> es6 syntax
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user , "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, 'avatar file is missing')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }

   const user = await User.findByIdAndUpdate(req.user?._id,
   {
    $set:{
        avatar : avatar.url
    }
   },
   {
    new :true
   }
   ).select("-password")

   return res
   .status(200)
   .json(
        new ApiResponse(200 , user , "Avatar updated successfully")
   )
})

const updateCoverImage = asyncHandler(async(req,res)=>{
    coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "cover Image not uploded")
    }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
    throw new ApiError(400, "cover image not uploaded")
   }

   const user =  await User.findByIdAndUpdate(req.user?._id,
        {
            $set :{
                coverImageLocalPath : coverImage.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
    new ApiResponse (200, user , "CoverImage Uploaded Successfully")
)

})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changecurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage
}