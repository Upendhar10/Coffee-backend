import { Router } from "express";
import {registerUser, loginUser, logoutUser} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name:"avatar",  // Should be same as the mentioned in the UI
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);

router.route('/login').post(loginUser);

// private route
router.route('/logout').post( verifyJWT ,logoutUser);


export default router;