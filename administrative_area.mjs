import fs from 'fs'
import XLSX from 'xlsx'

export function generateAdministrativeArea(year) {
  const directoryPath = `source/${year}`
  const files = fs
    .readdirSync(directoryPath)
    .filter((filename) => filename.includes('A05-2'))

  const jsonData = {}

  files.forEach((filename) => {
    const path = `${directoryPath}/${filename}`
    const workbook = XLSX.readFile(path)
    const sheetName = workbook.SheetNames[0] // 選擇第一個工作表
    const worksheet = workbook.Sheets[sheetName]
    const range = XLSX.utils.decode_range(worksheet['!ref'])

    const city = filename.substring(
      filename.indexOf('(') + 1,
      filename.indexOf(')'),
    )
    jsonData[city] ??= []

    const ignoreRows = 5

    for (let R = range.s.r; R <= range.e.r; R++) {
      if (R < ignoreRows) continue // 前 5 行不處理

      const districtAddress = { r: R, c: 0 }
      const districtData = worksheet[XLSX.utils.encode_cell(districtAddress)]

      const district = districtData.v.trim().replace(/\s/g, '')

      if (district === '總計') continue

      jsonData[city].push(district)
    }

    fs.writeFileSync(
      `administrative_area/${year}.json`,
      JSON.stringify(jsonData),
      'utf-8',
    )
  })
}
