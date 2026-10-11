"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Smartphone, Wifi, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const CHANNELS = [
  { id: "IN_APP", label: "In-App", icon: Bell, color: "text-primary" },
  { id: "EMAIL", label: "Email", icon: Mail, color: "text-blue-600" },
  { id: "SMS", label: "SMS", icon: Smartphone, color: "text-green-600" },
  { id: "WHATSAPP", label: "WhatsApp", icon: Wifi, color: "text-green-500" },
] as const;

const CATEGORIES = [
  { id: "APPOINTMENT_CONFIRMATION", label: "Appointment Confirmation" },
  { id: "APPOINTMENT_REMINDER", label: "Appointment Reminder" },
  { id: "APPOINTMENT_CHANGE", label: "Appointment Change" },
  { id: "FOLLOW_UP_REMINDER", label: "Follow-up Reminder" },
  { id: "LAB_RESULT", label: "Lab Result" },
  { id: "PRESCRIPTION_READY", label: "Prescription Ready" },
  { id: "PAYMENT_RECEIPT", label: "Payment Receipt" },
  { id: "BALANCE_REMINDER", label: "Balance Reminder" },
  { id: "CLINIC_ANNOUNCEMENT", label: "Clinic Announcement" },
  { id: "STAFF_TASK", label: "Staff Task" },
  { id: "CUSTOM", label: "Custom" },
] as const;

const FREQUENCIES = [
  { value: "IMMEDIATE", label: "Immediate" },
  { value: "DAILY_DIGEST", label: "Daily Digest" },
  { value: "WEEKLY_DIGEST", label: "Weekly Digest" },
] as const;

type Pref = {
  enabled: boolean;
  frequency: string;
  quietHoursStart: string;
  quietHoursEnd: string;
};

const DEFAULT_PREF: Pref = {
  enabled: true,
  frequency: "IMMEDIATE",
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
};

export function NotificationPreferences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, Record<string, Pref>>>({});
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/notifications/preferences", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const prefs: Record<string, Record<string, Pref>> = {};
        (data.preferences || []).forEach((p: any) => {
          if (!prefs[p.category]) prefs[p.category] = {};
          prefs[p.category]![p.channel] = {
            enabled: p.enabled,
            frequency: p.frequency || "IMMEDIATE",
            quietHoursStart: p.quietHoursStart || "22:00",
            quietHoursEnd: p.quietHoursEnd || "08:00",
          };
        });
        setPreferences(prefs);

        const cons: Record<string, boolean> = {};
        (data.consents || []).forEach((c: any) => {
          cons[c.channel] = c.consented;
        });
        setConsents(cons);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPref = (category: string, channel: string): Pref =>
    preferences[category]?.[channel] ?? DEFAULT_PREF;

  const updatePref = (category: string, channel: string, patch: Partial<Pref>) => {
    setPreferences(prev => {
      const base = prev[category]?.[channel] ?? DEFAULT_PREF;
      const merged: Pref = {
        enabled: patch.enabled ?? base.enabled,
        frequency: patch.frequency ?? base.frequency,
        quietHoursStart: patch.quietHoursStart ?? base.quietHoursStart,
        quietHoursEnd: patch.quietHoursEnd ?? base.quietHoursEnd,
      };
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [channel]: merged,
        },
      };
    });
  };

  const toggleCategoryAll = (category: string, enabled: boolean) => {
    setPreferences(prev => {
      const next = { ...prev };
      const channels = next[category];
      if (channels) {
        Object.keys(channels).forEach(ch => {
          const base = channels[ch] ?? DEFAULT_PREF;
          channels[ch] = { ...base, enabled };
        });
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const prefs = Object.entries(preferences).flatMap(([category, channels]) =>
        Object.entries(channels).map(([channel, pref]) => ({
          category,
          channel,
          enabled: pref.enabled,
          frequency: pref.frequency,
          quietHoursStart: pref.quietHoursStart,
          quietHoursEnd: pref.quietHoursEnd,
        }))
      );

      const consentsArray = Object.entries(consents).map(([channel, consented]) => ({
        channel,
        consented,
      }));

      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ preferences: prefs, consents: consentsArray }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Control how and when you receive notifications for each category and channel.
            </CardDescription>
          </div>
          <Button onClick={save} disabled={saving} className="ml-4">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {saved && (
          <div className="mb-4 rounded-lg bg-success/10 border border-success/20 p-3 text-sm text-success">
            Preferences saved successfully!
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Channel Consent</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map(c => {
              const Icon = c.icon;
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <Icon className={`size-5 ${c.color}`} aria-hidden />
                  <Switch
                    checked={consents[c.id] ?? true}
                    onCheckedChange={checked => setConsents(prev => ({ ...prev, [c.id]: checked }))}
                  />
                  <span className="font-medium">{c.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-6">
          {CATEGORIES.map(category => {
            const allEnabled = CHANNELS.every(c => getPref(category.id, c.id).enabled);
            return (
              <div key={category.id} className="rounded-lg border p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold capitalize">{category.label}</h4>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">All channels</label>
                    <Switch
                      checked={allEnabled}
                      onCheckedChange={checked => toggleCategoryAll(category.id, checked)}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {CHANNELS.map(channel => {
                    const pref = getPref(category.id, channel.id);
                    const Icon = channel.icon;
                    return (
                      <div key={channel.id} className="rounded-lg border p-3 bg-background/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`size-4 ${channel.color}`} aria-hidden />
                            <span className="font-medium text-sm">{channel.label}</span>
                          </div>
                          <Switch
                            checked={pref.enabled}
                            onCheckedChange={checked =>
                              updatePref(category.id, channel.id, { enabled: checked })
                            }
                          />
                        </div>

                        {pref.enabled && (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`freq-${category.id}-${channel.id}`}
                                className="text-xs text-muted-foreground w-20"
                              >
                                Frequency
                              </Label>
                              <Select
                                value={pref.frequency}
                                onValueChange={v =>
                                  updatePref(category.id, channel.id, { frequency: v })
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {FREQUENCIES.map(f => (
                                    <SelectItem key={f.value} value={f.value}>
                                      {f.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label
                                  htmlFor={`quiet-start-${category.id}-${channel.id}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Quiet Start
                                </Label>
                                <Input
                                  id={`quiet-start-${category.id}-${channel.id}`}
                                  type="time"
                                  value={pref.quietHoursStart}
                                  onChange={e =>
                                    updatePref(category.id, channel.id, {
                                      quietHoursStart: e.target.value,
                                    })
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor={`quiet-end-${category.id}-${channel.id}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Quiet End
                                </Label>
                                <Input
                                  id={`quiet-end-${category.id}-${channel.id}`}
                                  type="time"
                                  value={pref.quietHoursEnd}
                                  onChange={e =>
                                    updatePref(category.id, channel.id, {
                                      quietHoursEnd: e.target.value,
                                    })
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
