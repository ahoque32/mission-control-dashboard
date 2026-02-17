// app/chat/page.tsx - Main chat page
import ChatShell from '@/components/chat/ChatShell';

export const metadata = {
  title: 'Agent Chat | Mission Control',
  description: 'Chat with OpenClaw agents',
};

export default function ChatPage() {
  return <ChatShell />;
}
