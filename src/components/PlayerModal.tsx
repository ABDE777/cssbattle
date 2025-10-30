import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { GROUPS } from "@/constants/groups";

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (playerData: PlayerFormData) => Promise<void>;
  player?: PlayerFormData | null;
  mode: 'create' | 'edit';
}

export interface PlayerFormData {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  css_link: string;
  group_name: string;
  score: number;
  password?: string;
}

export function PlayerModal({ isOpen, onClose, onSave, player, mode }: PlayerModalProps) {
  const [formData, setFormData] = useState<PlayerFormData>({
    full_name: "",
    email: "",
    phone: "",
    css_link: "",
    group_name: "",
    score: 0,
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (player && mode === 'edit') {
      setFormData({
        ...player,
        password: "", // Never populate password field
      });
    } else {
      // Reset form for create mode
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        css_link: "",
        group_name: "",
        score: 0,
        password: "",
      });
    }
    setPasswordError(null);
  }, [player, mode, isOpen]);

  const validatePassword = (password: string): boolean => {
    if (mode === 'create' && (!password || password.trim() === "")) {
      setPasswordError("Password is required");
      return false;
    }
    
    if (password && password.length > 0 && password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (!validatePassword(formData.password || "")) {
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error is already handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Player' : 'Edit Player'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={mode === 'edit'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_name">Group *</Label>
              <Select
                value={formData.group_name}
                onValueChange={(value) => setFormData({ ...formData, group_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="css_link">CSS Battle Profile Link</Label>
              <Input
                id="css_link"
                value={formData.css_link}
                onChange={(e) => setFormData({ ...formData, css_link: e.target.value })}
                placeholder="https://cssbattle.dev/player/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="score">Score</Label>
              <Input
                id="score"
                type="number"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
              />
            </div>

            {mode === 'create' && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (passwordError) setPasswordError(null);
                  }}
                  required={mode === 'create'}
                  placeholder="Enter password (min. 6 characters)"
                  minLength={6}
                />
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              </div>
            )}

            {mode === 'edit' && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="password">New Password (leave empty to keep current)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Enter new password (min. 6 characters)"
                  minLength={6}
                />
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters. Leave empty to keep current password.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Player' : 'Update Player'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
