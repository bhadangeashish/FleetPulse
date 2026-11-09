import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { PartyPaymentRecord, PaymentEntry } from '../types/tms';

export const getAllPayments = (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.partyPayments,
  });
};

export const recordPartialPayment = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { amount, paymentMode, referenceNumber, notes } = req.body;
  const payAmount = Number(amount);

  if (!payAmount || payAmount <= 0) {
    res.status(400).json({ success: false, message: 'Valid payment installment amount is required.' });
    return;
  }

  const payment = dbStore.partyPayments.find((p) => p.id === id);
  if (!payment) {
    res.status(404).json({ success: false, message: 'Payment record not found.' });
    return;
  }

  payment.amountPaid = (Number(payment.amountPaid) || 0) + payAmount;
  payment.amountDue = Math.max(0, (Number(payment.chargeAmount) || 0) - payment.amountPaid);

  if (payment.amountDue === 0) {
    payment.status = 'settled';
    payment.isSettled = true;
  } else {
    payment.status = 'partially_paid';
  }

  const newEntry: PaymentEntry = {
    id: `pay-${Date.now()}`,
    amount: payAmount,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: paymentMode || 'NEFT',
    referenceNumber,
    notes,
    recordedBy: req.user?.fullName || 'Finance Admin',
    recordedAt: new Date().toISOString(),
  };

  if (!payment.paymentHistory) payment.paymentHistory = [];
  payment.paymentHistory.push(newEntry);

  res.json({
    success: true,
    message: `Payment installment of ₹${payAmount.toLocaleString('en-IN')} recorded. Remaining balance: ₹${payment.amountDue.toLocaleString('en-IN')}`,
    data: payment,
  });
};

export const settlePayment = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { settledAmount, lrSubmitted } = req.body;

  const payment = dbStore.partyPayments.find((p) => p.id === id);
  if (!payment) {
    res.status(404).json({ success: false, message: 'Payment record not found.' });
    return;
  }

  if (settledAmount !== undefined) {
    payment.settledAmount = Number(settledAmount);
    payment.amountPaid = Number(settledAmount);
    payment.amountDue = 0;
  } else {
    payment.amountPaid = payment.chargeAmount;
    payment.amountDue = 0;
  }

  payment.isSettled = true;
  payment.status = 'settled';
  if (lrSubmitted !== undefined) {
    payment.lrSubmittedToParty = Boolean(lrSubmitted);
  }

  res.json({
    success: true,
    message: `Payment settled for LR ${payment.lrNumber}.`,
    data: payment,
  });
};

