import {data} from './fakeCourses';
import getActivityIndex from 'utils/getIndex'

//console.log(getActivityIndex())


const columnIdsData = {
  column1: 'column-1',
  column2: 'column-2',
  column3: 'column-3'
};

export default async function handler(req, res) {
  const {courseIndex} = req.body;

    const modules = await data[courseIndex].modules[1].activities
    let returnArray = []
    modules.forEach((module) => {
        returnArray.push(module.id)
    })


  const columnsData = [
    {
      id: columnIdsData.column2,
      title: 'New',
      itemIds: returnArray
    },
  
  ];

  return res.status(200).json({ columns: columnsData });
}
