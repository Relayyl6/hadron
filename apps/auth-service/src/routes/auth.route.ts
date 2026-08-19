import { Router } from "express"
import { forgetPassword, getLoggedInUser, refrehsToken, resetPassword, userLogin, userRegistration, verifyForgetPassword, verifyRegistrationOtp } from "../controllers/auth.controller"
import { authenticate } from "../../../../packages/auth-handler/auth.middleware"

const authRouter = Router()

// Initiates registration, saves to Redis, and sends the OTP email
authRouter.post(
  "/user-registration", 
  /* 
    #swagger.tags = ['Auth']
    #swagger.description = 'Initiates user registration and sends an OTP.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Payload for registering a new user',
      required: true,
      schema: { $ref: '#/definitions/CustomerRegistrationPayload' }
    }
  */
  userRegistration
)

// Validates the OTP, fetches from Redis, and creates the user in the Database
authRouter.post(
  "/verify-registration", 
  /* 
    #swagger.tags = ['Auth']
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/VerifyOtpPayload' }
    }
  */
  verifyRegistrationOtp
)

// Login a user, create the access and refresh token, and fetch the user from the Database
authRouter.post(
  "/login-user", 
  /* 
    #swagger.tags = ['Auth']
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/LoginPayload' }
    }
  */
  userLogin
)

// generate and send a refresh user token
authRouter.post(
  "/refresh_token", 
  /* #swagger.tags = ['Auth'] */
  refrehsToken
)

// get the currently logged in user 
authRouter.get(
  "/get_logged_in_user", 
  authenticate, 
  /* #swagger.tags = ['Auth'] */
  getLoggedInUser
)

// User forgot password
authRouter.post(
  "/forget-password", 
  /* #swagger.tags = ['Auth'] */
  forgetPassword
)

// Verify forgotten password with provided otp sent to email
authRouter.post(
  "/verify-password-otp", 
  /* #swagger.tags = ['Auth'] */
  verifyForgetPassword
)

// reset Password to a new password
authRouter.post(
  "/reset-password", 
  /* #swagger.tags = ['Auth'] */
  resetPassword
)

export default authRouter