export function getModules(array) {
  //console.log(array)
  let returnArray = [];
  array[1] &&
    array[1].modules.forEach((item) => {
      returnArray.push(item.id);
    });
  return returnArray;
}
