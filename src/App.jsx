import React from 'react';
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';

import { defaultContent, rehypeSanitizeOptions } from './config.js';

import 'github-markdown-css/github-markdown-light.css';

import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGemoji from 'remark-gemoji';

import rangeParser from 'parse-numeric-range';
import { Prism } from 'react-syntax-highlighter';
import './prism-github.scss';

import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { languages } from '@codemirror/language-data';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { githubLight } from '@uiw/codemirror-theme-github';

import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync/src';


export const App = () => {
  const [ content, setContent ] = React.useState(defaultContent);
  const [ scrollSync, setScrollSync ] = React.useState(true);

  const handleChangeScrollSync = (e) => setScrollSync(e.target.checked);

  const markdownComponents = {
    code({ node, inline, className, ...props }) {
      const hasLang = /language-(\w+)/.exec(className || '');
      const hasMeta = node?.data?.meta;

      const applyHighlights = (applyHighlights) => {
        if (hasMeta) {
          const RE = /{([\d,-]+)}/;
          const metadata = node.data.meta?.replace(/\s/g, '');
          const strlineNumbers = RE?.test(metadata)
            ? RE?.exec(metadata)[1]
            : '0';
          const highlight = rangeParser(strlineNumbers);
          const data = highlight.includes(applyHighlights)
            ? 'highlight'
            : null;
          return { data };
        } else {
          return {};
        }
      };

      const PreTag = ({ children }) => <React.Fragment>{children}</React.Fragment>
      const CodeTag = ({ children }) => <code className={className}>{children}</code>;

      return hasLang ? (
        <Prism
          language={hasLang[1]}
          PreTag={PreTag}
          CodeTag={CodeTag}
          showLineNumbers={false}
          wrapLines={hasMeta}
          useInlineStyles={false}
          lineProps={applyHighlights}
        >
          {props.children}
        </Prism>
      ) : (
        <CodeTag>{props.children}</CodeTag>
      );
    },
  };

  return (
    <React.Fragment>
      <header className="flex bg-gray-200 px-4 py-2">
        <Link className="font-medium hover:underline" to="/">
          Markdown Preview
        </Link>
        <div className="flex gap-2 ms-auto">
          <input type="checkbox" id="id_scrollSync" checked={scrollSync} onChange={handleChangeScrollSync} />
          <label htmlFor="id_scrollSync">Scroll sync</label>
        </div>
      </header>
      <ScrollSync enabled={scrollSync}>
        <main className="flex flex-1 overflow-hidden">
          <ScrollSyncPane>
            <div className="box-border flex flex-col basis-1/2 shrink-0 grow-0 overflow-y-scroll">
              <CodeMirror
                theme={githubLight}
                extensions={[
                  markdown({ base: markdownLanguage, codeLanguages: languages }),
                  EditorView.lineWrapping
                ]}
                value={content}
                onChange={setContent}
              />
            </div>
          </ScrollSyncPane>
          <ScrollSyncPane>
            <div className="box-border flex flex-col p-4 basis-1/2 shrink-0 grow-0 overflow-y-scroll">
              <Markdown
                className="markdown-body"
                components={markdownComponents}
                remarkPlugins={[ remarkGfm, remarkGemoji ]}
                rehypePlugins={[
                  rehypeRaw,
                  rehypeSanitize(rehypeSanitizeOptions)
                ]}
              >
                {content}
              </Markdown>
            </div>
          </ScrollSyncPane>
        </main>
      </ScrollSync>
    </React.Fragment>
  );
};
