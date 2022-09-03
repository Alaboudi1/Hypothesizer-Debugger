import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const getKnowledgeFromURL = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};

const getKnowledgeFromLocalFile = async (url: string) => {
  const response = await fs.readFile(path.join(url, 'hypotheses.json'), 'utf8');
  return response;
};

const getKnowledge = (urls: string[]) => {
  const knowledge = urls.map((url) => {
    if (url.startsWith('http')) {
      return getKnowledgeFromURL(url);
    }
    return getKnowledgeFromLocalFile(url);
  });
  return Promise.all(knowledge);
};

export default getKnowledge;
