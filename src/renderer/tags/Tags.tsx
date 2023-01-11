/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useState, useEffect } from 'react';
import './Tags.css';

function Tags({
  tagsUpdate,
  tagsMostLikley,
  tagsLessLikley,
  initSelectedTags,
}) {
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
    <>
      <details open={tagsMostLikley.length > 0}>
        <summary>
          <h3 className="mostLikely">
            Most likely descriptions of the bug
            <p className="padgetDescription"> {tagsMostLikley.length}</p>
          </h3>
        </summary>
        <div className="tags">
          {tagsMostLikley.map((tag) => (
            <div
              className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
              onClick={() => updateTags(tag)}
              key={tag}
              role="button"
            >
              {tag}
            </div>
          ))}
          {tagsMostLikley.length === 0 && (
            <p className="noTags">No descriptions found</p>
          )}
        </div>
      </details>
      <details open={tagsLessLikley.length > 0 && tagsMostLikley.length === 0}>
        <summary>
          <h3 className="lessLikely">
            Less likely descriptions of the bug
            <p className="padgetDescription"> {tagsLessLikley.length}</p>
          </h3>
        </summary>
        <div className="tags">
          {tagsLessLikley.map((tag) => (
            <div
              className={`tag ${selectedTags.includes(tag) && 'selected'}`}
              onClick={() => updateTags(tag)}
              key={tag}
              role="button"
            >
              {tag}
            </div>
          ))}
          {tagsLessLikley.length === 0 && (
            <p className="noTags">No descriptions found</p>
          )}
        </div>
      </details>
    </>
  );
}

export default Tags;
