import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import fileUploadOnCloudinary from "../utils/cloudinary.js"
import ApiResponse from "../utils/apiResponse.js";

async function generateAccessAndRefreshTokens(userId){
    try {
        // Obtain user-details from Db
        const user = User.findById(userId);
        // generate access token
        const accessToken = user.generateAccessToken();
        // generate refresh token
        const refreshToken = user.generateRefreshToken();

        // Update and save refreshToken in the Db
        user.refreshToken = refreshToken;
        // save the refreshtoken without any need of user validation
        await user.save({validateBeforeSave : false});

        return {
            accessToken,
            refreshToken
        }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Tokens");
    }
}

// Register User
const registerUser = asyncHandler( async (req, res) => {
    // 1. Get the User Details from the Client
    const {fullName, email, username, password} = req.body;

    // 2. Validate the User Details
    // Condition : fullName === "" || email === "" || username
    if(
        [fullName, email, username, password].some((field) => field.trim() === "")
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
    let coverImageLocalFilePath;

    if(
        req.files 
        && Array.isArray(req.files.coverImage) 
        && req.files.coverImage.length > 0
    ){
        coverImageLocalFilePath = req.files.coverImage[0].path;
    }

    if(!avatarLocalFilePath){
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
        username : username.toLowerCase()
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

// Login User
const loginUser = asyncHandler( async (req, res) => {

    // 1. Get the User Input from req.body
    const {email, username, password} = req.body;

    // 2. Validate the User Input for Empty values;
    // If both username and email are required then => (!username && !email);
    if(!(username || email)){
        throw new ApiError(400, 'username or email is required!');
    }

    if(!password){
        throw new ApiError(400,"password required!");
    }

    // 3. Check if the User exits or not in the Db
    const requiredUser = await User.findOne({
        $or : [{username},{email}]
    })

    if(!requiredUser){
        throw new ApiError(400, 'NO USER FOUND!');
    }

    // 4. Validate User using password comparison
    const isPasswordValid = await requiredUser.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials!");
    }

    // 5. Generate Access-token and Refresh Token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(registerUser._id);

    // Update the requiredUser (or) fetch the requiredUser from the Db
    const loggedInUser = await User.findById(requiredUser._id).select('-password -refreshToken');

    // 6. Send Cookies 
    // By default, Cookies can be modified via frontend, so we need to restrict this behaviour, 
    // To restrict this behaviour, we set Options for Cookies.
    const Options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie('accessToken', accessToken, Options)
    .cookie('refreshToken', refreshToken, Options)
    .json(
        new ApiResponse(200, {
            user : loggedInUser,
            accessToken,
            refreshToken
        },
        "User logged In Sucessfully!")
    )
})

// Logout User
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const Options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie('accessToken', Options)
    .clearCookie('refreshToken', Options)
    .json(
        new ApiResponse(200),{},"User logged out Sucessfully!"
    )

})

export {
    registerUser,
    loginUser,
    logoutUser
};

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

/*
    # How to Login a user ?
    1. Get the User Details such as username or email and password from req.body
    2. Validate the User Input for empty fields
    3. Check if the User exits or not in the Db
        - If not, route to register page.
    4. If exits, Validate User using password comparison
    5. If matched, generate acces-token and refresh-token
          - If not, Show Error message to the user.
    6. send Cookies
*/ 

/*
    # How to Logout a user ?
    1. Clear the cookies
    2. Remove Access token.
    3. Update Refresh token to 'undefined' 


*/ 