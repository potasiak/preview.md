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

import copy from 'copy-to-clipboard';
import { Github, Horizontal, Vertical } from './icons.jsx';
import classNames from 'classnames';


export const App = () => {
  const [ content, setContent ] = React.useState(defaultContent);
  const [ scrollSync, setScrollSync ] = React.useState(true);
  const [ orientation, setOrientation ] = React.useState(() => {
    let value = localStorage.getItem('orientation');
    if (value !== 'horizontal' && value !== 'vertical') {
      localStorage.removeItem('orientation');
      value = innerWidth >= innerHeight ? 'horizontal' : 'vertical';
    }
    return value;
  });
  const [ markdownCopied, setMarkdownCopied ] = React.useState(null);
  const [ htmlCopied, setHtmlCopied ] = React.useState(null);

  const handleChangeScrollSync = (e) => setScrollSync(e.target.checked);

  const handleToggleOrientation = () => setOrientation(prevOrientation => {
    const newOrientation = prevOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    localStorage.setItem('orientation', newOrientation);
    return newOrientation;
  });

  const copyMarkdown = () => {
    copy(content);
    const timeoutId = setTimeout(() => setMarkdownCopied(null), 3000);
    setMarkdownCopied(prevTimeoutId => {
      if (prevTimeoutId !== null) {
        clearTimeout(prevTimeoutId);
      }
      return timeoutId;
    });
  };

  const copyHTML = () => {
    const htmlContent = document.getElementsByClassName('markdown-body')[0];
    copy(htmlContent.outerHTML, { format: 'text/html' });
    const timeoutId = setTimeout(() => setHtmlCopied(null), 3000);
    setHtmlCopied(prevTimeoutId => {
      if (prevTimeoutId !== null) {
        clearTimeout(prevTimeoutId);
      }
      return timeoutId;
    });
  };

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

      const PreTag = ({ children }) => <React.Fragment>{children}</React.Fragment>;
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
      <header className="bg-white shadow">
        <nav className="flex justify-between align-center px-6 py-4 gap-6 bg-gray-900 text-white">
          <Link className="font-medium text-gray-100 hover:text-blue-400" to="/">
            Markdown Preview
          </Link>
          <div className="flex align-center gap-4 ms-auto">
            <div className="flex align-center gap-2">
              <input type="checkbox" id="id_scrollSync" className="hover:cursor-pointer" checked={scrollSync}
                     onChange={handleChangeScrollSync} />
              <label htmlFor="id_scrollSync"
                     className="text-sm font-semibold hover:text-blue-400 hover:cursor-pointer active:text-blue-300 py-0.5">
                Scroll sync
              </label>
            </div>
            <button
              type="button"
              className="text-white text-sm font-semibold hover:text-blue-400 active:text-blue-300"
              title="Change orientation"
              onClick={handleToggleOrientation}
            >
              {orientation === 'vertical' ? (
                <Horizontal className="w-4 h-4 my-1" />
              ) : (
                <Vertical className="w-4 h-4 my-1" />
              )}
            </button>
            <div className="group relative">
              <button
                type="button"
                className="text-white text-sm font-semibold hover:text-blue-400 active:text-blue-300"
                onClick={copyMarkdown}
              >
                Copy Markdown
              </button>
              <span className={classNames(
                markdownCopied !== null ? 'opacity-100' : 'opacity-0',
                'transition-opacity',
                'bg-green-300',
                'px-2',
                'py-1',
                'text-sm',
                'text-green-900',
                'shadow',
                'rounded-md',
                'absolute',
                'left-1/2',
                '-translate-x-1/2',
                'translate-y-full',
                'mx-auto'
              )}>
                Copied!
              </span>
            </div>
            <div className="group relative">
              <button
                type="button"
                className="text-white text-sm font-semibold hover:text-blue-400 active:text-blue-300"
                onClick={copyHTML}
              >
                Copy HTML
              </button>
              <span className={classNames(
                htmlCopied !== null ? 'opacity-100' : 'opacity-0',
                'transition-opacity',
                'bg-green-300',
                'px-2',
                'py-1',
                'text-sm',
                'text-green-900',
                'shadow',
                'rounded-md',
                'absolute',
                'left-1/2',
                '-translate-x-1/2',
                'translate-y-full',
                'mx-auto'
              )}>
                Copied!
              </span>
            </div>
            <a href="https://github.com/potasiak/preview.md" title="preview.md on Github">
              <Github className="w-4 h-4 my-1" />
            </a>
          </div>
        </nav>
      </header>
      <ScrollSync enabled={scrollSync}>
        <main className={classNames('flex', 'flex-1', 'gap-4', 'p-4', 'overflow-hidden', orientation === 'vertical' ? 'flex-col' : 'flex-row')}>
          <ScrollSyncPane>
            <div className="box-border flex flex-col flex-1 rounded-md shadow overflow-y-scroll">
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
            <div className="box-border flex flex-col flex-1 rounded-md shadow px-4 py-2 bg-white overflow-y-scroll">
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
