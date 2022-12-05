/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useState, useEffect } from 'react';
import './Tags.css';

function Tags({ tagsUpdate, tags, initSelectedTags }) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initSelectedTags);

  useEffect(() => {
    tagsUpdate(selectedTags);
  }, [selectedTags]);

  const updateTags = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="tags">
      {tags.map((tag) => (
        <div
          className={`tag ${selectedTags.includes(tag) && 'selected'}`}
          onClick={() => updateTags(tag)}
          key={tag}
          role="button"
        >
          {tag}
        </div>
      ))}
    </div>
  );
}

export default Tags;
