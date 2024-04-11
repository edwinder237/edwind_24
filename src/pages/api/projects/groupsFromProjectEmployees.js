export default function handler(req, res) {

    const { aggregatedGroups,index } = req.body;

    //this function grabs unique values from the group key then creates an array that filters 

    

  
    const result = {
      aggregatedGroups:aggregatedGroups,
      projectIndex:index

    }
    return res.status(200).json({...result});
  }