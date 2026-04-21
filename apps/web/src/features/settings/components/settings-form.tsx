import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import type { Settings, TransitionType } from '@/shared/types/api';
import { Eye, EyeOff, Globe, KeyRound, RefreshCw, Save } from 'lucide-react';
import { type FormEvent, useState } from 'react';

const TRANSITIONS: TransitionType[] = [
  'fade',
  'slide-left',
  'slide-right',
  'slide-up',
  'zoom-fade',
  'ken-burns',
];

interface SettingsFormProps {
  settings: Settings;
  onSave: (partial: Partial<Settings>) => void;
}

export function SettingsForm({ settings, onSave }: SettingsFormProps) {
  const [durationS, setDurationS] = useState(settings.defaultDurationMs / 1000);
  const [transition, setTransition] = useState<TransitionType>(settings.defaultTransition);
  const [autoReload, setAutoReload] = useState(settings.autoReload);
  const [offlineFallback, setOfflineFallback] = useState(settings.offlineFallback);
  const [googleApiKey, setGoogleApiKey] = useState(settings.googleApiKey ?? '');
  const [showApiKey, setShowApiKey] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({
      defaultDurationMs: durationS * 1000,
      defaultTransition: transition,
      autoReload,
      offlineFallback,
      googleApiKey,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="duration">Default Slide Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={durationS}
              onChange={(e) => setDurationS(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transition">Default Transition</Label>
            <Select
              id="transition"
              value={transition}
              onChange={(e) => setTransition(e.target.value as TransitionType)}
            >
              {TRANSITIONS.map((t) => (
                <option key={t} value={t}>
                  {t.replace('-', ' ')}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleApiKey" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Google API Key
            </Label>
            <div className="relative">
              <Input
                id="googleApiKey"
                type={showApiKey ? 'text' : 'password'}
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                placeholder="AIza…"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Required for Google Slides integration. Leave blank if unused.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-neutral-950 p-5 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-300">Auto-Reload Player</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Refresh display when playlist changes
                </p>
              </div>
            </div>
            <Switch checked={autoReload} onCheckedChange={setAutoReload} />
          </div>

          <div className="flex items-center justify-between bg-neutral-950 p-5 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-300">Offline Fallback</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Keep cached media if network drops
                </p>
              </div>
            </div>
            <Switch checked={offlineFallback} onCheckedChange={setOfflineFallback} />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-800 flex justify-end">
        <Button type="submit">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </form>
  );
}
