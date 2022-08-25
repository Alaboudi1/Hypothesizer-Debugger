import { useState } from 'react';
import Timeline from './Timelines';
// import '../scripts/devtools'
// import Filters from './Filters'
// import CoverageBox from './CoverageBox'
import { HypoTimelineItem } from '../scripts/types';

const InformationPanel = ({
  trace,
}: {
  trace: HypoTimelineItem[];
}): JSX.Element => {
  const [timeline, setTimeline] = useState<any[]>([]);

  const getTimeLine = (): JSX.Element => {
    console.log(trace, 'timeline');
    return (
      <Timeline
        trace={trace}
        setCoverage={(e: any) => {
          console.log(e);
        }}
        filters={[]}
      />
    );
  };
  return <div>{getTimeLine()}</div>;
};

export default InformationPanel;
