export default function handler(req, res) {

    const { updatedGroups,index } = req.body;
    const result = {
      newGroupsArray: updatedGroups,
      projectIndex:index
    }
    return res.status(200).json({ ...result });
  }