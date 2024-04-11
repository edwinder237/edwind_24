import CardContent from 'themes/overrides/CardContent';
import { v4 as uuidv4 } from 'uuid';


export const data = [
    {
      id: '11',
      sortorder: 2,
      name: "Kick-off meeting",
      summary: "a lot of fun",
      duration: 54,
      section_id: null,
      uuid: "0e141fae-a283-11ed-828b-7054d2174593",
      hasChildren: 1,
      modules: [
        {
          id: '1',
          name: "introduction",
          uuid: "43efb55c-a283-11ed-828b-7054d2174593",
          summary: "Really fun",
          duration: 5,
          sortorder: 1.1,
          activities: [
            {
              id: '6',
              name: "lecture",
              uuid: "72b7ca52-a283-11ed-828b-7054d2174593",
              summary: "will be awesome",
              duration: 8,
              sortorder: 1,
              category: 'practical' 
            },
            {
              id: '7',
              name: "video",
              uuid: "72b7cf00-a283-11ed-828b-7054d2174593",
              summary: "will be awesome",
              duration: 9,
              sortorder: 1,
              category: 'practical' 
            },
            {
              id: '8',
              name: "sleep",
              uuid: "72b7d33c-a283-11ed-828b-7054d2174593",
              summary: "will be awesome",
              duration: 15,
              sortorder: 1,
              category: 'passive' 
            },
            {
              id: '9',
              name: "snap",
              uuid: "72b7d77e-a283-11ed-828b-7054d2174593",
              summary: "will be awesome",
              duration: 2,
              sortorder: 1,
              category: 'passive' 
            },
            {
              id: '10',
              name: "sleep",
              uuid: "72b7da8b-a283-11ed-828b-7054d2174593",
              summary: "will be awesome",
              duration: 4,
              sortorder: 1,
              category: 'quiz' 
            }
          ],
          hasChildren: true
        },
        {
          id: '2',
          name: "how to do it",
          uuid: "43efbc2d-a283-11ed-828b-7054d2174593",
          summary: "a lot of fun",
          duration: 1,
          sortorder: 1.2,
          activities: [
            {
              id: '1',
              name: "jump",
              uuid: "72b7669b-a283-11ed-828b-7054d2174593",
              summary: "will be awesome",
              duration: 5,
              sortorder: 1,
              category: 'quiz' 
            },
            {
              id: '2',
              name: "do stuff",
              uuid: "72b7908a-a283-11ed-828b-7054d2174593",
              summary: "will be awesome",
              duration: 10,
              sortorder: 1,
              category: 'passive' 
            }
          ],
          hasChildren: true
        },
        {
          id: '3',
          name: "groupe section",
          uuid: "43efbe31-a283-11ed-828b-7054d2174593",
          summary: "a lot of fun",
          duration: 6,
          sortorder: 1.3,
          activities: null,
          hasChildren: false
        },
        {
          id: '4',
          name: "the pwoer of selling",
          uuid: "43efc0ca-a283-11ed-828b-7054d2174593",
          summary: "a lot of fun",
          duration: 12,
          sortorder: 1.4,
          activities: [
            {
              id: '3',
              name: "quiz",
              uuid: "72b793ed-a283-11ed-828b-7054d2174593",
              summary: "will be awesome",
              duration: 12,
              sortorder: 1,
              category: 'practical' 
            },
            {
              id: '4',
              name: "lecture",
              uuid: "72b7b351-a283-11ed-828b-7054d2174593",
              summary: "will be awesome",
              duration: 5,
              sortorder: 1,
              category: 'practical' 
            },
            {
              id: '5',
              name: "play",
              uuid: "72b7b64b-a283-11ed-828b-7054d2174593",
              summary: "will be awesome",
              duration: 7,
              sortorder: 1,
              category: 'quiz' 
            }
          ],
          hasChildren: true
        },
        {
          id: '5',
          name: "lets face it",
          uuid: "43efc4b1-a283-11ed-828b-7054d2174593",
          summary: "a lot of fun",
          duration: 5,
          sortorder: 1.5,
          activities: null,
          hasChildren: false
        },
        {
          id: '6',
          name: "the end",
          uuid: "43efc6d9-a283-11ed-828b-7054d2174593",
          summary: "a lot of fun",
          duration: 12,
          sortorder: 1.6,
          activities: null,
          hasChildren: false
        }
      ]
    },
    {
      id: '12',
      sortorder: 3,
      name: "ales rep training 1 (CRM)",
      summary: "a lot of fun",
      duration: 54,
      section_id: null,
      uuid: "0e14511c-a283-11ed-828b-7054d2174593",
      hasChildren: 1,
      modules: [
        {
          id: '7',
          name: "2nd intro",
          uuid: "43efc894-a283-11ed-828b-7054d2174593",
          summary: "this is strange",
          duration: 14,
          sortorder: 2.1,
          activities: null,
          hasChildren: false
        },
        {
          id: '8',
          name: "life is good",
          uuid: "43efca3c-a283-11ed-828b-7054d2174593",
          summary: "this is strange",
          duration: 2,
          sortorder: 2.2,
          activities: null,
          hasChildren: false
        },
        {
          id: '9',
          name: "ok ok",
          uuid: "43efcc3b-a283-11ed-828b-7054d2174593",
          summary: "this is strange",
          duration: 6,
          sortorder: 2.3,
          activities: null,
          hasChildren: false
        },
        {
          id: '10',
          name: "my car is cool",
          uuid: "43efcdf0-a283-11ed-828b-7054d2174593",
          summary: "this is strange",
          duration: 2,
          sortorder: 2.4,
          activities: null,
          hasChildren: false
        },
        {
          id: '11',
          name: "if only",
          uuid: "43efcff1-a283-11ed-828b-7054d2174593",
          summary: "this is strange",
          duration: 9,
          sortorder: 2.5,
          activities: null,
          hasChildren: false
        },
        {
          id: '12',
          name: "you could read",
          uuid: "43efd19a-a283-11ed-828b-7054d2174593",
          summary: "this is strange",
          duration: 14,
          sortorder: 2.6,
          activities: null,
          hasChildren: false
        },
        {
          id: '13',
          name: "jeez",
          uuid: "43efd33d-a283-11ed-828b-7054d2174593",
          summary: "this is strange",
          duration: 7,
          sortorder: 2.7,
          activities: null,
          hasChildren: false
        },
        {
          id: '14',
          name: "whats wrong?",
          uuid: "43efd4df-a283-11ed-828b-7054d2174593",
          summary: "this is strange",
          duration: 5,
          sortorder: 2.8,
          activities: null,
          hasChildren: false
        }
      ]
    },
    {
      id: '13',
      sortorder: 4,
      name: "Sales rep training 2 (Desking)",
      summary: "a lot of fun",
      duration: 54,
      section_id: null,
      uuid: "0e145902-a283-11ed-828b-7054d2174593",
      hasChildren: 0,
      modules: null
    },
    {
      id: '14',
      sortorder: 5,
      name: "Sales rep training 3 (Desking)",
      summary: "a lot of fun",
      duration: 54,
      section_id: null,
      uuid: "0e145db5-a283-11ed-828b-7054d2174593",
      hasChildren: 0,
      modules: null
    },
    {
      id: '15',
      sortorder: 6,
      name: "Sales rep training 4 (CRM)",
      summary: "a lot of fun",
      duration: 54,
      section_id: null,
      uuid: "0e1461f5-a283-11ed-828b-7054d2174593",
      hasChildren: 0,
      modules: null
    },
    {
      id: '16',
      sortorder: 7,
      name: "Sales Manager training 1 (CRM)",
      summary: "a lot of fun",
      duration: 54,
      section_id: null,
      uuid: "0e146552-a283-11ed-828b-7054d2174593",
      hasChildren: 0,
      modules: null
    },
    {
      id:'17',
      sortorder: 8,
      name: "Sales Manager training 2 (DESKING)",
      summary: "a lot of fun",
      duration: 54,
      section_id: null,
      uuid: "0e1467c2-a283-11ed-828b-7054d2174593",
      hasChildren: 0,
      modules: null
    },
    {
      id: '46',
      sortorder: 9,
      name: "Other transansaction types",
      summary: "Desking training ",
      duration: 60,
      section_id: null,
      uuid: "ee802c36-0229-4d4f-a855-a381aba0a672",
      hasChildren: 0,
      modules: null
    }
  ]
  