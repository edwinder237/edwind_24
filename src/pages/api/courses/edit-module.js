export default function handler(req, res) {
  const { editedModule,modules} = req.body;
  modules.splice(
    modules.findIndex((module) => module.id === editedModule.id ),
    1,
    editedModule
  );



  return res.status(200).json({ modules });
}
