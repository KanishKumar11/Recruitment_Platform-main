//lib/auth.ts
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from './../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const getTokenFromHeader = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

export const authenticateRequest = (req: NextRequest): JwtPayload | null => {
  const token = getTokenFromHeader(req);
  if (!token) return null;
  return verifyToken(token);
};

export const authorizeRoles = (req: NextRequest, allowedRoles: UserRole[]): boolean => {
  const userData = authenticateRequest(req);
  if (!userData) return false;
  return allowedRoles.includes(userData.role);
};

export const unauthorized = () => {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
};

export const forbidden = () => {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
};