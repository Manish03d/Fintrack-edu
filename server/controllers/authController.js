import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { MentorProfile } from '../models/MentorProfile.js';
import { RecruiterProfile } from '../models/RecruiterProfile.js';
import { generateToken } from '../utils/generateToken.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_STATE_COOKIE = 'fintrack_google_oauth_state';
const VALID_ROLES = ['student', 'mentor', 'recruiter'];
const getJwtSecret = () => process.env.JWT_SECRET || 'fintrack_edu_jwt_secret_key_2026_super_secure_token';

const getGoogleClient = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    return null;
  }

  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL,
  );
};

const getCookieValue = (cookieHeader, name) => {
  const cookie = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
};

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

const getAuthErrorPath = (flow) => (flow === 'registration' ? '/register' : '/login');

const statesMatch = (receivedState, expectedState) => {
  if (typeof receivedState !== 'string' || typeof expectedState !== 'string' || receivedState.length !== expectedState.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(receivedState), Buffer.from(expectedState));
};

const redirectToAuthError = (res, message, flow = 'login') => {
  const authUrl = new URL(getAuthErrorPath(flow), getClientUrl());
  authUrl.searchParams.set('oauthError', message);
  return res.redirect(authUrl.toString());
};

const readOAuthState = (cookieHeader) => {
  const encodedState = getCookieValue(cookieHeader, GOOGLE_STATE_COOKIE);
  if (!encodedState) return null;

  try {
    return JSON.parse(encodedState);
  } catch {
    return null;
  }
};

const getGoogleUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
});

/**
 * @desc    Start Google OAuth authorization
 * @route   GET /api/auth/google
 * @access  Public
 */
export const googleLogin = (req, res) => {
  const client = getGoogleClient();
  const requestedRole = req.query.role;
  const flow = requestedRole === undefined ? 'login' : 'registration';

  if (flow === 'registration' && !VALID_ROLES.includes(requestedRole)) {
    return redirectToAuthError(res, 'Please select a valid account role before continuing with Google', 'registration');
  }

  if (!client) {
    return redirectToAuthError(res, 'Google login is not configured yet', flow);
  }

  const state = crypto.randomBytes(32).toString('hex');
  const statePayload = JSON.stringify({ state, flow, role: requestedRole || null });
  res.cookie(GOOGLE_STATE_COOKIE, statePayload, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
    path: '/api/auth/google',
  });

  const authorizationUrl = client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });

  return res.redirect(authorizationUrl);
};

/**
 * @desc    Complete Google OAuth and issue the existing FinTrack JWT
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
export const googleCallback = async (req, res) => {
  const client = getGoogleClient();
  const savedState = readOAuthState(req.headers.cookie);
  const flow = savedState?.flow === 'registration' ? 'registration' : 'login';

  res.clearCookie(GOOGLE_STATE_COOKIE, { path: '/api/auth/google' });

  if (req.query.error) {
    return redirectToAuthError(res, 'Google login was cancelled', flow);
  }

  if (!client || !req.query.code || !savedState || !statesMatch(req.query.state, savedState.state)) {
    return redirectToAuthError(res, 'The Google login response could not be verified', flow);
  }

  try {
    if (!req.isDbConnected) {
      return redirectToAuthError(res, 'Google login requires a connected database', flow);
    }

    const { tokens } = await client.getToken(req.query.code);
    if (!tokens.id_token) {
      return redirectToAuthError(res, 'Google did not return a valid identity', flow);
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return redirectToAuthError(res, 'A verified Google email address is required', flow);
    }

    const normalizedEmail = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });

    if (flow === 'registration') {
      if (!VALID_ROLES.includes(savedState.role)) {
        return redirectToAuthError(res, 'The selected account role is invalid', 'registration');
      }

      const existingUser = user || await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        if (existingUser.role !== savedState.role) {
          return redirectToAuthError(
            res,
            `This email is already registered as a ${existingUser.role}. Please sign in using your existing account.`,
            'registration',
          );
        }

        if (existingUser.googleId === payload.sub) {
          const token = generateToken(existingUser._id, existingUser.role);
          const callbackUrl = new URL('/oauth/callback', getClientUrl());
          callbackUrl.hash = `token=${encodeURIComponent(token)}`;
          return res.redirect(callbackUrl.toString());
        }

        return redirectToAuthError(res, 'This email is already registered. Please sign in using your existing account.', 'registration');
      }

      const registrationTicket = jwt.sign(
        {
          type: 'google_registration',
          googleId: payload.sub,
          name: payload.name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          avatar: payload.picture || '',
          role: savedState.role,
        },
        getJwtSecret(),
        { expiresIn: '10m' },
      );
      const callbackUrl = new URL('/register', getClientUrl());
      callbackUrl.hash = `registration_token=${encodeURIComponent(registrationTicket)}`;
      return res.redirect(callbackUrl.toString());
    }

    if (!user) {
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        if (user.googleId && user.googleId !== payload.sub) {
          return redirectToAuthError(res, 'This email is linked to another Google account', 'login');
        }

        user.googleId = payload.sub;
        user.authProvider = user.passwordHash ? 'local_google' : 'google';
        user.isVerified = true;
        user.avatar = user.avatar || payload.picture || '';
        await user.save();
      } else {
        return redirectToAuthError(res, 'No FinTrack account exists for this Google email. Please register first.', 'login');
      }
    }

    const token = generateToken(user._id, user.role);
    const callbackUrl = new URL('/oauth/callback', getClientUrl());
    callbackUrl.hash = `token=${encodeURIComponent(token)}`;
    return res.redirect(callbackUrl.toString());
  } catch (error) {
    console.error('[Google OAuth Error]', error.message);
    return redirectToAuthError(res, 'Google login could not be completed. Please try again.', flow);
  }
};

/**
 * @desc    Create a complete user from a verified Google registration ticket
 * @route   POST /api/auth/google/register
 * @access  Public
 */
export const completeGoogleRegistration = async (req, res) => {
  try {
    if (!req.isDbConnected) {
      return res.status(503).json({ success: false, message: 'Google registration requires a connected database' });
    }

    const { registrationToken, role, phone, institution, degree, yearOfStudy, designation, company, expertise, companyName, industry, companySize } = req.body;
    const ticket = jwt.verify(registrationToken || '', getJwtSecret());

    if (ticket.type !== 'google_registration' || ticket.role !== role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'The Google registration session is invalid' });
    }

    const existingUser = await User.findOne({ $or: [{ email: ticket.email }, { googleId: ticket.googleId }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'This Google account is already registered. Please sign in instead.' });
    }

    const user = await User.create({
      name: ticket.name,
      email: ticket.email,
      phone: phone || '',
      googleId: ticket.googleId,
      authProvider: 'google',
      role: ticket.role,
      isVerified: true,
      avatar: ticket.avatar || '',
    });

    try {
      if (role === 'student') {
        await StudentProfile.create({ userId: user._id, institution: institution || '', degree: degree || '', yearOfStudy: yearOfStudy || '' });
      } else if (role === 'mentor') {
        await MentorProfile.create({ userId: user._id, designation: designation || '', company: company || '', expertise: expertise || '' });
      } else {
        await RecruiterProfile.create({ userId: user._id, companyName: companyName || '', industry: industry || '', companySize: companySize || '' });
      }
    } catch (profileError) {
      await User.deleteOne({ _id: user._id });
      throw profileError;
    }

    const token = generateToken(user._id, user.role);
    return res.status(201).json({ success: true, message: 'Google registration successful', token, user: getGoogleUser(user) });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(400).json({ success: false, message: 'Your Google registration session expired. Please try again.' });
    }
    console.error('[Google Registration Error]', error.message);
    return res.status(500).json({ success: false, message: 'Google registration could not be completed. Please try again.' });
  }
};

// Generate cryptographically secure 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * @desc    Register a new user (Student / Mentor / Recruiter)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, ...roleData } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields' });
    }

    if (!['student', 'mentor', 'recruiter'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (req.isDbConnected) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        phone,
        passwordHash: password,
        role,
        otpCode,
        otpExpires,
        isVerified: false,
      });

      if (role === 'student') {
        await StudentProfile.create({
          userId: user._id,
          institution: roleData.institution || '',
          degree: roleData.degree || '',
          yearOfStudy: roleData.yearOfStudy || '',
        });
      } else if (role === 'mentor') {
        await MentorProfile.create({
          userId: user._id,
          designation: roleData.designation || '',
          company: roleData.company || '',
          expertise: roleData.expertise || '',
        });
      } else if (role === 'recruiter') {
        await RecruiterProfile.create({
          userId: user._id,
          companyName: roleData.companyName || '',
          industry: roleData.industry || '',
          companySize: roleData.companySize || '',
        });
      }

      await sendVerificationEmail(email, otpCode);

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Verification code sent to email.',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: false,
        },
      });
    }

    // Mock Mode fallback response
    await sendVerificationEmail(email, otpCode);
    return res.status(201).json({
      success: true,
      message: 'Registration successful! Verification code sent to email.',
      data: {
        id: 'mock-user-id-' + Date.now(),
        name,
        email,
        role,
        isVerified: false,
      },
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ success: false, message: error.message || 'Server registration error' });
  }
};

/**
 * @desc    Verify OTP Code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    if (req.isDbConnected) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.otpExpires && user.otpExpires < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
      }

      if (user.otpCode !== otpCode) {
        return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.' });
      }

      user.isVerified = true;
      user.otpCode = null;
      user.otpExpires = null;
      await user.save();

      const token = generateToken(user._id, user.role);

      return res.json({
        success: true,
        message: 'Account verified successfully!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: true,
        },
      });
    }

    // Mock Mode
    if (otpCode !== '123456' && otpCode.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Use 123456 for testing.' });
    }

    const token = generateToken('mock-id-123', 'student');
    return res.json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: {
        id: 'mock-id-123',
        name: 'Demo Student',
        email,
        role: 'student',
        isVerified: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const newOtp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (req.isDbConnected) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.otpCode = newOtp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    await sendVerificationEmail(email, newOtp);

    return res.json({
      success: true,
      message: 'Verification code resent to your email address.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Login user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password' });
    }

    if (req.isDbConnected) {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user || !user.passwordHash) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const token = generateToken(user._id, user.role);

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    }

    // Fallback Mock authentication for dev demo
    let role = 'student';
    let name = 'Vishaltharshan S';

    if (email.includes('mentor')) {
      role = 'mentor';
      name = 'Dr. Aris Vance';
    } else if (email.includes('recruiter')) {
      role = 'recruiter';
      name = 'Sarah Jenkins';
    }

    const token = generateToken('mock-user-123', role);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: 'mock-user-123',
        name,
        email,
        role,
        isVerified: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Forgot Password Request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email address is required' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    if (req.isDbConnected) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();
        await sendPasswordResetEmail(email, rawToken);
      }
    } else {
      await sendPasswordResetEmail(email, rawToken);
    }

    return res.json({
      success: true,
      message: 'Password reset instructions have been sent to your registered email.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reset Password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'New password is required' });
    if (!token) return res.status(400).json({ success: false, message: 'Password reset token is required' });

    if (req.isDbConnected) {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Password reset token is invalid or has expired. Please request a new link.',
        });
      }

      user.passwordHash = password; // Trigger bcrypt hashing in user pre-save hook
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.',
      });
    }

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Current Authenticated User Profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
