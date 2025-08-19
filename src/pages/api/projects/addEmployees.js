export default function handler(req, res) {
    const { newEmployee,employees } = req.body;

  
    const result = {
      employees: [...employees,newEmployee]

    }
    return res.status(200).json({ ...result });
  }