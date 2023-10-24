const XLSX = require("xlsx");

module.exports.excelToJson = function excelToJson({ path, isVillage = false }) {
  const workbook = XLSX.readFile(path);

  const sheetName = workbook.SheetNames[0]; // 選擇第一個工作表
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = [];

  let currentRow = -1; // 初始值設定為-1
  let currentDistrict = null; // 初始值設定為 null

  const fields = isVillage
    ? [
        "行政區別",
        "村里別",
        "宋楚瑜",
        "韓國瑜",
        "蔡英文",
        "有效票數",
        "無效票數",
        "投票數",
        "已領未投票數",
        "發出票數",
        "用餘票數",
        "選舉人數",
        "投票率",
      ]
    : [
        "行政區別",
        "宋楚瑜",
        "韓國瑜",
        "蔡英文",
        "有效票數",
        "無效票數",
        "投票數",
        "已領未投票數",
        "發出票數",
        "用餘票數",
        "選舉人數",
        "投票率",
      ];

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  const ignoreRows = isVillage ? 6 : 5;

  for (let R = range.s.r; R <= range.e.r; R++) {
    if (R < ignoreRows) continue; // 前 5 or 6行不處理

    let temp = {};

    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell_address = { r: R, c: C };
      const cell_value = worksheet[XLSX.utils.encode_cell(cell_address)];

      temp[fields[C]] = cell_value["v"].trim();
    }

    if (isVillage) {
      if (temp["行政區別"] !== "" && temp["村里別"] === "") {
        currentDistrict = temp["行政區別"];
        continue;
      }

      temp["行政區別"] = currentDistrict;
    }

    currentRow = R; // 更新當前行的值
    jsonData.push(temp); // 將上一行的數據添加到jsonData
    temp = {}; // 清空temp
  }
  return jsonData;
};
