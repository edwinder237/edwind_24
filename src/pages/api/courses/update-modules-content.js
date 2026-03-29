import { createHandler } from '../../../lib/api/createHandler';

export default createHandler({
  scope: 'org',
  POST: (req, res) => {
    const { updatedJSONContent } = req.body;

    return res.status(200).json({ content: updatedJSONContent });
  }
});
