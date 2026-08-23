import { redirect } from 'next/navigation';

export default function TeacherRoot() {
  redirect('/teacher/classes');
}
