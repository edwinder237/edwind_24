import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: async (req, res) => {
    const { newEmployee, employees } = req.body;

    const result = {
      employees: [...employees, newEmployee]
    };
    return res.status(200).json({ ...result });
  }
});
