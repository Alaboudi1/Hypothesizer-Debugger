/*  These interfaces define the types that are used in the frontend, after
*   processing (source mapping, format transformation, fetching coverage, etc). 

*   These types are reflect the requirements of the frontend. As the data requirements 
*   of the frontend change, so may these interfaces. 
*/

import { TimelineItemModel } from "react-chrono/dist/models/TimelineItemModel";
import { Media } from "react-chrono/dist/models/TimelineMediaModel";

export interface TraceWithMapping {
    events:  Event[];
    profile: Profile[];
    trace:   TraceElement[];
}

export interface Event {
    type:           "attributes" | "childList" | "click" | "keydown"; // type parameter determines EventType. SubInterfaces define additional event type specific attributes
    coverage:       string[] | null;
    startPosition:  Position | null;
    endPosition:    Position | null;
    location:       Location | null;
    state:          State;
    timestamp:      number;
    value?:          string; // srcElement : {value: "", tagName: ""} unpacked
    tagName?:        string;
}

export interface AttributesEvent extends Event {
    addNode:       Location[];
    removeNode:    Location[];
    attributeName: string;
}

export interface KeydownEvent extends Event {
    target:        string;
    key:           string;
}

export interface ClickEvent extends Event {
    target:        string;
}

export interface ChildListEvent extends Event {
    addNode:       Location[];
    removeNode:    Location[];
}

export interface Profile {
    lineBundleStart: number;
    lineBundleEnd:   number;
    startPosition:   Position;
    endPosition:     Position;
    coverage:        string[];
    callFrame:       CallFrame;
    children?:       number[];
    hitCount:        number;
    id:              number;
    functionName:    string;
    positionTicks?:  PositionTick[];
}

export interface TraceElement {
    lineBundleStart: number;
    lineBundleEnd:   number;
    startPosition:   Position;
    endPosition:     Position;
    coverage:        string[];
    functionName:    string;
    isBlockCoverage: boolean;
    ranges:          Range[];
    url:             string;
    timestamp:       number;
    id?:             number;
}

export interface Position {
    line:   number;
    source: string;
    column?: number;
    name?:   null;
}

export interface Location {
    fileName:      string;
    lineNumber:    number;
    columnNumber:  number;
    functionName:  string | "Anononymous Function";
}

export interface State {
    hooks: Hook[];
    props: Prop[];
}

export interface Hook {
    id:              number;
    isStateEditable: boolean;
    name:            "Effect" | "State";
    value?:          ValueElement[] | string;
    subHooks:        Hook[];
    hookstring:      Location;
}

export interface ValueElement {
    title: string;
    id:    number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Prop {
    // unknown
    // TODO: Test application with props and generate Prop type's attributes
}

export interface CallFrame {
    columnNumber: number;
    functionName: string;
    lineNumber:   number;
    scriptId:     string;
    url:          string;
}

export interface PositionTick {
    line:  number;
    ticks: number;
}

export interface Range {
    count:       number;
    endOffset:   number;
    startOffset: number;
}

export interface HypoTimelineItem extends TimelineItemModel {
    coverage?: string[]
    active?: boolean;
    cardDetailedText?: string | string[];
    cardSubtitle?: string;
    cardTitle?: string;
    id?: string;
    media?: Media;
    position?: string;
    title?: string;
    url?: string;
    src: string | undefined;
    visible?: boolean;
    timestamp?: string;
}

export interface TimelineItem {
    coverage?: string[]
    detailedText?: string;
    index: string;
    title: string;
    icon?: string;
    type: "event" | "state" | "trace" | string;
    url?: string;
    timestamp: string;
}

export type Filter = {
    filterBy: "filename" | "type";
    condition: string;
    enabled: boolean;
}