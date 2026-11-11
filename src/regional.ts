export const reports = [
 { storage:14.4,days:6,status:'Critical',demand:523,households:68,inflow:0.3,campus:91,utilization:82,participation:12,notice:'Regional consumption remains above the recommended target. Current conservation measures remain in effect.' },
 { storage:14.0,days:4,status:'Declining',demand:537,households:65,inflow:0.1,campus:90,utilization:84,participation:13,notice:'Reservoir storage has declined following increased regional demand. Conservation targets remain active.' },
 { storage:13.8,days:3,status:'Critical',demand:549,households:63,inflow:0,campus:89,utilization:86,participation:13,notice:'Emergency water projections have shortened. Participating institutions are maintaining enhanced conservation measures.' },
 { storage:14.3,days:5,status:'Stabilizing',demand:516,households:72,inflow:0.4,campus:92,utilization:80,participation:14,notice:'Reduced consumption and improved supply conditions have temporarily stabilized regional storage.' },
 { storage:14.7,days:8,status:'Stabilizing',demand:480,households:76,inflow:0.7,campus:93,utilization:78,participation:15,notice:'Recent conservation performance has extended the Day Zero projection. Regional monitoring continues.' },
 { storage:14.2,days:5,status:'Critical',demand:528,households:69,inflow:0.2,campus:91,utilization:82,participation:15,notice:'Regional demand has increased. The Water Authority continues to monitor emergency supply conditions.' }
];
export function assessment(epoch:number,now:number){const period=Math.max(0,Math.floor((now-epoch)/30000));return {report:reports[period%6],cycle:period%6,period,updated:epoch+period*30000};}
