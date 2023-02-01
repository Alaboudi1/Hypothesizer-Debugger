/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useState, useEffect } from 'react';
import './Tags.css';

function Tags({ tagsUpdate, tags, initSelectedTags }) {
  const [selectedTags, setSelectedTags] =
    useState<{ tag: string; score: number }[]>(initSelectedTags);
  const tagsMostLikley = tags.filter(({ score }) => score === 1);
  const tagsLessLikley = tags.filter(({ score }) => score > 0.5 && score < 1);

  useEffect(() => {
    tagsUpdate(selectedTags);
  }, [selectedTags]);

  const updateTags = (tag: string, score: number) => {
    if (selectedTags.some((t) => t.tag === tag && t.score === score)) {
      // remove tag fomr selected tags
      setSelectedTags(
        selectedTags.filter((t) => t.tag !== tag || t.score !== score)
      );
    } else {
      setSelectedTags([...selectedTags, { tag, score }]);
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
          {tagsMostLikley.map(({ tag, score }) => (
            <div
              className={`tag ${
                selectedTags.find((t) => t.tag === tag && t.score === score) &&
                'selected'
              }`}
              onClick={() => updateTags(tag, score)}
              key={tag + score}
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
          {tagsLessLikley.map(({ tag, score }) => (
            <div
              className={`tag ${
                selectedTags.find((t) => t.tag === tag && t.score === score) &&
                'selected'
              }`}
              onClick={() => updateTags(tag, score)}
              key={tag + score}
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
