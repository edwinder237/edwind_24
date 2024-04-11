export default function handler(req, res) {

    const { newGroup,groups,index } = req.body;
  
    const result = {
      newGroupsArray: [newGroup,...groups],
      projectIndex:index
    }

    return res.status(200).json({ ...result });
  }