import { basicSetup, EditorView } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// 색상은 CSS 변수로 지정하므로 블로그의 밝은/어두운 테마를 즉시 따라갑니다.
export function createEditor(parent: HTMLElement, code: string, descriptionId: string) {
  return new EditorView({
    parent, doc: code,
    extensions: [
      basicSetup, python(), EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': 'Python 코드', 'aria-describedby': descriptionId }),
      EditorView.theme({
        '&': { color: 'var(--text)', backgroundColor: 'var(--bg)', fontSize: '13px' },
        '.cm-scroller': { fontFamily: '"SFMono-Regular", Consolas, monospace', lineHeight: '1.8', overflow: 'auto', maxHeight: '420px' },
        '.cm-content': { padding: '16px 0', minHeight: '180px', caretColor: 'var(--text)' },
        '.cm-line': { padding: '0 16px' },
        '.cm-gutters': { backgroundColor: 'var(--bg)', color: 'var(--muted)', borderRight: '1px solid var(--line)' },
        '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--surface)' },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: 'var(--python-selection)' },
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text)' },
        '.cm-tooltip, .cm-panels': { backgroundColor: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--line)' },
      }),
      syntaxHighlighting(HighlightStyle.define([
        { tag: tags.keyword, color: 'var(--python-keyword)' },
        { tag: [tags.string, tags.special(tags.string)], color: 'var(--python-string)' },
        { tag: [tags.number, tags.bool, tags.null], color: 'var(--python-number)' },
        { tag: tags.comment, color: 'var(--muted)', fontStyle: 'italic' },
        { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: 'var(--python-function)' },
      ])),
    ],
  });
}
