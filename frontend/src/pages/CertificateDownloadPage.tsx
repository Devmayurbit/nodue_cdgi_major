import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Award, Download, CheckCircle2, ExternalLink } from 'lucide-react';

const CertificateDownloadPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['myCertificates'],
    queryFn: () => api.get('/certificates/my').then((r) => r.data.data),
  });

  const certs = data || [];

  const handleDownload = async (certificateId: string) => {
    try {
      const res = await api.get(`/certificates/download/${certificateId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NoDues_Certificate_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // toast handled by interceptor
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white">
            <Award size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Certificates</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">Download your No-Dues clearance certificates</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : certs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Award className="mx-auto text-[var(--color-text-secondary)] mb-3" size={48} />
          <h2 className="font-semibold text-lg mb-1">No Certificates Yet</h2>
          <p className="text-[var(--color-text-secondary)]">
            Certificates are generated after your no-dues application is fully approved.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certs.map((cert: any) => (
            <div key={cert._id} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span className="text-xs font-mono bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    {cert.certificateId}
                  </span>
                </div>
                {cert.isValid && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    Valid
                  </span>
                )}
              </div>

              <div className="space-y-1 text-sm mb-4">
                <p><span className="text-[var(--color-text-secondary)]">Name:</span> {cert.studentName}</p>
                <p><span className="text-[var(--color-text-secondary)]">Enrollment:</span> {cert.enrollmentNumber}</p>
                <p><span className="text-[var(--color-text-secondary)]">Department:</span> {cert.department}</p>
                <p><span className="text-[var(--color-text-secondary)]">Issued:</span> {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(cert.certificateId)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={14} /> Download PDF
                </button>
                {cert.qrCode && (
                  <a
                    href={cert.qrCode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-1 text-sm"
                  >
                    <ExternalLink size={14} /> QR
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verify section */}
      <div className="glass-card p-6">
        <h2 className="font-semibold mb-2">Verify a Certificate</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Enter a certificate ID to verify its authenticity.
        </p>
        <VerifyCert />
      </div>
    </div>
  );
};

const VerifyCert: React.FC = () => {
  const [certId, setCertId] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const verify = async () => {
    if (!certId.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.get(`/certificates/verify/${encodeURIComponent(certId.trim())}`);
      setResult(res.data.data);
    } catch {
      setResult({ valid: false });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input-field flex-1"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="Enter Certificate ID e.g. CDGI-ND-..."
        />
        <button onClick={verify} disabled={loading} className="btn-primary text-sm">
          {loading ? '...' : 'Verify'}
        </button>
      </div>
      {result && (
        <div className={`mt-3 p-3 rounded-xl text-sm ${result.valid || result.isValid ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
          {result.valid || result.isValid ? (
            <p>✅ Certificate is <strong>valid</strong>. Issued to {result.studentName || 'student'}.</p>
          ) : (
            <p>❌ Certificate is <strong>invalid</strong> or not found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificateDownloadPage;
