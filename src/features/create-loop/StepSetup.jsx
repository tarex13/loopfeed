import { useState } from 'react';
import { useCreateLoopStore } from './useCreateLoopStore';

export default function StepSetup() {
  const { title, tagline, tags, autoplay, isRemix, setField } = useCreateLoopStore();
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag) => {
    const cleanTag = tag.trim();
    if (!cleanTag) return;

    let newTags = [...tags, cleanTag.toLowerCase()];
    newTags = [...new Set(newTags)]; // remove duplicates

    if (newTags.length > 10) {
      alert('You can only add up to 10 tags.');
      return;
    }
    setField('tags', newTags);
    setInputValue('');
  };

  const removeTag = (tagToRemove) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setField('tags', newTags);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    paste.split(',').forEach((t) => addTag(t));
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left">
      {/* Loop Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Loop Title *</label>
        <input
          type="text"
          required
          className="w-full px-4 py-2 rounded border focus:ring focus:outline-none"
          value={title}
          maxLength={40}
          disabled={isRemix}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Give your loop a mood, a name, a vibe…"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border rounded">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-black text-black dark:bg-white dark:text-zinc-700 px-2 py-0.5 rounded-full text-xs font-medium hover:bg-blue-200 transition"
            >
              {tag}
              <button
                type="button"
                className="text-blue-500 dark:text-zinc-700 hover:text-red-500 focus:outline-none"
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="flex-grow min-w-[100px] p-1 focus:outline-none text-sm"
            placeholder={tags.length < 10 ? "Type and press Enter" : ""}
            disabled={tags.length >= 10}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Max 10 tags.</p>
      </div>

      {/* Tagline */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Loop TagLine (short Description) *
        </label>
        <input
          type="text"
          required
          className="w-full px-4 py-2 rounded border focus:ring focus:outline-none"
          value={tagline || ''}
          onChange={(e) => setField('tagline', e.target.value)}
          placeholder="Give your loop a short description. It's the first thing people see."
        />
      </div>

      {/* Autoplay */}
      <div className="flex items-center gap-2 mt-4">
        <input
          type="checkbox"
          checked={autoplay}
          onChange={(e) => setField('autoplay', e.target.checked)}
          id="autoplay"
        />
        <label htmlFor="autoplay" className="text-sm text-gray-700 dark:text-gray-300">
          Autoplay loop on view
        </label>
      </div>
    </div>
  );
}
