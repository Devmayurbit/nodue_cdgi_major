import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import Certificate from '../models/Certificate';
import { AuthRequest } from '../middleware/auth';
import { isRemoteUrl } from '../services/storageService';

// GET /api/v1/certificates/my
export const getMyCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const certs = await Certificate.find({ student: req.user!._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: certs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/certificates/verify/:certificateId
export const verifyCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate not found.' });
      return;
    }
    res.json({
      success: true,
      data: {
        certificateId: cert.certificateId,
        studentName: cert.studentName,
        enrollmentNumber: cert.enrollmentNumber,
        department: cert.department,
        semester: cert.semester,
        approvalDate: cert.approvalDate,
        isValid: cert.isValid,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/certificates/download/:certificateId
export const downloadCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate not found.' });
      return;
    }

    if (isRemoteUrl(cert.pdfPath)) {
      res.redirect(cert.pdfPath);
      return;
    }

    const filePath = path.join(__dirname, '../../uploads', cert.pdfPath);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'Certificate file not found.' });
      return;
    }

    res.download(filePath, `NoDues-Certificate-${cert.certificateId}.pdf`);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
