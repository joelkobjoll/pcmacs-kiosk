export type SlideSourceType =
  | 'image'
  | 'video'
  | 'youtube'
  | 'google_slides'
  | 'website';
export type TransitionType =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'zoom-fade'
  | 'ken-burns';

export interface ApiErrorResponse {
  error: string;
}
