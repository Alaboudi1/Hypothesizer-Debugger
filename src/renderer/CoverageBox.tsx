import React from 'react'
import { Box, Typography } from '@mui/material'
import Highlight, { defaultProps } from 'prism-react-renderer'
import theme from 'prism-react-renderer/themes/nightOwl'
import './CoverageBox.css'
const styles = {
  bgcolor: 'background.paper',
  borderColor: 'text.primary',
  border: 2,
  marginTop: '1rem',
  width: '30vw',
  padding: '0rem 1rem 0rem 0rem',
  alignSelf: 'center',
  borderRadius: 1,
}

type InfoListProps = {
  coverage: string[]
  startLine: number
}
const getEditpr = (content: string, startLine: number) => (
  <Highlight {...defaultProps} theme={theme} code={content} language="jsx">
    {({ className, style, tokens, getLineProps, getTokenProps }) => (
      <pre className={className} style={style}>
        {tokens.map((line, i) => (
          <div key={i} {...getLineProps({ line, key: i })} className="line">
            <span className="lineNo">{i + startLine}</span>
            <span className="lineContent">
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </span>
          </div>
        ))}
      </pre>
    )}
  </Highlight>
)

const CoverageBox: React.FC<InfoListProps> = (props: { coverage: string[]; startLine: number }): React.ReactElement => {
  const content = props.coverage.join('\n').trim()
  return (
    <Box sx={styles}>
      <Typography variant="button" display="block" component="div" fontWeight={700} style={{ margin: '1rem 0rem 0.5rem 0rem', padding: '0rem 0rem 0rem 1rem' }}>
        Coverage :
      </Typography>
      <pre>{getEditpr(content, props.startLine)}</pre>
    </Box>
  )
}

export default CoverageBox
