import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Clock } from "lucide-react";

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
] as const;

export interface ScheduleValue {
  enabled: boolean;
  scheduleStart: string;
  scheduleEnd: string;
  scheduleDays: number[];
}

interface ScheduleFieldsProps {
  value: ScheduleValue;
  onChange: (value: ScheduleValue) => void;
}

export function ScheduleFields({ value, onChange }: ScheduleFieldsProps) {
  function toggleEnabled(enabled: boolean) {
    onChange({
      ...value,
      enabled,
      scheduleDays:
        enabled && value.scheduleDays.length === 0 ? [] : value.scheduleDays,
    });
  }

  function toggleDay(day: number) {
    const next = value.scheduleDays.includes(day)
      ? value.scheduleDays.filter((d) => d !== day)
      : [...value.scheduleDays, day];
    onChange({ ...value, scheduleDays: next });
  }

  return (
    <div className="col-span-2 border border-neutral-700 rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-800/60 hover:bg-neutral-800 transition-colors"
        onClick={() => toggleEnabled(!value.enabled)}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
          <Clock className="w-4 h-4 text-blue-400" />
          Schedule (optional)
        </div>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation only */}
        <span onClick={(e) => e.stopPropagation()}>
          <Switch checked={value.enabled} onCheckedChange={toggleEnabled} />
        </span>
      </button>

      {value.enabled && (
        <div className="p-4 grid grid-cols-2 gap-4 bg-neutral-900/50">
          <div className="space-y-2">
            <Label htmlFor="scheduleStart">Show from</Label>
            <input
              id="scheduleStart"
              type="time"
              value={value.scheduleStart}
              onChange={(e) =>
                onChange({ ...value, scheduleStart: e.target.value })
              }
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduleEnd">Show until</Label>
            <input
              id="scheduleEnd"
              type="time"
              value={value.scheduleEnd}
              onChange={(e) =>
                onChange({ ...value, scheduleEnd: e.target.value })
              }
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Days of week</Label>
            <p className="text-xs text-neutral-500">
              Leave all unchecked to show every day
            </p>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d) => {
                const active = value.scheduleDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function defaultScheduleValue(): ScheduleValue {
  return {
    enabled: false,
    scheduleStart: "08:00",
    scheduleEnd: "20:00",
    scheduleDays: [],
  };
}

/** Convert ScheduleValue to API-ready fields (null when schedule not enabled) */
export function scheduleValueToApi(v: ScheduleValue): {
  scheduleStart: string | null;
  scheduleEnd: string | null;
  scheduleDays: number[] | null;
} {
  if (!v.enabled)
    return { scheduleStart: null, scheduleEnd: null, scheduleDays: null };
  return {
    scheduleStart: v.scheduleStart || null,
    scheduleEnd: v.scheduleEnd || null,
    scheduleDays: v.scheduleDays.length > 0 ? v.scheduleDays : null,
  };
}

/** Build a ScheduleValue from stored API data */
export function scheduleValueFromApi(
  scheduleStart: string | null,
  scheduleEnd: string | null,
  scheduleDays: number[] | null,
): ScheduleValue {
  const enabled = !!(scheduleStart || scheduleEnd || scheduleDays);
  return {
    enabled,
    scheduleStart: scheduleStart ?? "08:00",
    scheduleEnd: scheduleEnd ?? "20:00",
    scheduleDays: scheduleDays ?? [],
  };
}
