import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useLocation } from 'wouter';
import { Bell, Upload, Mic, Send } from 'lucide-react';

const NoticeFormPage: React.FC = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/notices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Notice submitted successfully!');
      navigate('/notices/my');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (file) formData.append('file', file);
    if (audio) formData.append('audio', audio);
    submitMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-white">
            <Bell size={20} />
          </div>
          <h1 className="text-2xl font-bold">Submit Notice</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Submit a notice for faculty and admin approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notice title"
            required
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            className="input-field min-h-[120px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the notice in detail..."
            required
            maxLength={2000}
          />
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Attachment (optional)</label>
          <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-4 text-center">
            <Upload className="mx-auto text-[var(--color-text-secondary)] mb-1" size={24} />
            <p className="text-xs text-[var(--color-text-secondary)] mb-2">PDF, DOC, images (max 5MB)</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mx-auto block text-sm"
            />
          </div>
          {file && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">📄 {file.name}</p>}
        </div>

        {/* Audio upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Audio Recording (optional)</label>
          <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-4 text-center">
            <Mic className="mx-auto text-[var(--color-text-secondary)] mb-1" size={24} />
            <p className="text-xs text-[var(--color-text-secondary)] mb-2">MP3, WAV, OGG (max 10MB)</p>
            <input
              type="file"
              accept=".mp3,.wav,.ogg,.m4a"
              onChange={(e) => setAudio(e.target.files?.[0] || null)}
              className="mx-auto block text-sm"
            />
          </div>
          {audio && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">🎙️ {audio.name}</p>}
        </div>

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {submitMutation.isPending ? 'Submitting...' : 'Submit Notice'}
        </button>
      </form>
    </div>
  );
};

export default NoticeFormPage;
