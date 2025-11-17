import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        // 1. Obtain the access token
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', "");
    
        if(!token){
            throw new ApiError(401, "Unauthorized request!");
        }
    
        // 2. JWT needs ACCESS_TOKEN_SECRET to verify the access token.
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        // 3. fetch the user from the DB using this accessToken
        
        const loggedUser = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!loggedUser){
            throw new ApiError(401, "Invalid Access Token");
        }
    
        // 3. Since now we know that logged User exits, so create a new field to the req object
        req.user = loggedUser;
    
        // 4. pass the control to next 
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "invalid Access Token");
    }
})

export default verifyJWT;

/*
    Auth Middleware :

    - Checks whether a user exists/ loggedIn or Not.
    - This middleware verifies availabilaity of AccessToken generated using JWT.
    - If there exits a AccessToken, it removes the token and clears the cookies
    - As a result, user will be logged out.

    - In most of the production-ready codes, un-used parameter are replace with underscore(_)
    - Eg: In our code, res is un-used parameter, so it is replaced with _

    1. Obtain the Access token. But How? 
        - Two ways to obtain this token
        1. req object has the access to the cookies set during the login, using these cookies we can obtain the Access token.
        2. In case of Mobile devices, instead of cookies, we an obtain the token via custom headers send by the user. (Authorization : Bearer <access token>)

    2. Verify the Obtained access token with JWT by providing accessTokenSecret
    3. Using the access token, fetch the user details from the DB
    4. Update the req object by addind the reference of the obtained user from DB
    5. Pass the control to next() for further execution.
*/ 