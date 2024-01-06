import React from 'react';
import { Link } from 'react-router-dom';

import { defaultContent, rehypeSanitizeOptions } from './config.js';

import 'github-markdown-css/github-markdown-light.css';

import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGemoji from 'remark-gemoji';

import rangeParser from 'parse-numeric-range';
import { Prism } from 'react-syntax-highlighter';
import './prism-github.scss';

import { EditorView } from '@uiw/react-codemirror';
import { languages } from '@codemirror/language-data';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { githubLight } from '@uiw/codemirror-theme-github';

import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync/src';

import copy from 'copy-to-clipboard';
import { Markdown as MarkdownLogo, Github, Horizontal, Vertical, List } from './icons.jsx';
import classNames from 'classnames';
import rehypeExternalLinks from 'rehype-external-links';


const CodeMirror = React.lazy(() => import('@uiw/react-codemirror'));
const Markdown = React.lazy(() => import('react-markdown'));


function getLocalStorage(key, defaultValue = null) {
  const storedValue = localStorage.getItem(key);
  return storedValue !== null ? storedValue : defaultValue;
}

function getLocalStorageBool(key, defaultValue = false) {
  const storedValue = localStorage.getItem(key);
  return storedValue !== null ? storedValue === 'true' : defaultValue;
}


export const App = () => {
  const [ content, setContent ] = React.useState(() => getLocalStorage('content', defaultContent));
  const [ showMenu, setShowMenu ] = React.useState(false);
  const [ scrollSync, setScrollSync ] = React.useState(() => getLocalStorageBool('scrollSync', true));
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
  const [ save, setSave ] = React.useState(() => getLocalStorageBool('save', false));
  const [ saveState, setSaveState ] = React.useState(null);

  const handleToggleMenu = () => setShowMenu(prevState => !prevState);

  const handleChangeSave = (e) => setSave(e.target.checked);

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

  React.useEffect(() => {
    if (scrollSync) {
      localStorage.setItem('scrollSync', 'true');
    } else {
      localStorage.setItem('scrollSync', 'false');
    }
  }, [ scrollSync ]);

  React.useEffect(() => {
    if (!save) {
      localStorage.removeItem('content');
      localStorage.removeItem('save');
      return;
    }
    localStorage.setItem('save', 'true');
    setSaveState(prevState => {
      if (prevState !== null && prevState !== 'saving' && prevState !== 'saved') {
        clearTimeout(prevState);
      }
      return 'saving';
    });
    localStorage.setItem('content', content);
    const timeoutId = setTimeout(() => setSaveState('saved'), 3000);
    setSaveState(timeoutId);
  }, [ content, save ]);

  const SaveElement = React.useCallback(() => {
    switch (saveState) {
      case 'saving':
        return <span className="text-blue-300 py-0.5">Saving...</span>;
      case null:
      case 'saved':
        return (
          <React.Fragment>
            <input
              type="checkbox"
              id="id_save"
              className="hover:cursor-pointer w-4 md:w-auto"
              checked={save}
              onChange={handleChangeSave}
            />
            <label
              htmlFor="id_save"
              className="hover:text-blue-400 hover:cursor-pointer active:text-blue-300 py-2 md:py-0.5"
            >
              Save
            </label>
          </React.Fragment>
        );
      default:
        return <span className="text-green-500 py-0.5">Saved!</span>;
    }
  }, [ saveState, save ]);

  return (
    <React.Fragment>
      <header className="bg-white shadow">
        <nav
          className="flex flex-col md:flex-row justify-between align-center px-6 py-4 md:gap-6 bg-gray-900 text-white">
          <div className="flex flex-1 md:flex-none">
            <Link className="font-medium text-gray-100 hover:text-blue-400 flex gap-2" to="/">
              <MarkdownLogo className="w-6 h-6" />
              Markdown Preview
            </Link>
            <button type="button" className="md:hidden ms-auto" onClick={handleToggleMenu}>
              <List className="w-6 h-6" />
            </button>
          </div>
          <div className={classNames(
            showMenu || 'hidden',
            'md:flex',
            'align-center',
            'gap-4',
            'md:me-auto',
            'mt-4',
            'md:mt-0'
          )}>
            <div className="group relative mb-2 md:mb-0">
              <button
                type="button"
                className="text-white text-sm font-semibold hover:text-blue-400 active:text-blue-300 py-2 md:py-0"
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
            <div className="group relative mb-2 md:mb-0">
              <button
                type="button"
                className="text-white text-sm font-semibold hover:text-blue-400 active:text-blue-300 py-2 md:py-0"
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
          </div>
          <div className={classNames(
            showMenu || 'hidden',
            'md:flex',
            'align-center',
            'gap-4',
            'md:ms-auto',
            'mt-4',
            'md:mt-0'
          )}>
            <div className="flex align-center gap-2 text-sm font-semibold mb-2 md:mb-0">
              <SaveElement />
            </div>
            <div className="flex align-center gap-2 mb-2 md:mb-0">
              <input type="checkbox" id="id_scrollSync" className="hover:cursor-pointer w-4 md:w-auto"
                     checked={scrollSync}
                     onChange={handleChangeScrollSync} />
              <label htmlFor="id_scrollSync"
                     className="text-sm font-semibold hover:text-blue-400 hover:cursor-pointer active:text-blue-300 py-2 md:py-0.5">
                Scroll sync
              </label>
            </div>
            <button
              type="button"
              className="text-white text-sm font-semibold hover:text-blue-400 active:text-blue-300 flex gap-2 align-center mb-2 md:mb-0 py-2 md:py-0"
              title="Change orientation"
              onClick={handleToggleOrientation}
            >
              {orientation === 'vertical' ? (
                <Horizontal className="w-4 h-4 my-1" />
              ) : (
                <Vertical className="w-4 h-4 my-1" />
              )}
              <span className="md:hidden py-0.5">Change orientation</span>
            </button>
            <a href="https://github.com/potasiak/preview.md" title="preview.md on Github"
               className="flex gap-2 text-white hover:text-blue-400 active:text-blue-300 mb-2 md:mb-0 py-2 md:py-0">
              <Github className="w-4 h-4 my-1" />
              <span className=" text-sm font-semibold md:hidden py-0.5">Source on Github</span>
            </a>
          </div>
        </nav>
      </header>
      <ScrollSync enabled={scrollSync}>
        <main
          className={classNames('flex', 'flex-1', 'gap-4', 'p-4', 'overflow-hidden', orientation === 'vertical' ? 'flex-col' : 'flex-row')}
        >
          <ScrollSyncPane>
            <div className="box-border flex flex-col flex-1 rounded-md shadow overflow-y-scroll" data-nosnippet={true}>
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
            <div className="box-border flex flex-col flex-1 rounded-md shadow px-4 py-2 bg-white overflow-y-scroll" data-nosnippet={true}>
              <Markdown
                className="markdown-body"
                components={markdownComponents}
                remarkPlugins={[ remarkGfm, remarkGemoji ]}
                rehypePlugins={[
                  [ rehypeExternalLinks, { rel: [ 'nofollow', 'noopener', 'noreferer' ] } ],
                  rehypeRaw,
                  [ rehypeSanitize, rehypeSanitizeOptions ],
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
