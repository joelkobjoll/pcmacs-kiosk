import { useSettings } from '@/features/settings/hooks/use-settings';
import { Button } from '@/shared/components/ui/button';
import { MonitorPlay, Plus } from 'lucide-react';
import { useState } from 'react';
import { AddSlideForm } from '../components/add-slide-form';
import { EditSlideForm } from '../components/edit-slide-form';
import { SlideCard } from '../components/slide-card';
import { useAddSlide } from '../hooks/use-add-slide';
import { useEditSlide } from '../hooks/use-edit-slide';
import { usePlaylist } from '../hooks/use-playlist';

export function PlaylistPage() {
  const {
    slides,
    isLoading,
    toggleActive,
    removeSlide,
    updateDuration,
    updateTransition,
    moveUp,
    moveDown,
    reload,
  } = usePlaylist();
  const { settings } = useSettings();
  const { addSlide, isLoading: isAdding } = useAddSlide(reload);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);
  const { editSlide, isLoading: isEditing } = useEditSlide(() => {
    reload();
    setEditingSlideId(null);
    // optimistic-style: also close immediately
  });

  const totalDurationS = Math.round(
    slides.reduce((acc, s) => acc + (s.isActive ? s.durationMs : 0), 0) / 1000,
  );

  const editingSlide = slides.find((s) => s.id === editingSlideId) ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-white">Active Playlist</h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            {slides.length} slides · ~{totalDurationS}s total
          </p>
        </div>
        <Button
          onClick={() => {
            setShowAddForm(true);
            setEditingSlideId(null);
          }}
          disabled={showAddForm}
        >
          <Plus className="w-4 h-4" />
          Add Slide
        </Button>
      </div>

      {showAddForm && (
        <AddSlideForm
          defaultDurationSeconds={(settings?.defaultDurationMs ?? 5000) / 1000}
          defaultTransition={settings?.defaultTransition ?? 'fade'}
          isLoading={isAdding}
          onSubmit={async (data) => {
            const slide = await addSlide(data);
            if (slide) setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingSlide && (
        <EditSlideForm
          slide={editingSlide}
          isLoading={isEditing}
          onSubmit={(data) => editSlide(editingSlide.id, data)}
          onCancel={() => setEditingSlideId(null)}
        />
      )}

      <div className="space-y-3">
        {slides.map((slide, index) => (
          <SlideCard
            key={slide.id}
            slide={slide}
            index={index}
            total={slides.length}
            onToggleActive={toggleActive}
            onRemove={removeSlide}
            onDurationChange={updateDuration}
            onTransitionChange={updateTransition}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            onEdit={(id) => {
              setEditingSlideId(id === editingSlideId ? null : id);
              setShowAddForm(false);
            }}
          />
        ))}

        {slides.length === 0 && (
          <div className="text-center py-16 bg-neutral-900 border border-neutral-800 border-dashed rounded-xl">
            <MonitorPlay className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
            <h3 className="text-base font-medium text-neutral-400 mb-1">Playlist is empty</h3>
            <p className="text-sm text-neutral-500">Add slides to start playing on the display.</p>
          </div>
        )}
      </div>
    </div>
  );
}
