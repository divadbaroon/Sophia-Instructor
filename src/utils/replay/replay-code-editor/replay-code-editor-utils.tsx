import { EditorView } from '@codemirror/view'

// Generate template for only the current active method
export const generateCurrentMethodTemplate = (
  methodsCode: Record<string, string>, 
  activeMethodId: string
): string => {
  if (!activeMethodId || !methodsCode[activeMethodId]) {
    return ''
  }
  
  return methodsCode[activeMethodId].trim()
}

// Custom extension for font size
export const createFontSizeExtension = (fontSize: number) => {
  return EditorView.theme({
    "&": {
      fontSize: `${fontSize}px`
    }
  })
}