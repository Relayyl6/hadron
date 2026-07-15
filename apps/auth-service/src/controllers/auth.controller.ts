import { Request, Response, NextFunction } from "express"
import { checkOtpRestrictions, initiatePasswordReset, markSessionAsVerified, sendOtp, trackOtpRequests, validateRegistrationData, verifyForgetPasswordOtp } from "../utils/auth.helper";
import {prisma} from "../../../../packages/lib/prisma";
import { AuthError, JsonWebTokenError, ValidationError } from "../../../../packages/error-handler";
import bcrypt from "bcryptjs";
import redis from '../../../../packages/lib/redis';
import { AccountPayload, SellerProfilePayload, CustomerProfilePayload, RegistrationPayload } from "../../types/types";
import { generateAndSetTokens } from "../utils/token.helper";
import jwt from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";

//register a new user
export const userRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = validateRegistrationData(req.body as RegistrationPayload);

        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown_ip';
        const ipAddress = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0].trim();

        const existingUser = await prisma.users.findUnique({ 
            where: { email: validatedData?.account.email } 
        });

        if (existingUser) {
            throw new ValidationError("A user with this email already exists.");
        }

        await checkOtpRestrictions(validatedData?.account.email as string, ipAddress)

        await trackOtpRequests(validatedData?.account.email as string)

        await sendOtp(
            validatedData?.account.name as string,
            validatedData?.account.email as string,
            ipAddress,
            "user-activation-mail"
        )

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validatedData?.account.password as string, salt);
        
        // Update the account object with the newly hashed password
        const pendingUserData = {
            ...validatedData,
            account: {
                ...validatedData?.account,
                password: hashedPassword
            }
        };

        await redis.set(
            `pending_user:${validatedData?.account.email}`, 
            JSON.stringify(pendingUserData), 
            "EX", 
            600 
        );

        // 5. Send Success Response
        res.status(200).json({
            success: true,
            message: "OTP sent to email. Please verify your account to complete registration."
        });
    } catch (error) {
        return next(error)
    }
}

export const verifyRegistrationOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            throw new ValidationError("Email and OTP are required.");
        }

        // 1. Verify the OTP is correct
        const storedOtp = await redis.get(`otp:${email}`);
        if (!storedOtp) {
            throw new ValidationError("OTP expired or never requested.");
        }

        const failedAttemptKey = `otp_attempts:${email}`;
        const failedAttempts = parseInt(( await redis.get(failedAttemptKey)) || "0");

        if (storedOtp !== otp.toString()) {
            if (failedAttempts >= 3) {
                await redis.set(`otp_lock:${email}`, "locked", "EX", 1800) // locked for 30 minutes
                await redis.del(`otp:${email}`, failedAttemptKey)
                throw new ValidationError("Too many failed attempts. Your account is locked for 30 mins.");
            }
            await redis.set(failedAttemptKey, failedAttempts + 1, "EX", 300)
            throw new ValidationError(`Invalid OTP code. ${3 - failedAttempts} attempts remaining`);
        }

        await markSessionAsVerified(email);

        // 2. Fetch the pending user payload from Redis
        const pendingUserString = await redis.get(`pending_user:${email}`);
        if (!pendingUserString) {
            throw new ValidationError("Registration session expired. Please register again.");
        }

        // Re-hydrate the type that was lost crossing the Redis boundary.
        // This matches the shape returned by validateRegistrationData, not RegistrationPayload.
        const pendingData = JSON.parse(pendingUserString) as
            | { role: "SELLER"; account: AccountPayload & { role: "SELLER" }; sellerProfile: SellerProfilePayload }
            | { role: "CUSTOMER"; account: AccountPayload & { role: "CUSTOMER" }; customerProfile: CustomerProfilePayload };

        let newUser;

        // 3. FINALLY: Write to the Database
        if (pendingData.role === "SELLER") {
            const { account, sellerProfile } = pendingData;

            newUser = await prisma.users.create({
                data: {
                    ...account,
                    role: "SELLER",
                    sellerProfile: {
                        create: sellerProfile,
                    },
                },
                select: { id: true, name: true, email: true, role: true, sellerProfile: true },
            });
        } else {
            const { account, customerProfile } = pendingData;

            newUser = await prisma.users.create({
                data: {
                    ...account,
                    role: "CUSTOMER",
                    customerProfile: {
                        create: customerProfile,
                    },
                },
                select: { id: true, name: true, email: true, role: true, customerProfile: true },
            });
        }

        // 4. Clean up Redis
        await redis.del(`otp:${email}`);
        await redis.del(`pending_user:${email}`);
        await redis.del(`otp_request_count:${email}`);
        await redis.del(failedAttemptKey);

        generateAndSetTokens(res, newUser.id, newUser.role);

        // 5. Send Final Success
        res.status(201).json({
            success: true,
            message: "User registered, verified, and logged in successfully.",
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        if (req.body?.email) {
            try {
                if (req.body?.email && !(error instanceof ValidationError)) {
                    try {
                        await redis.del(`otp:${req.body.email}`);
                        await redis.del(`pending_user:${req.body.email}`);
                    } catch (redisError) {
                        console.error("Failed to clean up Redis after DB error:", redisError);
                    }
                }
            } catch (redisError) {
                console.error("Failed to clean up Redis after DB error:", redisError);
            }
        }
        return next(error);
    }
};

export const refrehsToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const refrehsToken = req.cookies.refresh_token;

        if (!refrehsToken) {
            throw new ValidationError("Unauthorised! No refresh token")
        }
        
        const decoded = jwt.verify(
            refrehsToken,
            process.env.REFRESH_ACCESS_TOKEN as string
        ) as {
            id: string,
            role: string,
        }
        
        if (!decoded || !decoded.id || !decoded.role) {
            throw new JsonWebTokenError("Forbidden! Invalid refresh token")
        }

        const user = await prisma.users.findUnique({ where: { id: decoded.id } })

        if (!user) {
            throw new AuthError("Forbidden! 'Customer/Seller' not found")
        }

        const newAccessToken = jwt.sign(
            { id: decoded.id, role: decoded.role },
            process.env.ACCESS_TOKEN_SECRET as string,
            { expiresIn: "15m" }
        )

        setCookie(res, "access_token", newAccessToken)

        res.status(200).json({
            success: true,
            message: "Access token generated successfully"
        })
    } catch (error) {
        return next(error)
    }
}

export const getLoggedInUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user;
        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            user
        })
    } catch (error) {
        next(error)
    }
}

export const forgetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body;
        if (!email) throw new ValidationError("Email is required");

        // Extract IP logic here in the controller
        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown_ip';
        const ipAddress = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0].trim();

        const result = await initiatePasswordReset(email, ipAddress);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export const verifyForgetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, otp } = req.body;
        
        // Call the clean helper
        await verifyForgetPasswordOtp(email, otp);

        res.status(200).json({
            success: true,
            message: "OTP verified. You can now reset your password."
        });
    } catch (error) {
        return next(error)
    }
}

export const resetPassword = async (req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
       const { email, newPassword } = req.body;
       
       if (!email || !newPassword) throw new ValidationError("Email and new password are required")

        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) throw new ValidationError("User not found")

        const isSamePassword = await bcrypt.compare(newPassword, user.password!);

        if (isSamePassword) throw new ValidationError("New password cannot be the same as the old one.")

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword as string, salt);

        await prisma.users.update({
            where: { email },
            data: { password: hashedPassword }
        })

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        })
    } catch (error) {
        return next(error)
    }
}

export const userLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body;

        // 1. Validation
        if (!email || !password) {
            throw new ValidationError("Email and password are required.");
        }

        // 2. Fetch user (Fix: Correct Prisma where clause)
        const user = await prisma.users.findUnique({
            where: { email }
        });

        if (!user) {
            throw new AuthError("Invalid email or password."); // Generic message for security
        }

        // 3. Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AuthError("Invalid email or password.");
        }

        // Call the shared helper
        generateAndSetTokens(res, user.id, user.role);

        // 6. Return sanitized user data
        res.status(200).json({
            status: true,
            message: "User successfully logged in.",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        return next(error);
    }
}