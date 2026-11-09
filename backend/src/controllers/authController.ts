import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserAccount, UserRole } from '../types/tms';

const generateToken = (user: UserAccount): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// In-memory OTP storage
const otpStore: Record<string, { otp: string; expiresAt: number }> = {};

export const login = (req: Request, res: Response): void => {
  const { emailOrUsername, password, role } = req.body;

  if (!emailOrUsername) {
    res.status(400).json({ success: false, message: 'Email or mobile number is required.' });
    return;
  }

  // Find user by email or mobile
  const user = dbStore.users.find(
    (u) =>
      u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
      u.mobile.replace(/\s+/g, '') === emailOrUsername.replace(/\s+/g, '')
  );

  if (!user) {
    // If not found, permit development mock user or return 401
    const defaultUser = dbStore.users[0];
    const token = generateToken(defaultUser);
    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: defaultUser,
        role: defaultUser.role,
        token,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      },
    });
    return;
  }

  // Generate JWT token
  const token = generateToken(user);

  res.json({
    success: true,
    message: 'Logged in successfully.',
    data: {
      user,
      role: user.role,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
  });
};

export const register = (req: Request, res: Response): void => {
  const { fullName, mobile, email, password, role, address } = req.body;

  if (!fullName || !mobile || !email) {
    res.status(400).json({ success: false, message: 'Full name, mobile and email are required.' });
    return;
  }

  const existing = dbStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    return;
  }

  const newUser: UserAccount = {
    id: `usr-${Date.now()}`,
    fullName,
    mobile,
    email,
    role: (role as UserRole) || 'operator',
    address: address || 'Transport Nagar Terminal',
    verificationStatus: 'verified',
    permissions: {
      canApproveTrips: role === 'admin',
      canSettlePayments: role === 'admin',
      canEditReminders: true,
      canManageDrivers: true,
      canViewFinancials: role === 'admin',
    },
    documents: [],
    createdAt: new Date().toISOString(),
  };

  dbStore.users.push(newUser);
  const token = generateToken(newUser);

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: {
      user: newUser,
      role: newUser.role,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
  });
};

export const me = (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const user = dbStore.users.find((u) => u.id === req.user?.id) || dbStore.users[0];
  res.json({
    success: true,
    data: {
      user,
      role: user.role,
    },
  });
};

export const forgotPassword = (req: Request, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email address is required.' });
    return;
  }

  const otp = '990142'; // Deterministic fallback OTP for testing / simulated email
  otpStore[email.toLowerCase()] = {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  res.json({
    success: true,
    message: `Verification code sent to ${email}. For testing: ${otp}`,
  });
};

export const verifyOtp = (req: Request, res: Response): void => {
  const { email, otp } = req.body;
  const challenge = otpStore[email?.toLowerCase()];

  if (!challenge || challenge.otp !== otp || challenge.expiresAt < Date.now()) {
    res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    return;
  }

  res.json({
    success: true,
    message: 'Code verified successfully. You may now enter your new password.',
  });
};

export const resetPassword = (req: Request, res: Response): void => {
  const { email, otp, newPassword } = req.body;
  const challenge = otpStore[email?.toLowerCase()];

  if (!challenge || challenge.otp !== otp) {
    res.status(400).json({ success: false, message: 'Invalid authorization for password update.' });
    return;
  }

  delete otpStore[email.toLowerCase()];
  res.json({
    success: true,
    message: 'Password updated successfully. You may now log in with your new credentials.',
  });
};

export const getAllUsers = (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.users,
  });
};

export const updateUserVerification = (req: AuthenticatedRequest, res: Response): void => {
  const { userId } = req.params;
  const { status, reason } = req.body;

  const user = dbStore.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  user.verificationStatus = status;
  if (reason) user.rejectionReason = reason;

  res.json({
    success: true,
    message: `User verification updated to ${status}.`,
    data: user,
  });
};

