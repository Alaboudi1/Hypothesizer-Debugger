import React from 'react'
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { Filter, HypoTimelineItem } from '../scripts/types'

const styles = {
  bgcolor: 'background.paper',
  borderColor: 'text.primary',
  border: 2,
  width: '30vw',
  padding: '0rem 0rem 1rem 1rem',
  alignSelf: 'center',
  borderRadius: 1,
}

type FiltersProps = {
  timeline: { data?: HypoTimelineItem[]; filters: Filter[] }
  setTimeline: React.Dispatch<
    React.SetStateAction<{
      data?: HypoTimelineItem[]
      filters: Filter[]
    }>
  >
}

const Filters: React.FC<FiltersProps> = ({ timeline, setTimeline }): React.ReactElement => {
  const content: JSX.Element[] = []
  const newFilters: Filter[] = [...timeline.filters]
  timeline.filters.forEach((filter, i) => {
    content.push(
      <FormControlLabel
        control={
          <Checkbox
            checked={filter.enabled}
            onChange={(e) => {
              console.log(e)
              const flippedFilter = { ...filter }
              flippedFilter.enabled = !flippedFilter.enabled
              newFilters[newFilters.indexOf(filter)] = flippedFilter
              setTimeline({ data: timeline.data, filters: newFilters })
            }}
          />
        }
        label={filter.condition}
        key={i}
      />,
    )
  })
  if (content === []) return <></>
  return (
    <Box sx={styles}>
      <Typography variant="button" display="block" component="div" fontWeight={700} style={{ margin: '1rem 0rem 1rem' }}>
        Filters
      </Typography>
      {content}
    </Box>
  )
}

export default Filters
