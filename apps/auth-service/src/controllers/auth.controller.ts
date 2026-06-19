import { Request, Response, NextFunction } from "express"
import { checkOtpRestrictions, sendOtp, trackOtpRequests, validateRegistrationData } from "../utils/auth.helper";
import {prisma} from "../../../../packages/lib/prisma";
import { ValidationError } from "../../../../packages/error-handler";
import bcrypt from "bcryptjs";
import redis from '../../../../packages/lib/redis';
import { AccountPayload, SellerProfilePayload, CustomerProfilePayload, RegistrationPayload } from "../../types/types";

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

        if (storedOtp !== otp.toString()) {
            throw new ValidationError("Invalid OTP code.");
        }

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

        // 5. Send Final Success
        res.status(201).json({
            success: true,
            message: "User registered and verified successfully.",
            data: newUser,
        });

    } catch (error) {
        next(error);
    }
};