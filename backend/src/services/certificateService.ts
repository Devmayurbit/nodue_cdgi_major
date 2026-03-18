import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Certificate from '../models/Certificate';
import SubjectApproval from '../models/SubjectApproval';
import { INoDues } from '../models/NoDues';
import { IUser } from '../models/User';
import { config } from '../config';
import { sendCertificateGeneratedEmail } from './emailService';
import { uploadLocalFile, usingCloudStorage } from './storageService';

const CERT_DIR = path.join(__dirname, '../../uploads/certificates');

const resolveLogoPath = (): string | null => {
  const configured = process.env.COLLEGE_LOGO_PATH;
  const backendRoot = path.join(__dirname, '../../');
  const candidates = [
    configured,
    path.join(backendRoot, 'assets/college-logo.png'),
    path.join(backendRoot, 'assets/cdgi-logo.png'),
    path.join(backendRoot, 'uploads/college-logo.png'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const ensureCertDir = () => {
  if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
  }
};

const formatStatus = (value?: string): string => {
  if (!value) return 'PENDING';
  return value.toUpperCase();
};

const formatDate = (value?: Date): string => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

type SubjectRow = {
  subject: string;
  facultyName: string;
  assignmentStatus: string;
  labStatus: string;
  signedOn: string;
};

const collectSubjectRows = async (noDuesId: string): Promise<SubjectRow[]> => {
  const approvals = await SubjectApproval.find({ noDues: noDuesId })
    .populate('faculty', 'name')
    .sort({ subject: 1 });

  return approvals.map((approval: any) => ({
    subject: approval.subject || 'N/A',
    facultyName: approval.faculty?.name || 'N/A',
    assignmentStatus: formatStatus(approval.assignmentStatus),
    labStatus: formatStatus(approval.labStatus),
    signedOn: formatDate(approval.actionedAt),
  }));
};

const drawPageFrame = (doc: PDFKit.PDFDocument): void => {
  doc.lineWidth(1).rect(24, 24, doc.page.width - 48, doc.page.height - 48).stroke('#222');
};

const drawCell = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  options?: { align?: 'left' | 'center' | 'right'; fontSize?: number; bold?: boolean }
): void => {
  doc.rect(x, y, width, height).stroke('#111');
  doc
    .font(options?.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(options?.fontSize || 9)
    .fillColor('#111')
    .text(text || '-', x + 4, y + 5, {
      width: width - 8,
      height: Math.max(height - 10, 8),
      align: options?.align || 'left',
      lineBreak: true,
      ellipsis: true,
    });
};

const getCellHeight = (doc: PDFKit.PDFDocument, text: string, width: number, fontSize = 8.5, bold = false): number => {
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
  const textHeight = doc.heightOfString(text || '-', {
    width: width - 8,
    align: 'left',
  });
  return Math.ceil(textHeight + 10);
};

const drawTableHeader = (doc: PDFKit.PDFDocument, x: number, y: number, colWidths: number[]): void => {
  const headers = ['Subject Code / Name', 'Faculty Name', 'Assignment/Case Study/PPT', 'Lab File/Report', 'Faculty Signed On'];
  let currentX = x;
  for (let i = 0; i < headers.length; i += 1) {
    drawCell(doc, currentX, y, colWidths[i], 32, headers[i], { align: 'center', bold: true, fontSize: 8.5 });
    currentX += colWidths[i];
  }
};

export const generateCertificateId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CDGI-ND-${timestamp}-${random}`;
};

export const generateCertificate = async (
  noDues: INoDues,
  student: IUser
): Promise<{ certificateId: string; pdfPath: string }> => {
  ensureCertDir();

  const subjectRows = await collectSubjectRows((noDues._id as any).toString());

  const certificateId = generateCertificateId();
  const verificationUrl = `${config.frontendUrl}/verify-certificate/${certificateId}`;

  // Generate QR code
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 150,
    margin: 1,
    color: { dark: '#1e3a8a', light: '#ffffff' },
  });

  const pdfFilename = `${certificateId}.pdf`;
  const pdfPath = path.join(CERT_DIR, pdfFilename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 28, bottom: 28, left: 28, right: 28 } });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const contentLeft = 36;
    const contentRight = pageWidth - 36;
    const contentWidth = contentRight - contentLeft;
    const centerX = pageWidth / 2;

    drawPageFrame(doc);

    const logoPath = resolveLogoPath();
    if (logoPath) {
      doc.image(logoPath, contentLeft, 34, { fit: [48, 48] });
      doc.image(logoPath, contentRight - 48, 34, { fit: [48, 48] });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#111')
      .text('CHAMELI DEVI GROUP OF INSTITUTIONS, INDORE', contentLeft, 38, {
        width: contentWidth,
        align: 'center',
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(`DEPARTMENT OF ${String(noDues.department || '').toUpperCase()}`, contentLeft, 62, {
        width: contentWidth,
        align: 'center',
      });

    doc.font('Helvetica-Bold').fontSize(14).text('ACADEMIC NO DUES FORM', contentLeft, 92, {
      width: contentWidth,
      align: 'center',
    });

    doc
      .font('Helvetica')
      .fontSize(11)
      .text(`Session: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, contentLeft, 112, {
        width: contentWidth,
        align: 'center',
      });

    doc
      .font('Helvetica')
      .fontSize(11)
      .text(`Semester: ${noDues.semester}    Section: ${noDues.section || '-'}`, contentLeft, 128, {
        width: contentWidth,
        align: 'center',
      });

    doc.font('Helvetica').fontSize(10);
    doc.text(`Certificate ID: ${certificateId}`, contentLeft, 152, { width: contentWidth, align: 'right' });

    const infoY = 170;
    doc.text(`Name of Student: ${student.name}`, contentLeft, infoY);
    doc.text(`Enrollment Number: ${noDues.enrollmentNumber}`, contentLeft, infoY + 16);
    doc.text(`Department: ${noDues.department}`, contentLeft + 320, infoY);
    doc.text(`Issued Date: ${formatDate(noDues.superAdminApproval?.approvedAt || new Date())}`, contentLeft + 320, infoY + 16);

    const tableX = contentLeft;
    const tableY = 220;
    const baseColWidths = [196, 118, 96, 86, 62];
    const baseTableWidth = baseColWidths.reduce((s, n) => s + n, 0);
    const scale = contentWidth / baseTableWidth;
    const colWidths = baseColWidths.map((width) => Math.floor(width * scale));
    colWidths[colWidths.length - 1] += contentWidth - colWidths.reduce((s, n) => s + n, 0);
    const tableWidth = colWidths.reduce((s, n) => s + n, 0);
    const footerReserve = 130;
    let rowY = tableY;

    drawTableHeader(doc, tableX, rowY, colWidths);
    rowY += 32;

    for (const row of subjectRows) {
      const rowHeight = Math.max(
        28,
        getCellHeight(doc, row.subject, colWidths[0], 8.5),
        getCellHeight(doc, row.facultyName, colWidths[1], 8.5),
        getCellHeight(doc, row.assignmentStatus, colWidths[2], 8.5),
        getCellHeight(doc, row.labStatus, colWidths[3], 8.5),
        getCellHeight(doc, row.signedOn, colWidths[4], 8.5)
      );

      if (rowY + rowHeight > doc.page.height - footerReserve) {
        doc.addPage();
        drawPageFrame(doc);
        rowY = 46;
        drawTableHeader(doc, tableX, rowY, colWidths);
        rowY += 32;
      }

      let currentX = tableX;
      drawCell(doc, currentX, rowY, colWidths[0], rowHeight, row.subject, { fontSize: 8.5 });
      currentX += colWidths[0];
      drawCell(doc, currentX, rowY, colWidths[1], rowHeight, row.facultyName, { fontSize: 8.5 });
      currentX += colWidths[1];
      drawCell(doc, currentX, rowY, colWidths[2], rowHeight, row.assignmentStatus, { align: 'center', fontSize: 8.5 });
      currentX += colWidths[2];
      drawCell(doc, currentX, rowY, colWidths[3], rowHeight, row.labStatus, { align: 'center', fontSize: 8.5 });
      currentX += colWidths[3];
      drawCell(doc, currentX, rowY, colWidths[4], rowHeight, row.signedOn, { align: 'center', fontSize: 8.5 });

      rowY += rowHeight;
    }

    if (subjectRows.length === 0) {
      drawCell(doc, tableX, rowY, tableWidth, 36, 'No subject-wise approvals found.', {
        align: 'center',
      });
      rowY += 36;
    }

    if (rowY + 110 > doc.page.height - 48) {
      doc.addPage();
      drawPageFrame(doc);
      rowY = 64;
    }

    const signatureY = rowY + 24;
    doc.moveTo(contentLeft, signatureY).lineTo(contentLeft + 200, signatureY).stroke('#222');
    doc.moveTo(contentRight - 200, signatureY).lineTo(contentRight, signatureY).stroke('#222');

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#111')
      .text('Admin Verification', contentLeft, signatureY + 6, { width: 200, align: 'center', lineBreak: false });
    doc
      .text('HOD Final Approval', contentRight - 200, signatureY + 6, { width: 200, align: 'center', lineBreak: false });

    doc
      .font('Helvetica')
      .fontSize(8)
      .text(`Admin Status: ${formatStatus(noDues.adminApproval?.status)}`, contentLeft, signatureY + 24, {
        width: 220,
        align: 'left',
        lineBreak: false,
      });
    doc
      .text(`HOD Status: ${formatStatus(noDues.superAdminApproval?.status)}`, contentRight - 220, signatureY + 24, {
        width: 220,
        align: 'right',
        lineBreak: false,
      });

    const issuedAt = noDues.superAdminApproval?.approvedAt || new Date();
    const approvalDate = new Date(issuedAt).toLocaleDateString('en-IN');
    const qrSize = 56;
    const bottomY = doc.page.height - 130;
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#333')
      .text(`Approved On: ${approvalDate}`, contentLeft, bottomY + 30, {
        width: contentWidth,
        align: 'left',
      });

    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, centerX - qrSize / 2, bottomY, { width: qrSize, height: qrSize });
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#444')
      .text('Scan to verify', centerX - 40, bottomY + qrSize + 6, { width: 80, align: 'center' });

    doc.end();

    stream.on('finish', async () => {
      try {
        const uploadedPdf = await uploadLocalFile(pdfPath, {
          folder: 'certificates',
          fileName: pdfFilename,
          resourceType: 'raw',
        });

        if (usingCloudStorage()) {
          await fs.promises.unlink(pdfPath).catch(() => undefined);
        }

        await Certificate.create({
          noDues: noDues._id,
          student: student._id,
          certificateId,
          enrollmentNumber: noDues.enrollmentNumber,
          studentName: student.name,
          department: noDues.department,
          semester: noDues.semester,
          approvalDate: new Date(),
          qrCode: qrDataUrl,
          pdfPath: uploadedPdf.url,
          isValid: true,
        });

        void sendCertificateGeneratedEmail(student.email, student.name, certificateId);

        resolve({ certificateId, pdfPath: uploadedPdf.url });
      } catch (err) {
        reject(err);
      }
    });

    stream.on('error', reject);
  });
};
