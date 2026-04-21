import type { SlideSourceType, TransitionType } from '../../../shared/types.js';

export interface Slide {
  id: number;
  title: string;
  sourceType: SlideSourceType;
  url: string;
  durationMs: number;
  transitionIn: TransitionType;
  isActive: boolean;
  sortOrder: number;
  /** Number of slides in a Google Slides presentation (google_slides only) */
  slideCount: number;
  /** Duration per individual slide in ms (google_slides only) */
  slideDurationMs: number;
  /** YouTube playback start in seconds (youtube only, default 0) */
  ytStartSeconds: number;
  /** YouTube playback end in seconds. null = play to end and auto-advance (youtube only) */
  ytEndSeconds: number | null;
  /** Whether the video plays muted (youtube and video types). Default true. */
  muted: boolean;
  /** Optional URL for a QR code overlay shown during display. Any slide type. */
  qrUrl: string | null;
  /** Daily display window start "HH:MM" 24h. null = no restriction */
  scheduleStart: string | null;
  /** Daily display window end "HH:MM" 24h. null = no restriction */
  scheduleEnd: string | null;
  /** Days of week to show (0=Sun…6=Sat). null = every day */
  scheduleDays: number[] | null;
}

export interface CreateSlideInput {
  title: string;
  sourceType: SlideSourceType;
  url: string;
  /** Omit for youtube (auto-computed) and google_slides (computed from slideCount × slideDurationMs) */
  durationMs?: number;
  transitionIn: TransitionType;
  /** google_slides: number of slides in presentation */
  slideCount?: number;
  /** google_slides: ms per individual slide */
  slideDurationMs?: number;
  /** youtube: start playback at this second */
  ytStartSeconds?: number;
  /** youtube: stop at this second. null/undefined = play to end and auto-advance */
  ytEndSeconds?: number | null;
  /** youtube/video: mute the video. Default true */
  muted?: boolean;
  /** Optional URL to show as QR code overlay on the display */
  qrUrl?: string | null;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  scheduleDays?: number[] | null;
}

export interface UpdateSlideInput {
  title?: string;
  sourceType?: SlideSourceType;
  url?: string;
  durationMs?: number;
  transitionIn?: TransitionType;
  isActive?: boolean;
  slideCount?: number;
  slideDurationMs?: number;
  ytStartSeconds?: number;
  ytEndSeconds?: number | null;
  muted?: boolean;
  /** Optional URL to show as QR code overlay on the display */
  qrUrl?: string | null;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  scheduleDays?: number[] | null;
}

export interface ISlideRepository {
  findAll(): Slide[];
  findById(id: number): Slide | null;
  create(input: CreateSlideInput): Slide;
  update(id: number, input: UpdateSlideInput): Slide | null;
  remove(id: number): void;
  reorder(ids: number[]): void;
}
