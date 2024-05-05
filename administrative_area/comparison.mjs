import fs from 'fs'
import _ from 'lodash'

export function findAreaDiff() {
  const year2012 = JSON.parse(
    fs.readFileSync('administrative_area/2012.json', 'utf-8'),
  )

  const year2016 = JSON.parse(
    fs.readFileSync('administrative_area/2016.json', 'utf-8'),
  )

  console.log(Object.keys(year2012).length, Object.keys(year2016).length)

  for (const row in year2012) {
    const diff = _.difference(year2016[row], year2012[row])
    if (diff.length > 0) {
      console.log(row)
      console.log(diff)
    }
  }
  const files2012 = fs.readdirSync('output/2012')
  const files2016 = fs.readdirSync('output/2016')
  const files2020 = fs.readdirSync('output/2020')

  const diff = _.difference(files2012, files2016)
  console.log(diff)
  return diff
}
