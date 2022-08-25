import React from 'react';

// type TimelineProps = {
//   trace: any;
//   setCoverage: any;
//   filters: Filter[];
// };

const Timeline: React.FC<any> = ({
  trace,
  setCoverage,
  filters,
}): JSX.Element => {
  // const timeline = createTimeline({ trace, setCoverage, filters });
  return <></>;
  // return (
  //   <div style={{ left: '10px', height: '90vh', width: '60vw' }}>
  //     {timeline}
  //   </div>
  // );
};

// const applyFilters = (trace: any[], filters: any[]): any[] => {
//   return trace
//     .flat()
//     .filter((item) => !item.cardDetailedText?.includes('node_modules'));
// };

// const createTimeline = (params: TimelineProps): ReactElement => {
//   const items = applyFilters(params.trace, params.filters);
//   console.log(items, 'items');
//   return <></>;
// };

export default Timeline;
