import fs from 'fs'
import _ from 'lodash'
import excelToJson from './excelToJson.mjs'

const directoryPath = 'source'

const administrative_area = JSON.parse(
  fs.readFileSync('administrative_area/administrative_area.json', 'utf-8'),
)

try {
  const files = fs.readdirSync(directoryPath)

  files.forEach((filename) => {
    if (filename.includes('4')) return

    const isVillage = filename.includes('3')

    const result = excelToJson({
      path: `source/${filename}`,
      isVillage,
    })

    if (result.length === 0) return

    const cityname = filename
      .substring(filename.indexOf('(') + 1, filename.indexOf(')'))
      .replace(/\s/g, '')

    if (isVillage) {
      for (const city in administrative_area) {
        for (const district in administrative_area[city]) {
          const data = result.filter((row) => row['行政區別'] === district)
          if (data.length === 0) continue

          const jsonContent = JSON.stringify(data, null, 2)
          fs.writeFileSync(`output/${city}-${district}.json`, jsonContent)
          continue
        }
      }
    } else {
      const jsonContent = JSON.stringify(result, null, 2)
      fs.writeFileSync(
        `output/${cityname === '中央' ? '全國' : cityname}.json`,
        jsonContent,
      )
    }
  })
} catch (err) {
  console.error('Error reading directory:', err)
}
