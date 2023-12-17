import React from 'react';
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';

import { defaultContent, rehypeSanitizeOptions } from './config.js';

import 'github-markdown-css/github-markdown-light.css';

import remarkGfm from 'remark-gfm';

import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGemoji from 'remark-gemoji';


const defaultState = {
  fileName: 'preview.md',
  content: defaultContent,
};

export const App = () => {
  const [ state, setState ] = React.useState(defaultState);
  const handleChangeContent = (e) => setState(prevState => ({
    ...prevState,
    content: e.target.value,
  }));

  return (
    <React.Fragment>
      <header className="flex bg-gray-200 px-4 py-2 justify-center">
        <Link className="font-medium hover:underline" to="/">
          Markdown Preview
        </Link>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <div className="box-border flex flex-col p-4 basis-1/2 shrink-0 grow-0">
          <textarea
            className="flex-1 font-mono text-sm resize-none rounded-md border py-1.5 px-2 text-gray-900 placeholder:text-gray-400"
            placeholder="Enter your Markdown content here..."
            value={state.content}
            onChange={handleChangeContent}
          />
        </div>
        <div className="box-border flex flex-col p-4 basis-1/2 shrink-0 grow-0 overflow-y-scroll">
          <Markdown
            className="markdown-body"
            remarkPlugins={[ remarkGfm, remarkGemoji ]}
            rehypePlugins={[
              rehypeRaw,
              rehypeSanitize(rehypeSanitizeOptions)
            ]}
          >
            {state.content}
          </Markdown>
        </div>
      </main>
    </React.Fragment>
  );
};
