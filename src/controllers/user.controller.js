import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import fileUploadOnCloudinary from "../utils/cloudinary.js"
import ApiResponse from "../utils/apiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    // 1. Get the User Details from the Client
    const {fullName, email, username} = req.body;

    // 2. Validate the User Details
    // Condition : fullName === "" || email === "" || username
    if(
        [fullName, email, username].some((field) => field.trim() === "")
    ){
        throw new ApiError(400, 'All fields are required!');
    }
    // Condition : email format validation
    if(!email.includes('@')){
        throw new ApiError(400, "Invalid Email address!");
    }

    // 3. Check if user alreaady exists - (email, username, phone number)
    const existedUser = await User.findOne({
        $or : [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,'User with these credentials already existed!');
    }
    
    // 4. Check for images in user Details - avatar, coverImage
    const avatarLocalFilePath = req.files?.avatar[0]?.path;
    const coverImageLocalFilePath = req.files?.coverImage[0]?.path;

    if(avatarLocalFilePath){
        throw new ApiError(400, "avatar file is required!");
    }

    // 5. If Available, Upload image to the Cloudinary and obtain a URL
    const avatar = await fileUploadOnCloudinary(avatarLocalFilePath);
    const coverImage = await fileUploadOnCloudinary(coverImageLocalFilePath);

    // 6. Verify whether Images are uploaded to Cloudinary via Multer.
    if(!avatar){
        throw new ApiError(400, "avatar file is required!");
    }

    // 7. Create User Object in the Database using the data provided by the user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username : username.toLowercase()
    })

    // 8. Remove password & refresh-token field from response.
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"   // Ignore these two fields while creating a user in DB
    )

    // 9. Check for User Creation in the Database, if created, send 'Sucessful' or send 'Error'
    if(!createdUser){
        throw new ApiError(501, "Something went wrong while registering the User");
    }

    return res.status(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User Registered Sucessfully!"
        )
    )
})

export default registerUser;

/*
    # How to register a user ?
    1. Get the User Details from the Client
    2. Validate the User Details
    3. Check if alreaady exist - (email, username, phone number)
    4. Check for images in user Deatils - avatar, coverImage
    5. If Available, Upload image to the Cloudinary and obtain a URL
    6. Verify whether Images are uploaded to Cloudinary via Multer.
    7. Create User Object in the Database using the data provided by the user
    8. Remove password & refresh-token field from response.
    9. Check for user Creation in the Database, if created, send 'Sucessful' or send 'Error'
*/ 