import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useLocation } from 'wouter';
import { FileText, Upload, Send } from 'lucide-react';

const departments = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
];

const NoDuesFormPage: React.FC = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [files, setFiles] = useState<File[]>([]);
  const [reason, setReason] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/nodues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('No-Dues application submitted successfully!');
      navigate('/nodues/my');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (reason) formData.append('remarks', reason);
    files.forEach((f) => formData.append('attachments', f));
    submitMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          <h1 className="text-2xl font-bold">Submit No-Dues Application</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Your details will be auto-filled. Add any supporting documents if needed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* Auto-filled details */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input className="input-field" value={user?.name || ''} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="input-field" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Enrollment No</label>
            <input className="input-field" value={user?.enrollmentNumber || ''} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input className="input-field" value={user?.department || ''} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Semester</label>
            <input className="input-field" value={user?.semester || ''} disabled />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium mb-1">Reason / Additional Notes (optional)</label>
          <textarea
            className="input-field min-h-[100px] resize-y"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Any additional information..."
            maxLength={500}
          />
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Supporting Documents (optional)</label>
          <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-6 text-center">
            <Upload className="mx-auto text-[var(--color-text-secondary)] mb-2" size={28} />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              Drag & drop or click to select files (max 5MB each)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="mx-auto block text-sm"
            />
          </div>
          {files.length > 0 && (
            <ul className="mt-2 text-sm space-y-1">
              {files.map((f, i) => (
                <li key={i} className="text-[var(--color-text-secondary)]">
                  📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Approval chain info */}
        <div className="bg-[var(--color-surface)] rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-2">Approval Chain</h3>
          <ol className="text-xs text-[var(--color-text-secondary)] space-y-1 list-decimal list-inside">
            <li>Subject-wise Faculty Approvals (assignment and lab)</li>
            <li>Admin Verification: Library, Lab, Accounts, Hostel</li>
            <li>HOD Final Approval</li>
            <li>No-Dues Certificate Generation</li>
          </ol>
        </div>

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {submitMutation.isPending ? 'Submitting...' : 'Submit No-Dues Application'}
        </button>
      </form>
    </div>
  );
};

export default NoDuesFormPage;
