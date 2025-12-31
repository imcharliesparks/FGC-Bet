import { redirect } from 'next/navigation'

export default function AdminRoot() {
  return redirect('/admin/stats')
}
