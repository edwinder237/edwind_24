import { Chance } from 'chance';
import { add, set, sub } from 'date-fns';
import {data} from './fakeCourses';
const chance = new Chance();
const profileIdsData = {
  profile1: 'profile-1',
  profile2: 'profile-2',
  profile3: 'profile-3'
};

const userStoryIdsData = {
  userStory1: `1`,
  userStory2: `2`,
  userStory3: `3`,
  userStory4: `4`
};

const itemIdsData = data.map(item => item.id);

const columnIdsData = {
  column1: 'column-1',
};

const commentIdsData = {
  comment1: 'comment-1',
  comment2: 'comment-2',
  comment3: 'comment-3',
  comment4: 'comment-4',
  comment5: 'comment-5'
};

const userStoryData = [
  {
    acceptance: '',
    assign: profileIdsData.profile2,
    columnId: columnIdsData.column3,
    commentIds: [commentIdsData.comment5],
    description: chance.sentence(),
    dueDate: add(new Date(), { days: 12 }),
    id: userStoryIdsData.userStory1,
    priority: 'low',
    title: 'School Management Backend',
    itemIds: []
  },
  {
    acceptance: chance.sentence(),
    assign: profileIdsData.profile3,
    columnId: columnIdsData.column1,
    commentIds: [commentIdsData.comment3],
    description: chance.sentence(),
    dueDate: add(new Date(), { days: 8 }),
    id: userStoryIdsData.userStory2,
    priority: 'high',
    title: 'Inventory Implementation & Design',
    itemIds: []
  },
  {
    acceptance: chance.sentence({ words: 10 }),
    assign: profileIdsData.profile3,
    columnId: columnIdsData.column3,
    commentIds: [commentIdsData.comment3, commentIdsData.comment4],
    description: chance.sentence(),
    dueDate: set(new Date(), { hours: 10, minutes: 30 }),
    id: userStoryIdsData.userStory3,
    priority: 'medium',
    title: 'Theme migration from v4 to v5',
    itemIds: []
  },
  {
    acceptance: chance.sentence({ words: 5 }),
    assign: profileIdsData.profile1,
    columnId: columnIdsData.column3,
    commentIds: [commentIdsData.comment4],
    description: chance.sentence(),
    dueDate: sub(new Date(), { days: 8 }),
    id: userStoryIdsData.userStory4,
    priority: 'low',
    title: 'Lunch Beauty Application',
    itemIds: []
  }
];

export default function handler(req, res) {
  return res.status(200).json({ userStory: userStoryData });
}
