import fs from 'fs'
import XLSX from 'xlsx'

const fieldsFile = fs.readFileSync('fields.json', 'utf-8')
const myFields = JSON.parse(fieldsFile)

const candidateMap = {
  蔡英文: 'savannah',
  韓國瑜: 'coast',
  宋楚瑜: 'rainforest',
  朱立倫: 'coast',
  馬英九: 'coast',
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

const fieldMap = {
  administrativeDivision: '行政區別',
  village: '村里別',
  candidateVotes: '候選人票數',
  validVotes: '有效票數',
  invalidVotes: '無效票數',
  totalVotes: '投票數',
  receivedUnvoted: '已領未投票數',
  issuedVotes: '發出票數',
  remainingVotes: '用餘票數',
  eligibleVoters: '選舉人數',
  voterTurnout: '投票率"',
}

// Sample data
// {
//   "administrativeDivision": "Lugu Township",
//   "village": "Total",
//   "candidateVotes": {
//     "savannah": 4845,
//     "coast": 5718,
//     "rainforest": 308
//   },
//   "validVotes": 10871,
//   "invalidVotes": 110,
//   "totalVotes": 10981,
//   "receivedUnvoted": 0,
//   "issuedVotes": 10981,
//   "remainingVotes": 4772,
//   "eligibleVoters": 15753,
//   "voterTurnout": 69.70999908447266
// }

export function convertExcelToJson({ path, isVillage = false, year }) {
  const workbook = XLSX.readFile(path)

  const sheetName = workbook.SheetNames[0] // 選擇第一個工作表
  const worksheet = workbook.Sheets[sheetName]

  const jsonData = []

  let currentDistrict = null // 初始值設定為 null

  const fields = isVillage
    ? myFields[year].withVillage
    : myFields[year].noVillage

  const range = XLSX.utils.decode_range(worksheet['!ref'])
  const ignoreRows = isVillage ? 6 : 5

  for (let R = range.s.r; R <= range.e.r; R++) {
    if (R < ignoreRows) continue // 前 5 or 6行不處理

    let temp = {}

    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = { r: R, c: C }
      const cellValue = worksheet[XLSX.utils.encode_cell(cellAddress)]

      if (Object.keys(candidateMap).includes(fields[C])) {
        temp.candidateVotes ??= {}
        temp.candidateVotes[candidateMap[fields[C]]] = formatValue(cellValue.v)
        continue
      }

      temp[fields[C]] = formatValue(cellValue.v)
    }

    if (isVillage) {
      if (temp.administrativeDivision !== '' && temp.village === '') {
        currentDistrict = temp.administrativeDivision
        jsonData.push({ ...temp, village: '總計' })
        continue
      }

      temp.administrativeDivision = currentDistrict
    }

    jsonData.push(temp)
  }
  return jsonData
}

export function storeValueToOutput(year) {
  const directoryPath = `source/${year}`

  const administrative_area = JSON.parse(
    fs.readFileSync(`administrative_area/administrative_area.json`, 'utf-8'),
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

      if (isVillage) {
        for (const cityId in administrative_area) {
          for (const districtId in administrative_area[cityId].districts) {
            const data = result.filter(
              (row) =>
                row.administrativeDivision ===
                administrative_area[cityId].districts[districtId].name,
            )
            if (data.length === 0) continue

            const jsonContent = JSON.stringify(data, null, 2)
            fs.writeFileSync(`votes/${year}/${districtId}.json`, jsonContent)
            continue
          }
        }
      } else {
        const cityName = filename
          .substring(filename.indexOf('(') + 1, filename.indexOf(')'))
          .replace(/\s/g, '')

        const cityId = (
          Object.values(administrative_area).find(
            ({ name }) => name.slice(0, 2) === cityName.slice(0, 2),
          ) || {}
        ).id

        const jsonContent = JSON.stringify(result, null, 2)
        fs.writeFileSync(
          `votes/${year}/${cityId ? cityId : 'all'}.json`,
          jsonContent,
        )
      }
    })
  } catch (err) {
    console.error('Error reading directory:', err)
  }
}
