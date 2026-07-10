import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

export type MarkdownEditorProps = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly height?: number
}

export function MarkdownEditor({ value, onChange, height = 430 }: MarkdownEditorProps) {
  return (
    <div className="markdown-shell" data-color-mode="light">
      <MDEditor value={value} height={height} preview="edit" onChange={(nextValue) => onChange(nextValue ?? '')} />
    </div>
  )
}
