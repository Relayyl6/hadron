import { Router } from "express"
import { userRegistration, verifyRegistrationOtp } from "../controllers/auth.controller"

const authRouter = Router()

// Initiates registration, saves to Redis, and sends the OTP email
authRouter.post("/user-registration", userRegistration)

// Validates the OTP, fetches from Redis, and creates the user in the Database
authRouter.post("/verify-registration", verifyRegistrationOtp)

export default authRouter