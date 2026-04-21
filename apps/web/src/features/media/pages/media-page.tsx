import { MediaCard } from '../components/media-card';
import { UploadZone } from '../components/upload-zone';
import { useMedia } from '../hooks/use-media';

export function MediaPage() {
  const { items, isLoading, isUploading, uploadFile, removeItem } = useMedia();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <UploadZone isUploading={isUploading} onFileSelect={uploadFile} />

      <section>
        <h3 className="text-base font-semibold text-white mb-4">
          Local Library{' '}
          <span className="text-neutral-500 font-normal text-sm">({items.length} files)</span>
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} onRemove={removeItem} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
