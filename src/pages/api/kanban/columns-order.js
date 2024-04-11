const columnIdsData = {
  column1: 'column-1'
};
const columnsOrderData = [columnIdsData.column1];
export default function handler(req, res) {
  return res.status(200).json({ columnsOrder: columnsOrderData });
}
