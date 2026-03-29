import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { aggregatedGroups, index } = req.body;

    //this function grabs unique values from the group key then creates an array that filters

    const result = {
      aggregatedGroups: aggregatedGroups,
      projectIndex: index
    };
    return res.status(200).json({ ...result });
  }
});
