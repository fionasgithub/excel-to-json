import fs from 'fs'
import _ from 'lodash'

const files = fs.readdirSync('output')

let list = {}
files.forEach((name, i) => {
  if (name === '全國.json') return

  const json = fs.readFileSync(`output/${name}`, 'utf8')
  const data = JSON.parse(json)
  const city = name.substring(0, 3)

  data
    .filter((item) => item['行政區別'] !== '總計' || item['村里別'] !== '總計')
    .reduce((res, item) => {
      if (!item['村里別'] || item['村里別'] === '總計') return res

      res[city] ??= []
      res[city].push(item['行政區別'])
      res[city] = _.uniq(res[city])
      // res[city][item['行政區別']].push(item['村里別'])
      return res
    }, list)
})

fs.writeFileSync(
  'administrative_area/administrative_area.json',
  JSON.stringify(list),
  'utf-8',
)
