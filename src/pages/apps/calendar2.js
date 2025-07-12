//import Layout from '@/components/layout'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import timeGridPlugin from '@fullcalendar/timegrid'

const cal = [{
  title: 'my event',
  start: '2023-09-12T10:30:00',
  end: '2023-09-12T17:30:00',
},
{
  title: 'my event',
  start: '2023-09-13T13:30:00',
  end: '2023-09-13T17:30:00',
},

]

export default function CalendarPage() {

  
  return (
 
        <FullCalendar
          plugins={[
            resourceTimelinePlugin,
            dayGridPlugin,
            interactionPlugin,
            timeGridPlugin
          ]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineWeek,dayGridMonth,timeGridWeek'
          }}
          initialView='resourceTimelineWeek'
          nowIndicator={true}
          editable={true}
          selectable={true}
          selectMirror={true}

          timeZone = 'America/New_York'

          events= {cal}
          
        />

  )
}