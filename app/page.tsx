import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to demo SOW for prototype
  redirect('/sow/demo-token-abc123xyz789');
}
