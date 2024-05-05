import fs from 'fs'
import XLSX from 'xlsx'
import { findAreaDiff } from './administrative_area/comparison.mjs'

const area = JSON.parse(fs.readFileSync('topoJSON/district.json', 'utf-8'))

// generate administrative area json file
export function generateAdministrativeArea() {
  // 1. import source file
  const directoryPath = 'source/2020'
  const files = fs
    .readdirSync(directoryPath)
    .filter((filename) => filename.includes('A05-2'))

  // 2. get area difference
  const areaDiff = findAreaDiff()

  // 3. generate administrative area json file
  const jsonData = {}

  files.forEach((filename) => {
    const path = `${directoryPath}/${filename}`
    const workbook = XLSX.readFile(path)
    const sheetName = workbook.SheetNames[0] // select the first sheet
    const worksheet = workbook.Sheets[sheetName]
    const range = XLSX.utils.decode_range(worksheet['!ref'])

    const ignoreRows = 5

    for (let R = range.s.r; R <= range.e.r; R++) {
      if (R < ignoreRows) continue // do not handle the first 5 rows

      const districtAddress = { r: R, c: 0 }
      const districtData = worksheet[XLSX.utils.encode_cell(districtAddress)]

      const district = districtData.v.trim().replace(/\s/g, '')

      if (district === '總計') continue

      // 3.1 find town === district
      const town = area.objects.TOWN_MOI_1120825.geometries.find(
        ({ properties }) => properties.TOWNNAME === district,
      )

      // 3.2-1 set city
      jsonData[town.properties.COUNTYID] ??= {
        id: town.properties.COUNTYID,
        name: town.properties.COUNTYNAME,
        historicalNames: {},
        districts: {},
      }

      // 3.2-2 set city historical name
      const diffCityName = areaDiff.find(
        (area) =>
          town.properties.COUNTYNAME.slice(0, 2) ===
          area.split('-')[0].slice(0, 2),
      )
      if (diffCityName) {
        jsonData[town.properties.COUNTYID].historicalNames['2012'] =
          diffCityName.split('-')[0]
      }

      // 3.3-1 set district
      jsonData[town.properties.COUNTYID].districts[[town.properties.TOWNID]] = {
        id: town.properties.TOWNID,
        name: town.properties.TOWNNAME,
        historicalNames: {},
      }

      // 3.3-2 set district historical name
      const diffDistrictName = areaDiff.find((area) =>
        town.properties.TOWNNAME.includes(area.slice(4, 6)),
      )
      if (diffDistrictName) {
        jsonData[town.properties.COUNTYID].districts[
          [town.properties.TOWNID]
        ].historicalNames['2012'] = diffDistrictName.slice(4, 7)
      }
    }

    // 3.4 write json file
    fs.writeFileSync(
      `administrative_area/administrative_area.json`,
      JSON.stringify(jsonData),
      'utf-8',
    )
  })
}
