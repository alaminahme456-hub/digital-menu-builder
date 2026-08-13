'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useAppStore } from '@/lib/store';
import { BUSINESS_CATEGORIES } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateBusinessDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { token } = useAuthStore();
  const { setBusinesses, setCurrentBusiness, businesses, navigate } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    phone: '',
    whatsapp: '',
    address: '',
    openingHours: 'Mon-Sun 9:00 AM - 10:00 PM',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Business name is required');
      return;
    }
    if (!form.category) {
      toast.error('Please select a business category');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create business');
      }

      const data = await res.json();
      const newBusiness = data.business;

      const updatedBusinesses = [...businesses, {
        id: newBusiness.id,
        slug: newBusiness.slug,
        name: newBusiness.name,
        logo: newBusiness.logo,
        status: newBusiness.status,
      }];
      setBusinesses(updatedBusinesses);
      setCurrentBusiness(updatedBusinesses[updatedBusinesses.length - 1]);
      toast.success('Business created successfully!');
      onOpenChange(false);
      navigate('/dashboard');

      setForm({ name: '', category: '', phone: '', whatsapp: '', address: '', openingHours: 'Mon-Sun 9:00 AM - 10:00 PM', description: '' });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-emerald-600" />
            Create Your Business
          </DialogTitle>
          <DialogDescription>
            Set up your business profile. You can add more details later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="biz-name">Business Name *</Label>
            <Input
              id="biz-name"
              placeholder="e.g., The Golden Plate Restaurant"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="biz-category">Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger id="biz-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="biz-phone">Phone Number</Label>
              <Input
                id="biz-phone"
                placeholder="+234 xxx xxx xxxx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-whatsapp">WhatsApp Number</Label>
              <Input
                id="biz-whatsapp"
                placeholder="+234 xxx xxx xxxx"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="biz-address">Address</Label>
            <Input
              id="biz-address"
              placeholder="123 Main Street, Lagos"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="biz-hours">Opening Hours</Label>
            <Input
              id="biz-hours"
              placeholder="Mon-Sun 9:00 AM - 10:00 PM"
              value={form.openingHours}
              onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="biz-desc">Description</Label>
            <Textarea
              id="biz-desc"
              placeholder="A brief description of your business..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Business
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
