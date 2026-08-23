import { redirect } from 'next/navigation';

export default function Home() {
  // Chuyển hướng thẳng đến trang đăng nhập
  redirect('/login');
}
