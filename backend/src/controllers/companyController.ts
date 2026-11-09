import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';

export const getCompanyProfile = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.companyProfile,
  });
};

export const updateCompanyProfile = (req: AuthenticatedRequest, res: Response): void => {
  const updates = req.body;

  dbStore.companyProfile = {
    ...dbStore.companyProfile,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    message: 'Company profile updated successfully.',
    data: dbStore.companyProfile,
  });
};

export const renameCompany = (req: AuthenticatedRequest, res: Response): void => {
  const { newName } = req.body;
  if (!newName || newName.trim().length < 2) {
    res.status(400).json({ success: false, message: 'Valid company name is required.' });
    return;
  }

  dbStore.companyProfile.companyName = newName.trim();
  dbStore.companyProfile.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: `Transport company name successfully updated to ${newName.trim()}.`,
    data: dbStore.companyProfile,
  });
};

