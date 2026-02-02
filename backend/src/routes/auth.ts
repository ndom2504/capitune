import { Router } from "express";
import { register, login, me } from "../controllers/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @body    { email, password, firstName, lastName, role? }
 * @returns { user, token, refreshToken }
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @body    { email, password }
 * @returns { user, token, refreshToken }
 */
router.post("/login", login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @auth    Required
 * @returns { user }
 */
router.get("/me", authMiddleware, me);

export default router;
