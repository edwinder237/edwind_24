import { add, set, sub } from 'date-fns';
import {data} from './fakeCourses';
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
const profileIdsData = {
  profile1: 'profile-1',
  profile2: 'profile-2',
  profile3: 'profile-3'
};
const commentIdsData = {
  comment1: 'comment-1',
  comment2: 'comment-2',
  comment3: 'comment-3',
  comment4: 'comment-4',
  comment5: 'comment-5'
};
const itemsData = data.map((item, index) => ({
  
    assign: profileIdsData.profile1,
    attachments: [],
    commentIds: [commentIdsData.comment1],
    duration: item.duration,
    description: item.summary,
    dueDate: sub(new Date(), { days: 12 }),
    sortorder: item.sortorder,
    id: item.id,
    image: 'profile-back-1.png',
    priority: 'low',
    title: item.name,
    hasChildren:item.hasChildren,
    modules: item.modules && item.modules,
    
}));
export default function handler(req, res) {
  return res.status(200).json({ items: itemsData });
}
