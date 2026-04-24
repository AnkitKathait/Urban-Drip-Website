'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth }  from '@/hooks/useAuth'
import { isValidPhone, isValidPincode } from '@/lib/utils'
import { Plus, Pencil, Trash2, MapPin, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import { cn }     from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Address, AddressFormData } from '@/types'

const BLANK: AddressFormData = {
  full_name: '', phone: '', address_line1: '', address_line2: '',
  city: '', state: '', pincode: '', is_default: false,
}

export default function AddressesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading,   setLoading]   = useState(true)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState<AddressFormData>(BLANK)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login?redirect=/account/addresses')
  }, [authLoading, isAuthenticated, router])

  const fetchAddresses = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
    setAddresses((data ?? []) as Address[])
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) fetchAddresses() }, [user, fetchAddresses])

  function startEdit(addr: Address) {
    setForm({
      full_name:    addr.full_name,
      phone:        addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 ?? '',
      city:         addr.city,
      state:        addr.state,
      pincode:      addr.pincode,
      is_default:   addr.is_default,
    })
    setEditId(addr.id)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm(BLANK)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhone(form.phone))    { toast.error('Invalid phone number'); return }
    if (!isValidPincode(form.pincode)) { toast.error('Invalid pincode'); return }
    if (!user) return

    setSaving(true)
    const supabase = createClient()
    try {
      if (editId) {
        const { error } = await supabase.from('addresses').update({ ...form }).eq('id', editId)
        if (error) throw error
        toast.success('Address updated')
      } else {
        const { error } = await supabase.from('addresses').insert({ ...form, user_id: user.id })
        if (error) throw error
        toast.success('Address added')
      }
      cancelForm()
      fetchAddresses()
    } catch {
      toast.error('Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('addresses').delete().eq('id', id)
    if (error) toast.error('Failed to delete address')
    else { toast.success('Address removed'); fetchAddresses() }
    setDeleting(null)
  }

  async function setDefault(id: string) {
    if (!user) return
    const supabase = createClient()
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true  }).eq('id', id)
    fetchAddresses()
    toast.success('Default address updated')
  }

  if (authLoading || loading) {
    return (
      <div className="ud-container py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ud-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="ud-container py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/account" className="text-xs text-ud-muted hover:text-ud-accent font-mono transition-colors">ACCOUNT</Link>
        <span className="text-ud-gray">/</span>
        <span className="text-xs text-ud-white font-mono">ADDRESSES</span>
      </div>
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-bebas text-5xl text-ud-white">MY ADDRESSES</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(BLANK) }}
            className="flex items-center gap-2 text-sm text-ud-accent font-heading tracking-wider hover:text-ud-white transition-colors"
          >
            <Plus className="w-4 h-4" /> ADD NEW
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border border-ud-gray rounded-sm mb-8 space-y-4">
          <h2 className="font-heading text-sm text-ud-white tracking-wider">
            {editId ? 'EDIT ADDRESS' : 'NEW ADDRESS'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name"   value={form.full_name}    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}    required />
            <Input label="Phone"       value={form.phone}        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}        required type="tel" maxLength={10} />
            <Input label="Address Line 1" value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} required className="sm:col-span-2" />
            <Input label="Address Line 2 (optional)" value={form.address_line2 ?? ''} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} className="sm:col-span-2" />
            <Input label="City"        value={form.city}         onChange={e => setForm(f => ({ ...f, city: e.target.value }))}         required />
            <Input label="State"       value={form.state}        onChange={e => setForm(f => ({ ...f, state: e.target.value }))}        required />
            <Input label="Pincode"     value={form.pincode}      onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}      required maxLength={6} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} className="accent-ud-accent" />
            <span className="text-sm text-ud-muted">Set as default address</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} size="sm">SAVE ADDRESS</Button>
            <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>CANCEL</Button>
          </div>
        </form>
      )}

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-ud-gray rounded-full">
            <MapPin className="w-10 h-10 text-ud-muted" />
          </div>
          <p className="font-heading text-xl text-ud-white mb-3">NO ADDRESSES SAVED</p>
          <p className="text-ud-muted mb-8 text-sm">Add an address to speed up your checkout.</p>
          <Button onClick={() => setShowForm(true)}>ADD ADDRESS</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={cn(
                'p-5 border rounded-sm transition-colors',
                addr.is_default ? 'border-ud-accent bg-ud-accent/5' : 'border-ud-gray bg-ud-dark'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-heading text-sm text-ud-white tracking-wide">{addr.full_name}</p>
                    {addr.is_default && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-ud-neon border border-ud-neon/30 px-1.5 py-0.5 rounded-sm">
                        <Check className="w-2.5 h-2.5" /> DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-ud-muted text-sm">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                  <p className="text-ud-muted text-sm">{addr.city}, {addr.state} – {addr.pincode}</p>
                  <p className="font-mono text-xs text-ud-muted mt-1">{addr.phone}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!addr.is_default && (
                    <button
                      onClick={() => setDefault(addr.id)}
                      className="text-xs text-ud-muted hover:text-ud-neon font-mono transition-colors"
                    >
                      SET DEFAULT
                    </button>
                  )}
                  <button onClick={() => startEdit(addr)} className="p-2 text-ud-muted hover:text-ud-white transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deleting === addr.id}
                    className="p-2 text-ud-muted hover:text-ud-accent transition-colors"
                  >
                    {deleting === addr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
