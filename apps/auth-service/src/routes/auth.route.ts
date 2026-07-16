import { Router } from "express"
import { forgetPassword, getLoggedInUser, refrehsToken, resetPassword, userLogin, userRegistration, verifyForgetPassword, verifyRegistrationOtp } from "../controllers/auth.controller"
import { authenticate } from "../../../../packages/auth-handler/auth.middleware"

const authRouter = Router()

// Initiates registration, saves to Redis, and sends the OTP email
authRouter.post("/user-registration", userRegistration)

// Validates the OTP, fetches from Redis, and creates the user in the Database
authRouter.post("/verify-registration", verifyRegistrationOtp)

// Login a user, create the access and refresh token, and fetch the user from the Database
authRouter.post("/login-user", userLogin)

// generate and send a refresh user token
authRouter.post("/refresh_token", refrehsToken)

// get the currently logged in user 
authRouter.get("/get_logged_in_user", authenticate, getLoggedInUser)

// User forgot password
authRouter.post("/forget-password", forgetPassword)

// Verify forgotten password with provided otp sent to email
authRouter.post("/verify-password-otp", verifyForgetPassword)

// reset Password to a new password
authRouter.post("/reset-password", resetPassword)

export default authRouter