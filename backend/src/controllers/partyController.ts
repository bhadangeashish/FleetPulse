import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { Party, PartyDocument } from '../types/tms';

export const getAllParties = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.parties,
  });
};

export const addParty = (req: AuthenticatedRequest, res: Response): void => {
  const partyData: Partial<Party> = req.body;

  if (!partyData.name || !partyData.contactPerson || !partyData.mobile) {
    res.status(400).json({ success: false, message: 'Party name, contact person and mobile are required.' });
    return;
  }

  const newParty: Party = {
    id: `pty-${Date.now()}`,
    name: partyData.name.trim(),
    businessName: partyData.businessName || partyData.name,
    contactPerson: partyData.contactPerson.trim(),
    mobile: partyData.mobile.trim(),
    email: partyData.email,
    address: partyData.address || 'Market Yard APMC Complex',
    city: partyData.city || 'Surat',
    state: partyData.state || 'Gujarat',
    partyType: partyData.partyType || 'return_load_consignor',
    gstin: partyData.gstin,
    panNumber: partyData.panNumber,
    totalTripsCount: 0,
    totalBusinessAmount: 0,
    outstandingBalance: 0,
    documents: [],
    createdAt: new Date().toISOString(),
  };

  dbStore.parties.unshift(newParty);
  res.status(201).json({
    success: true,
    message: `Party ${newParty.name} registered successfully.`,
    data: newParty,
  });
};

export const addPartyDocument = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const docData = req.body;

  const party = dbStore.parties.find((p) => p.id === id);
  if (!party) {
    res.status(404).json({ success: false, message: 'Party not found.' });
    return;
  }

  const newDoc: PartyDocument = {
    id: `pdoc-${Date.now()}`,
    partyId: party.id,
    partyName: party.name,
    type: docData.type || 'Other Document',
    documentNumber: docData.documentNumber || `DOC-${Date.now().toString().slice(-4)}`,
    documentName: docData.documentName || docData.type || 'KYC Document',
    issueDate: docData.issueDate,
    expiryDate: docData.expiryDate,
    isNonExpiring: Boolean(docData.isNonExpiring),
    status: docData.status || 'verified',
    softCopyName: docData.softCopyName,
    softCopyUrl: docData.softCopyUrl,
    uploadedAt: new Date().toISOString(),
    notes: docData.notes,
  };

  party.documents.push(newDoc);
  res.status(201).json({
    success: true,
    message: `Document ${newDoc.documentName} added to party.`,
    data: newDoc,
  });
};

