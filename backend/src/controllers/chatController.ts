import { Response } from 'express';
import ChatLog from '../models/ChatLog';
import { AuthRequest } from '../middleware/auth';

interface ChatRule {
  keywords: string[];
  response: string;
}

const chatRules: ChatRule[] = [
  {
    keywords: ['no-dues', 'no dues', 'nodues', 'submit form', 'apply'],
    response:
      'To submit your No-Dues form:\n1. Go to your Dashboard\n2. Click "No-Dues Form"\n3. Verify your auto-filled details\n4. Add any remarks or attachments\n5. Click Submit\n\nYour form will go through Faculty → Department → Admin → Super Admin approval.',
  },
  {
    keywords: ['assignment', 'upload assignment', 'submit assignment'],
    response:
      'To upload assignments:\n1. Go to No-Dues Form page\n2. Use the file attachment section\n3. Upload your assignment as PDF (max 10MB)\n4. Faculty will verify your assignment completion.',
  },
  {
    keywords: ['certificate', 'download certificate', 'get certificate'],
    response:
      'Your No-Dues certificate will be generated automatically after final Super Admin approval. Go to "Certificates" section in your dashboard to download it. Each certificate has a QR code for verification.',
  },
  {
    keywords: ['status', 'track', 'progress', 'where', 'pending'],
    response:
      'Check your No-Dues status on your Dashboard. You\'ll see a progress timeline showing:\n- Faculty Approval status\n- Library, Accounts, Hostel, Lab clearance\n- Admin Approval status\n- Super Admin Final Approval',
  },
  {
    keywords: ['department', 'contact', 'phone', 'email', 'reach'],
    response:
      'Department Contacts:\n- Library: library@cdgi.edu.in\n- Accounts: accounts@cdgi.edu.in\n- Hostel: hostel@cdgi.edu.in\n- Laboratory: lab@cdgi.edu.in\n- Main Office: office@cdgi.edu.in\n\nVisit the institution website for more details.',
  },
  {
    keywords: ['notice', 'submit notice'],
    response:
      'To submit a notice:\n1. Go to "Notice Form" from your dashboard\n2. Enter the title and description\n3. Attach any supporting documents or audio\n4. Submit for Faculty → Admin → Super Admin review.',
  },
  {
    keywords: ['password', 'forgot', 'reset', 'change password'],
    response:
      'To reset your password, please contact the Admin office. For security, password resets are handled by administrators.',
  },
  {
    keywords: ['register', 'sign up', 'create account'],
    response:
      'To register:\n1. Go to the Registration page\n2. Enter your Name, Email, Enrollment Number, Department, and Password\n3. Verify your email (check inbox or use the 6-digit code)\n4. Log in with your credentials.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'help', 'sahayak'],
    response:
      'Namaste! I am CDGI Sahayak, your No-Dues assistant. I can help you with:\n- Submitting No-Dues forms\n- Uploading assignments\n- Tracking approval status\n- Downloading certificates\n- Finding department contacts\n\nJust ask me anything!',
  },
  {
    keywords: ['thank', 'thanks', 'bye', 'goodbye'],
    response: 'You\'re welcome! If you need any more help, feel free to ask. Good luck with your No-Dues clearance!',
  },
];

const findResponse = (message: string): string => {
  const lower = message.toLowerCase();
  for (const rule of chatRules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.response;
    }
  }
  return "I'm not sure about that. You can ask me about:\n- No-Dues form submission\n- Assignment upload\n- Certificate download\n- Approval status tracking\n- Department contacts\n- Notice submission";
};

// POST /api/v1/chat
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Message is required.' });
      return;
    }

    const botResponse = findResponse(message.trim());

    // Store in chat history
    let chatLog = await ChatLog.findOne({ user: user._id });
    if (!chatLog) {
      chatLog = await ChatLog.create({ user: user._id, messages: [] });
    }

    chatLog.messages.push(
      { role: 'user', content: message.trim(), timestamp: new Date() },
      { role: 'bot', content: botResponse, timestamp: new Date() }
    );

    // Keep last 100 messages
    if (chatLog.messages.length > 100) {
      chatLog.messages = chatLog.messages.slice(-100);
    }

    await chatLog.save();

    res.json({
      success: true,
      data: {
        response: botResponse,
        timestamp: new Date(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/chat/history
export const getChatHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chatLog = await ChatLog.findOne({ user: req.user!._id });
    res.json({
      success: true,
      data: chatLog ? chatLog.messages.slice(-50) : [],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
