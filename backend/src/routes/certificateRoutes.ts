import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMyCertificates, verifyCertificate, downloadCertificate } from '../controllers/certificateController';

const router = Router();

router.get('/my', authenticate, getMyCertificates);
router.get('/verify/:certificateId', verifyCertificate);
router.get('/download/:certificateId', authenticate, downloadCertificate);

export default router;
