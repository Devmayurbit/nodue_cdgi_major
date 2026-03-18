import { Request, Response } from 'express';

interface BotRule {
  keywords: string[];
  response: string;
}

const botRules: BotRule[] = [
  {
    keywords: ['apply clearance', 'apply', 'no-dues form', 'no dues form'],
    response:
      'To apply clearance: open Dashboard > No-Dues Form, fill details, add remarks/files, and submit. The flow is Faculty -> HOD department checks -> Admin final control.',
  },
  {
    keywords: ['pending', 'why pending', 'status'],
    response:
      'Your request remains pending until required approvals are completed. Faculty handles Lab/Assignment, HOD updates Library/Accounts/Hostel/Lab/Assignment manually, then Admin can finalize.',
  },
  {
    keywords: ['library approval', 'library status', 'where is my library approval'],
    response:
      'Library status is updated manually by HOD in Department Clearance. Ask your HOD if the status is still pending.',
  },
  {
    keywords: ['certificate', 'download certificate'],
    response:
      'Once final approval is completed and certificate is generated, open Certificates page and use Download PDF.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'help', 'sahayak'],
    response:
      'Namaste! I am CDGI Sahayak AI. Ask me about clearance workflow, pending reasons, department approvals, or certificates.',
  },
];

const resolveBotReply = (message: string): string => {
  const text = message.toLowerCase();
  for (const rule of botRules) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.response;
    }
  }
  return 'I can help with clearance workflow, pending reasons, department status, and certificates. Please rephrase your question.';
};

export const chatbotReply = (req: Request, res: Response): void => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ success: false, message: 'message is required' });
    return;
  }

  res.json({
    success: true,
    data: {
      response: resolveBotReply(message.trim()),
      source: 'cdgi-sahayak-faq',
      timestamp: new Date().toISOString(),
    },
  });
};
