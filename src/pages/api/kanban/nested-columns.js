import {data} from './fakeCourses';
import {getModules} from 'utils/getModules'


const itemIdsData = {
  item1: `1`,
  item2: `2`,
  item3: `3`,
  item4: `4`,
  item5: `5`,
  item6: `6`,
  item7: `7`,
  item8: `8`,
  item9: `9`,
  item10: `10`
};

const columnIdsData = {
  column1: 'column-1',
  column2: 'column-2',
  column3: 'column-3'
};

export default async function handler(req, res) {
  const {courseIndex} = req.body;

    const modules = await data[courseIndex].modules
    let returnArray = []
    modules.forEach((module) => {
        returnArray.push(module.id)
    })


  const columnsData = [
    {
      id: columnIdsData.column1,
      title: 'New',
      itemIds: returnArray
    },
  
  ];

  return res.status(200).json({ columns: columnsData });
}
