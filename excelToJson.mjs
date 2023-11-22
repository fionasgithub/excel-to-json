import fs from 'fs'
import XLSX from 'xlsx'

const fieldsFile = fs.readFileSync('fields.json', 'utf-8')
const myFields = JSON.parse(fieldsFile)

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

export function convertExcelToJson({ path, isVillage = false, year }) {
  const workbook = XLSX.readFile(path)

  const sheetName = workbook.SheetNames[0] // 選擇第一個工作表
  const worksheet = workbook.Sheets[sheetName]

  const jsonData = []

  let currentDistrict = null // 初始值設定為 null

  const fields = [...myFields[year]]
  isVillage ? fields.splice(1, 1) : fields
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

export function storeValueToOutput(year) {
  const directoryPath = `source/${year}`

  const administrative_area = JSON.parse(
    fs.readFileSync(`administrative_area/${year}.json`, 'utf-8'),
  )

  try {
    const files = fs.readdirSync(directoryPath)

    files.forEach((filename) => {
      if (filename.includes('概況表')) return
      if (filename.includes('4')) return

      const isVillage = filename.includes('3')

      const result = convertExcelToJson({
        path: `${directoryPath}/${filename}`,
        isVillage,
        year,
      })

      if (result.length === 0) return

      const cityname = filename
        .substring(filename.indexOf('(') + 1, filename.indexOf(')'))
        .replace(/\s/g, '')

      if (isVillage) {
        for (const city in administrative_area) {
          for (const district of administrative_area[city]) {
            const data = result.filter((row) => row['行政區別'] === district)
            if (data.length === 0) continue

            const jsonContent = JSON.stringify(data, null, 2)
            fs.writeFileSync(
              `output/${year}/${city}-${district}.json`,
              jsonContent,
            )
            continue
          }
        }
      } else {
        const jsonContent = JSON.stringify(result, null, 2)
        fs.writeFileSync(
          `output/${year}/${cityname === '中央' ? '全國' : cityname}.json`,
          jsonContent,
        )
      }
    })
  } catch (err) {
    console.error('Error reading directory:', err)
  }
}
