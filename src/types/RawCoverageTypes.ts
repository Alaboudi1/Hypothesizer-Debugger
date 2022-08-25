import { TraceMap } from '@jridgewell/trace-mapping'
import { State } from './finalTypes'

export interface ProfilerOutput {
  trace: ProfilerOutputTraceElement[]
  profile?: ProfilerOutputProfileElement[]
  bundleAndMap: bundleAndMap[]
  allFiles: {
    url: string
    content: string
  }[]
  newtworkCoverage: NewtworkCoverage[]
}

export type bundleAndMap = [file: string, sourceMap: TraceMap]

export interface ProfilerOutputProfileElement {
  callFrame: {
    columnNumber: number
    functionName: string
    lineNumber: number
    scriptId: string
    url: string
  }
  children?: number[]
  hitCount: number
  id: number
  functionName: string
  positionTicks?: {
    line: number
    ticks: number
  }[]
}

export interface ProfilerOutputTraceElement {
  functionName: string
  isBlockCoverage: boolean
  ranges: {
    count: number
    endOffset: number
    startOffset: number
  }[]
  url: string
  timestamp: number
}

export type TemporaryEventType = {
  state: State
  target?: string // "text" | "submit" | "button";
  type: string
  location: {
    fileName: string
    lineNumber: number
    columnNumber: number
  }
  srcElement?: {
    value: string
    tagName: string // "BUTTON" | "INPUT"
  }
  timestamp: number
  key?: string
  addNode?: Location[]
  removeNode?: Location[]
  attributeName?: null | string
  value?: string
  tagName?: string // "BUTTON" | "INsPUT"
}

export type NewtworkCoverage = {
  url: string
  content: string
  contentType: string
  timestamp: number
  status: number
  requestType: string
}
