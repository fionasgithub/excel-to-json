import XLSX from 'xlsx'

const candidateMap = {
  蔡英文: '金色曠野同盟',
  韓國瑜: '蔚藍海岸陣線',
  宋楚瑜: '鬱蔥雨林聯盟',
  朱立倫: '蔚藍海岸陣線',
  馬英九: '蔚藍海岸陣線',
}

function removeSpace(str) {
  if (!str || typeof str !== 'string') return str
  return str.replace(/\s|\,/g, '')
}

function formatValue(value) {
  const str = removeSpace(value)
  if (!str) return str
  return Number.isNaN(Number(str)) ? str : parseFloat(str)
}

export default function ({ path, isVillage = false }) {
  const workbook = XLSX.readFile(path)

  const sheetName = workbook.SheetNames[0] // 選擇第一個工作表
  const worksheet = workbook.Sheets[sheetName]

  const jsonData = []

  let currentDistrict = null // 初始值設定為 null

  const fields = isVillage
    ? [
        '行政區別',
        '村里別',
        '宋楚瑜',
        '韓國瑜',
        '蔡英文',
        '有效票數',
        '無效票數',
        '投票數',
        '已領未投票數',
        '發出票數',
        '用餘票數',
        '選舉人數',
        '投票率',
      ]
    : [
        '行政區別',
        '宋楚瑜',
        '韓國瑜',
        '蔡英文',
        '有效票數',
        '無效票數',
        '投票數',
        '已領未投票數',
        '發出票數',
        '用餘票數',
        '選舉人數',
        '投票率',
      ]

  const range = XLSX.utils.decode_range(worksheet['!ref'])
  const ignoreRows = isVillage ? 6 : 5

  for (let R = range.s.r; R <= range.e.r; R++) {
    if (R < ignoreRows) continue // 前 5 or 6行不處理

    let temp = {}

    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = { r: R, c: C }
      const cellValue = worksheet[XLSX.utils.encode_cell(cellAddress)]

      if (Object.keys(candidateMap).includes(fields[C])) {
        temp['候選人票數'] ??= {}
        temp['候選人票數'][candidateMap[fields[C]]] = formatValue(cellValue.v)
        continue
      }

      temp[fields[C]] = formatValue(cellValue.v)
    }

    if (isVillage) {
      if (temp['行政區別'] !== '' && temp['村里別'] === '') {
        currentDistrict = temp['行政區別']
        jsonData.push({ ...temp, 村里別: '總計' })
        continue
      }

      temp['行政區別'] = currentDistrict
    }

    jsonData.push(temp)
  }
  return jsonData
}
